// A cross-section is [x, upper, lower, upper skin, lower skin, lash].
// All geometry is measured on the source; colors are material samples, not a second image.
export function validateRig(l) {
 const hex=c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c);
 if(!Array.isArray(l.guides)||l.guides.length<3||l.guides.length>24||
 !l.guides.every((p,i,a)=>Array.isArray(p)&&(p.length===6||p.length===7)&&p.slice(0,3).every(n=>Number.isFinite(n)&&n>=0&&n<=1)&&p[1]<=p[2]&&p.slice(3,6).every(hex)&&(p.length===6||(Number.isFinite(p[6])&&p[6]>=p[1]&&p[6]<=p[2]))&&p.length===a[0].length&&(!i||p[0]>a[i-1][0]))||
 !l.guides.some(p=>p[2]>p[1]))throw Error('Expected ordered lid cross-sections [x,upper,lower,upper skin,lower skin,lash]');
}
export function drawRig(g,t,l){
 const b=g.image;if(!b||!l.intensity)return;
 const phase=((t-1.9)%10.3+10.3)%10.3,dt=phase<.26?phase:phase-4.72;
 if(dt<0||dt>=.245)return;
 const a=dt<.085?dt/.085:dt<.112?1:1-(dt-.112)/.133;
 const f=a*a*(3-2*a)*l.intensity;if(f<.001)return;
 const p=l.guides,lo=p[0][0],hi=p[p.length-1][0],n=Math.min(240,Math.max(6,Math.ceil((hi-lo)*b.w))),width=(hi-lo)*b.w/n;
 const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
 const color=(v,k)=>'#'+v.map(c=>Math.min(255,Math.max(0,Math.round(c*k))).toString(16).padStart(2,'0')).join('');
 const colors=p.map(row=>row.slice(3,6).map(rgb));
 let j=1;
 for(let i=0;i<n;i++){
  const s=(i+.5)/n,x=lo+(hi-lo)*s;while(j<p.length-1&&x>p[j][0])j++;
  const prev=p[j-1],next=p[j],q=(x-prev[0])/(next[0]-prev[0]);
  const geom=k=>{
   const v=prev[k],z=next[k],slope=z-v;
   const tangent=(a,b)=>a*b>0?2*a*b/(a+b):0;
   const m=j===1?slope:tangent(slope,(v-p[j-2][k])*(next[0]-prev[0])/(prev[0]-p[j-2][0]));
   const e=j===p.length-1?slope:tangent(slope,(p[j+1][k]-z)*(next[0]-prev[0])/(p[j+1][0]-next[0]));
   return v+q*(m+q*(3*slope-2*m-e+q*(m+e-2*slope)));
  };
  const mat=k=>colors[j-1][k].map((c,h)=>c+(colors[j][k][h]-c)*q);
  const top=b.y+b.h*geom(1),bot=b.y+b.h*geom(2),span=bot-top;if(span<=0)continue;
  const arc=Math.sin(Math.PI*s), seam=p[0].length===7?Math.min(bot,Math.max(top,b.y+b.h*geom(6))):top+span*(.58+.17*arc);
  const upper=top+(seam-top)*f,lower=bot+(seam-bot)*f;
  const xx=b.x+x*b.w,alpha=Math.min(1,f*12);
  const stroke=(y,z,c,opacity=1)=>{if(z>y)g.line(xx,y,xx,z,c,alpha*opacity,width+.12)};
  const upperTone=mat(0),cheek=mat(1),skin=upperTone.map((v,k)=>v*.64+cheek[k]*.36);
  for(let k=0;k<7;k++){
   const v=(k+.5)/7,shade=1+f*arc*(.065*Math.sin(Math.PI*v)-.11*Math.exp(-((v-.32)**2)/.014)-.10*v*v);
   stroke(top+(upper-top)*k/7,top+(upper-top)*(k+1)/7,color(p[0].length===7?upperTone.map((c,h)=>c+(cheek[h]-c)*v*.7):skin,shade));
  }
  stroke(lower,bot,color(cheek,1-.035*f*arc));
  // Taper the lash at the corners. Stroke grows with eye size, not screen height.
  const thick=Math.min(span*.16,(hi-lo)*b.w*(.009+.018*arc));
  stroke(Math.max(top,upper-thick),upper,color(mat(2),1));
 }
}
