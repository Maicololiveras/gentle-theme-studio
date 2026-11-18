// The host model identifies objects from the source image. These are renderer capabilities.
export const motions = Object.freeze({
  window:['rain','wet-glass'], eye:['blink'], foliage:['leaves'], vapor:['steam'], light:['lamp']
});
export function inspectBlink(l){
  if(!Array.isArray(l.guides)||l.guides.length<3||l.guides.length>24) throw Error('Blink needs 3–24 lid guides');
  let prev=-1;
  for(const a of l.guides){
    if(!Array.isArray(a)||a.length!==5)throw Error('Expected [x,upperY,closedY,skin,lash]');
    const [x,u,d,c,k]=a;
    if(![x,u,d].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||x<=prev||d<u||
      ![c,k].every(s=>typeof s==='string'&&/^#[0-9a-f]{6}$/i.test(s)))throw Error('Invalid blink guide');
    prev=x;
  }
  if(l.paint!==undefined && (!Array.isArray(l.paint)||l.paint.length<2||l.paint.length>160||
    !l.paint.every(col=>typeof col==='string'&&/^(?:[0-9a-f]{6}){2,96}$/i.test(col))))throw Error('Invalid closed-lid texture');
}
// Called only during a blink; t is host time in seconds. Shared clock synchronizes both eyes.
export function eyelid(g,t,l){
  const b=g.image; if(!b||!l.intensity)return;
  const ph=((t+8.4)%10.3+10.3)%10.3;
  const dt=ph<.3?ph:ph-4.72;
  if(dt<0||dt>=.245)return;
  const raw=dt<.085?dt/.085:dt<.112?1:1-(dt-.112)/.133;
  const f=raw*raw*(3-2*raw)*l.intensity;
  if(f<.002)return;
  const a=l.guides;
  const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
  const mix=(c,d,h)=>'#'+c.map((v,i)=>Math.round(v+(d[i]-v)*h).toString(16).padStart(2,'0')).join('');
  if(l.paint){
    const width=(a[a.length-1][0]-a[0][0])*b.w/l.paint.length;
    let j=1;
    for(let i=0;i<l.paint.length;i++){
      const x=a[0][0]+(i+.5)*width/b.w;while(j<a.length-1&&x>a[j][0])j++;
      const [lx,lu,ld,,ink]=a[j-1],[rx,ru,rd]=a[j],q=(x-lx)/(rx-lx);
      const top=b.y+(lu+(ru-lu)*q)*b.h,base=b.y+(ld+(rd-ld)*q)*b.h,xx=b.x+x*b.w;
      const col=l.paint[i],n=col.length/6,stop=f*n;
      for(let k=0;k<stop;k++){
        g.line(xx,top+(base-top)*k/n,xx,top+(base-top)*Math.min(stop,k+1)/n,'#'+col.slice(k*6,k*6+6),Math.min(1,f*7),width+.08);
      }
      if(f<.97)g.line(xx,top+(base-top)*f,xx,top+(base-top)*f+.0015*b.h,ink,Math.min(1,f*9,(1-f)*5),width+.08);
    }
    return;
  }
  for(let j=1;j<a.length;j++){
    const [x,u,d,c,k]=a[j-1],[X,U,D,C,K]=a[j];
    const steps=Math.max(1,Math.min(64,Math.ceil((X-x)*b.w)));
    const cs=rgb(c),ce=rgb(C),ink=rgb(k),end=rgb(K);
    for(let i=0;i<steps;i++){
      const q=(i+.5)/steps, xx=b.x+(x+(X-x)*q)*b.w, top=b.y+(u+(U-u)*q)*b.h;
      const bottom=b.y+(d+(D-d)*q)*b.h, yy=top+(bottom-top)*f;
      const w=(X-x)*b.w/steps+.35;
      g.line(xx,top,xx,yy,mix(cs,ce,q),Math.min(1,f*8),w);
      g.line(xx,yy,xx,Math.min(bottom+1,yy+Math.max(.5,b.h*.0017)),mix(ink,end,q),Math.min(1,f*7),w);
    }
  }
}
// Fixed paths have two depths. Attached pairs coalesce, slide and fade out near the pane edge.
export function glass(g,t,l){
 const b=g.image;if(!b)return;
 const p=l.region,xs=p.map(a=>a[0]),ys=p.map(a=>a[1]),L=Math.min(...xs),U=Math.min(...ys),W=Math.max(...xs)-L,H=Math.max(...ys)-U;
 const inside=(x,y)=>{let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
 const [a,c]=p[i],[d,e]=p[j];if((c>y)!=(e>y)&&x<(d-a)*(y-c)/(e-c)+a)v=!v}return v};
 const X=x=>b.x+x*b.w,Y=y=>b.y+y*b.h, frac=x=>x-Math.floor(x);
 const bead=(x,y,r,alpha)=>{if(!inside(x-r,y-r*2)||!inside(x+r,y+r*2)||!inside(x-r,y+r*2)||!inside(x+r,y-r*2))return;
 g.ellipse(X(x),Y(y),r*b.w,r*1.8*b.h,'#321622',alpha*.48);
 g.ellipse(X(x-r*.27),Y(y-r*.5),r*.47*b.w,r*.62*b.h,'#f6b4bf',alpha*.68)};
 for(let i=0;i<Math.ceil(105*l.intensity*Math.min(1,Math.sqrt(W*H)*2.8));i++){
 const x=L+W*frac(i*.618034+.17), q=frac(i*.754877+.23),y=U+H*frac(q+t*(.13+.07*q));
 if(inside(x,y)&&inside(x-.001,y+.011))g.line(X(x),Y(y),X(x-.001),Y(y+.011),'#cd93ad',.26*l.intensity,Math.max(.5,b.w*.00052));
 const ax=L+W*frac(i*.414214+.28),ay=U+H*frac(i*.73205+.39);
 const phase=frac(q+t*(.076+.04*q)), glide=Math.max(0,(phase-.52)/.48), merge=Math.min(1,phase/.52);
 const cy=ay+.056*glide*glide,fade=Math.min(1,phase*14,(1-phase)*12);
 const r=.00068+.00067*q;
 if(phase<.52)bead(ax+.002*(1-merge),ay-.010*(1-merge),r*.65,fade);
 if(glide>.03&&inside(ax,cy)&&inside(ax,Math.max(ay,cy-.012)))g.line(X(ax),Y(Math.max(ay,cy-.012)),X(ax),Y(cy),'#e8aab7',fade*.19,Math.max(.5,b.w*.0004));
 bead(ax,cy,r*(1+.32*merge),fade);
 }
}
