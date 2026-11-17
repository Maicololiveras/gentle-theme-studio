import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const ok=(v,m)=>{if(!v)throw Error(m)};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,ks)=>ok(obj(x)&&Object.keys(x).every(k=>ks.includes(k)), 'Unexpected fields or invalid object');
const unit=n=>Number.isFinite(n)&&n>=0&&n<=1;
const hash=b=>createHash('sha256').update(b).digest('hex');
const names=['name','bg','text','accent','veil','layers'];
function layer(l){
 keys(l,['id','preset','region','intensity']);
 ok(typeof l.id==='string'&&/^[a-z][a-z0-9-]{0,31}$/.test(l.id),'Invalid layer ID');
 ok(['steam','lamp','leaves','rain'].includes(l.preset)&&unit(l.intensity),'Invalid preset or intensity');
 ok(Array.isArray(l.region)&&l.region.length>=3&&l.region.length<=32&&l.region.every(p=>Array.isArray(p)&&p.length===2&&p.every(unit)),'Expected 3–32 normalized polygon points');
 const area=l.region.reduce((a,[x,y],i,p)=>{const [u,v]=p[(i+1)%p.length];return a+x*v-y*u},0);
 ok(Math.abs(area)>1e-7,'Empty polygon');
}
function validate(r){
 keys(r,names);ok(typeof r.name==='string'&&r.name.trim()&&r.name.length<=80,'Invalid theme name');
 for(const k of ['bg','text','accent'])ok(typeof r[k]==='string'&&/^#[0-9a-f]{6}$/i.test(r[k]),'Expected hex color: '+k);
 ok(unit(r.veil)&&Array.isArray(r.layers)&&r.layers.length<=16,'Invalid veil or layer count');
 r.layers.forEach(layer);ok(new Set(r.layers.map(l=>l.id)).size===r.layers.length,'Duplicate layer ID');return r;
}
// Fixed renderer. Only validated numeric rain regions and intensities enter scene code.
function rain(g,t,layers){
 const box=g.image;if(!box)return;
 for(const l of layers){
 const p=l.region, xs=p.map(v=>v[0]),ys=p.map(v=>v[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const inside=(x,y)=>{let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let [u,v]=p[i],[s,w]=p[j];if((v>y)!=(w>y)&&x<(s-u)*(y-v)/(w-v)+u)b=!b}return b};
 for(let i=0;i<Math.ceil(30*l.intensity);i++){
 const x=x0+(x1-x0)*((i*.618034+.23)%1),y=y0+(y1-y0)*((i*.754877+t*.20)%1);
 if(inside(x,y)&&inside(x-.002,y+.014))g.line(box.x+x*box.w,box.y+y*box.h,box.x+(x-.002)*box.w,box.y+(y+.014)*box.h,'#c4d7ea',.32*l.intensity,1);
 }}
}
export function compile(r,bytes,mime){
 validate(r);const effects=[],storms=[];
 for(const {preset,region,intensity:a} of r.layers){if(!a)continue;
 if(preset==='rain'){storms.push({region,intensity:a});continue}
 effects.push({region,...(preset==='steam'?{type:'flow',direction:[0,-1],speed:.32,strength:.035*a}:preset==='leaves'?{type:'sway',strength:.003*a,speed:.32,scale:12}:{type:'light',strength:1.2*a})})}
 const {name,bg,text,accent,veil}=r;
 return {name,bg,text,accent,background:{image:'data:'+mime+';base64,'+bytes.toString('base64'),veil,effects,...(storms.length?{sceneCode:'const layers='+JSON.stringify(storms)+'; SCENES.studio={draw(g,t){('+rain.toString()+')(g,t,layers)}};'}:{})}};
}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,data)=>fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n',{flag:'wx'});
function asset(p){ok(fs.statSync(p).size<=10*1024*1024,'Image exceeds 10 MiB');const b=fs.readFileSync(p),s=b.subarray(0,12);
 const m=s.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))?'image/png':s[0]===255&&s[1]===216&&s[2]===255?'image/jpeg':s.toString('ascii',0,4)==='RIFF'&&s.toString('ascii',8,12)==='WEBP'?'image/webp':null;
 ok(m,'Expected PNG, JPEG or WebP');return [b,m]}
export function run(cmd,dir,...args){
 const f=n=>{ok(/^[1-9][0-9]{0,5}$/.test(String(n)),'Invalid revision');return path.join(dir,'draft-'+n+'.json')};
 if(cmd==='create'){const [img,recipe]=args,r=validate(read(recipe)),[b]=asset(img);fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'original'),b,{flag:'wx'});write(f(1),{sha256:hash(b),recipe:r});return f(1)}
 const [rev,arg]=args,d=read(f(rev)),[b,m]=asset(path.join(dir,'original'));ok(hash(b)===d.sha256,'Original image changed');validate(d.recipe);
 if(cmd==='export'){write(arg,compile(d.recipe,b,m));return arg}
 ok(cmd==='update','Unknown command');const patch=read(arg);keys(patch,['set','layers']);if(patch.set){keys(patch.set,names.filter(x=>x!=='layers'));Object.assign(d.recipe,patch.set)}
 if(patch.layers){ok(obj(patch.layers),'Expected keyed layer edits');for(const [id,edit] of Object.entries(patch.layers)){
 const index=d.recipe.layers.findIndex(l=>l.id===id);
 if(edit===null){ok(index>=0,'Unknown layer '+id);d.recipe.layers.splice(index,1);continue}
 keys(edit,['preset','region','intensity']);const l={...(index>=0?d.recipe.layers[index]:{}),...edit,id};layer(l);if(index>=0)d.recipe.layers[index]=l;else d.recipe.layers.push(l)}}
 validate(d.recipe);const out=f(Number(rev)+1);write(out,d);return out;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(run(...process.argv.slice(2)))}catch(e){console.error(e.message);process.exitCode=1}}
