// Measure distance in display pixels: a pulse travels at constant speed through corners.
export function checkEnergy(l){
 const p=l.path,unit=v=>Number.isFinite(v)&&v>=0&&v<=1;
 if(!Array.isArray(p)||p.length<2||p.length>48||!p.every((v,i)=>Array.isArray(v)&&v.length===2&&v.every(unit)&&(!i||v.some((n,k)=>n!==p[i-1][k]))))throw Error('Expected 2–48 distinct adjacent path points');
 if(l.cue!==undefined&&(!Array.isArray(l.cue)||l.cue.length!==2||!l.cue.every(unit)||l.cue[1]<=l.cue[0]))throw Error("Invalid cue interval");
 if(!/^#[0-9a-f]{6}$/i.test(l.tint)||typeof l.tint!=='string'||!unit(l.phase)||!Number.isFinite(l.seconds)||l.seconds<1||l.seconds>60)throw Error('Invalid energy color or timing');
}
export function energy(g,t,l){
 const b=g.image;if(!b||!b.w||!b.h||!l.intensity)return;
 const pts=l.path.map(([x,y])=>[b.x+x*b.w,b.y+y*b.h]);let total=0;
 const d=[0];for(let i=1;i<pts.length;i++){total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);d.push(total)}
 if(!total)return;
 const clock=((t/l.seconds+l.phase)%1+1)%1,scale=Math.min(b.w,b.h);
 const [start,end]=l.cue||[0,1];if(clock<start||clock>=end)return;const q=(clock-start)/(end-start);
 function point(s){const z=s*total;let i=1;while(i<d.length-1&&d[i]<z)i++;
 const k=(z-d[i-1])/(d[i]-d[i-1]);return pts[i-1].map((n,j)=>n+(pts[i][j]-n)*k)}
 if(l.preset==='eye-glint'){
  const power=Math.sin(Math.PI*q)**2*l.intensity;
  for(let i=1;i<pts.length;i++){
    for(const [w,a] of [[.022,.085],[.011,.19],[.0055,.45],[.002,.75]])
      g.line(...pts[i-1],...pts[i],l.tint,power*a,Math.max(.4,scale*w));
  }
  return;
 }
 if(l.preset==='aura-rise'){
 for(let i=0;i<7;i++){const u=(q+i/7)%1,[x,y]=point(u),fade=Math.sin(Math.PI*u)**2*l.intensity;
 const r=scale*(.008+.009*u)*(1+.12*Math.sin(2*Math.PI*(u+i/7)));
 for(let j=5;j>0;j--){const k=j/5;g.ellipse(x,y,r*k,r*k*2.15,l.tint,fade*(.045+.09*(1-k)))}
 }return}
 const length=.23,head=q*(1+length),tail=head-length;
 for(let i=1;i<pts.length;i++){
 const a=d[i-1]/total,z=d[i]/total;
 for(let j=0;j<12;j++){const u=Math.max(a,tail+j*length/12),v=Math.min(z,tail+(j+1)*length/12);if(v<=u)continue;
 const [x,y]=point(u),[X,Y]=point(v),alpha=(.12+.88*(j/11)**1.4)*l.intensity;
 for(const [width,gain] of [[.012,.09],[.006,.21],[.0021,.8]])g.line(x,y,X,Y,l.tint,alpha*gain,scale*width);
 }}
}
