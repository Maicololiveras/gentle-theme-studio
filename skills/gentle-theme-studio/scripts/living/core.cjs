// Original pixels are immutable. Rotated, feathered regions are baked once; no model or frames on disk.
function createLivingEngine(){
 const kinds=['aura','glow','turn','protect'],unit=v=>Number.isFinite(v)&&v>=0&&v<=1;
 function validate(z){
  if(!z||!kinds.includes(z.kind)||![z.x,z.y,z.rx,z.ry,z.strength].every(unit)||!z.rx||!z.ry||!Number.isFinite(z.angle)||Math.abs(z.angle)>180||!/^#[a-f0-9]{6}$/i.test(z.tint)||!unit(z.phase))throw Error('Invalid motion region');
  return z;
 }
 const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 const clip=x=>Math.max(0,Math.min(1,x));
 function prepare(src,w,h,zones){
  if(src.length!==4*w*h||!w||!h||zones.length>16)throw Error('Invalid surface or too many regions');
  zones.forEach(validate);const base=new Uint8ClampedArray(src),out=new Uint8ClampedArray(base),protectedAt=new Float32Array(w*h);
  const mapped=[];
  for(const z of [...zones].sort((a,b)=>(b.kind==='protect')-(a.kind==='protect'))){
   const a=z.angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),rx=z.rx*w,ry=z.ry*h,cx=z.x*w,cy=z.y*h;
   const bx=Math.hypot(rx*c,ry*s),by=Math.hypot(rx*s,ry*c),ids=[],weights=[],xx=[],yy=[],gates=[];const tint=rgb(z.tint),peak=Math.max(1,...tint),target=tint.map(v=>v/peak);
   for(let y=Math.max(0,Math.floor(cy-by));y<=Math.min(h-1,Math.ceil(cy+by));y++)for(let x=Math.max(0,Math.floor(cx-bx));x<=Math.min(w-1,Math.ceil(cx+bx));x++){
    const u=((x-cx)*c+(y-cy)*s)/rx,v=(-(x-cx)*s+(y-cy)*c)/ry,r=u*u+v*v;
    if(r>=1)continue;const p=y*w+x,ed=clip((1-r)*2.4),f=ed*ed*(3-2*ed);
    if(z.kind==='protect'){protectedAt[p]=Math.max(protectedAt[p],f*z.strength);continue}
    if(protectedAt[p]>=1||!base[p*4+3])continue;
    const j=4*p,pk=Math.max(1,base[j],base[j+1],base[j+2]);
    const diff=Math.max(...target.map((n,k)=>Math.abs(n-base[j+k]/pk)));
    const gate=z.kind==='turn'?1:clip((.85-diff)/.63)*clip(pk/70);
    ids.push(p);weights.push(f*z.strength*(1-protectedAt[p]));xx.push(u);yy.push(v);gates.push(gate);
   }
   if(ids.length)mapped.push({z,tint,ids:Int32Array.from(ids),f:Float32Array.from(weights),u:Float32Array.from(xx),v:Float32Array.from(yy),gate:Float32Array.from(gates),rx,ry});
  }
  // Accumulate light and displacement; each output pixel is sampled once, even at overlaps.
  const active=Int32Array.from(new Set(mapped.flatMap(l=>Array.from(l.ids)))),dx=new Float32Array(w*h),dy=new Float32Array(w*h),light=new Float32Array(w*h*3);
  function frame(time){
   const loop=((time%8)+8)%8,theta=2*Math.PI*loop/8;
   for(const p of active){dx[p]=dy[p]=0;light.fill(0,p*3,p*3+3)}
   for(const {z,ids,f,u,v,gate,rx,ry,tint} of mapped){
    const t=theta+z.phase*2*Math.PI;
    for(let i=0;i<ids.length;i++){
     const p=ids[i],m=f[i],g=gate[i];let gain=0;
     if(z.kind==='turn'){
      // Shallow 2.5D yaw: more travel around the nose, zero at the anchored outline.
      dx[p]+=Math.min(rx*.075,8)*Math.sin(t)*m*(1-.55*u[i]*u[i]);dy[p]+=.009*ry*Math.sin(t)*m*u[i];
     }else if(z.kind==='aura'){
      const wave=Math.sin(2*t+v[i]*4.8+u[i]*1.1);
      dx[p]+=m*(.22+.78*g)*Math.min(rx*.075,5)*wave;
      dy[p]+=m*(.22+.78*g)*Math.min(ry*.045,4)*Math.sin(t+u[i]*2.7+v[i]*1.7);
      gain=m*g*(.06+.30*((1+wave)*.5)**2);
     }else{const pulse=(1-Math.cos(t))*.5;gain=m*(.16+.84*g)*pulse*pulse*.76}
     if(gain)for(let k=0;k<3;k++)light[p*3+k]+=gain*tint[k]/255;
    }
   }
   for(const p of active){
    const x=p%w,y=Math.floor(p/w),sx=Math.min(w-1,Math.max(0,x+dx[p])),sy=Math.min(h-1,Math.max(0,y+dy[p]));
    const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),a=y0*w+x0,b=y0*w+x1,c=y1*w+x0,d=y1*w+x1,tx=sx-x0,ty=sy-y0;
    const valid=[a,b,c,d].every(i=>protectedAt[i]===0&&base[4*i+3]===base[4*p+3]);
    for(let k=0;k<3;k++){let col=base[4*p+k];if(valid)col=(base[4*a+k]*(1-tx)+base[4*b+k]*tx)*(1-ty)+(base[4*c+k]*(1-tx)+base[4*d+k]*tx)*ty;
     out[4*p+k]=col+(255-col)*Math.min(.92,light[3*p+k]);}
   }return out;
  }
  return {frame,active:active.length};
 }
 function suggest(src,w,h){
  const candidates=[];
  for(let by=0;by<5;by++)for(let bx=0;bx<6;bx++){
   let best=null,score=0;for(let y=Math.floor(by*h/5);y<(by+1)*h/5;y+=3)for(let x=Math.floor(bx*w/6);x<(bx+1)*w/6;x+=3){
    const j=4*(y*w+x),v=Array.from(src.slice(j,j+3)),hi=Math.max(...v),lo=Math.min(...v),n=(hi-lo)*hi/255*src[j+3]/255;
    if(n>score){score=n;best={kind:'aura',x:x/w,y:y/h,rx:.10,ry:.14,angle:0,strength:.52,phase:0,tint:'#'+v.map(k=>k.toString(16).padStart(2,'0')).join('')}}
   }if(best&&score>35)candidates.push({best,score});
  }
  const picks=[];for(const {best} of candidates.sort((a,b)=>b.score-a.score))if(!picks.some(o=>Math.hypot(o.x-best.x,o.y-best.y)<.24)){picks.push(best);if(picks.length===3)break}return picks;
 }
 return {validate,prepare,suggest};
}
if(typeof module!=='undefined')module.exports=createLivingEngine;
