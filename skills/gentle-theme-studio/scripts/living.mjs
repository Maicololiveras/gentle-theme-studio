import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import createEngine from './living/core.cjs';
export const validateZone=createEngine().validate;
export function build(bytes,mime,zones,template,core){
 if(!Array.isArray(zones)||zones.length>16)throw Error('At most 16 zones');zones.forEach(validateZone);
 const image='data:'+mime+';base64,'+bytes.toString('base64'),data={image,zones};
 const html=template.replace('__DATA__',()=>JSON.stringify(data).replace(/</g,'\\u003c')).replace('__CORE__',()=>core);
 // Conservative export: native polygons do not have subtractive masks. Omit any
 // effect whose bounds may intersect a protected zone, rather than crossing it.
 // Normalized geometry for rotated ellipses needs the actual source aspect ratio.
 return {html,image};
}
export function nativeTheme(image,zones,w,h){
 const shape=z=>Array.from({length:32},(_,i)=>{const t=i*Math.PI/16,a=z.angle*Math.PI/180,u=z.rx*Math.cos(t),v=z.ry*Math.sin(t);return [z.x+u*Math.cos(a)-v*h/w*Math.sin(a),z.y+u*w/h*Math.sin(a)+v*Math.cos(a)].map(n=>Math.max(0,Math.min(1,n)))});
 const bounds=z=>{const p=shape(z),x=p.map(v=>v[0]),y=p.map(v=>v[1]);return [Math.min(...x)-.02,Math.min(...y)-.02,Math.max(...x)+.02,Math.max(...y)+.02]};
 let omitted=0;const effects=[],locked=zones.filter(z=>z.kind==='protect').map(bounds);
 for(const z of zones){if(!z.strength||z.kind==='protect')continue;const a=bounds(z);
 if(locked.some(b=>a[0]<=b[2]&&a[2]>=b[0]&&a[1]<=b[3]&&a[3]>=b[1])){omitted++;continue}
 const region=shape(z);effects.push(z.kind==='glow'?{type:'light',region,key:'bright',color:z.tint,strength:.55*z.strength,glow:.008,flicker:.27,speed:.25}:
 z.kind==='turn'?{type:'sway',region,feather:.025,strength:.0018*z.strength,speed:.125,scale:1,ratio:.04}:
 {type:'flow',region,direction:[.2,-1],feather:.012,speed:.125,strength:.009*z.strength})}
 return {theme:{name:'Living canvas',bg:'#101419',text:'#f2f6fa',accent:'#70cbd0',background:{image,veil:0,effects}},omitted};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [src,recipe,out]=process.argv.slice(2);if(!out)throw Error('Usage: node living.mjs image.png scene.json NEW_DIRECTORY');
 const bytes=fs.readFileSync(src);if(bytes.length>10485760||!bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))||bytes.length<24)throw Error('Expected original PNG up to 10 MiB (use browser editor for JPEG/WebP)');
 const {zones}=JSON.parse(fs.readFileSync(recipe)),read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
 const r=build(bytes,'image/png',zones,read('./living/player.html'),read('./living/core.cjs'));
 const {theme,omitted}=nativeTheme(r.image,zones,bytes.readUInt32BE(16),bytes.readUInt32BE(20));
 fs.mkdirSync(out);for(const [n,v] of [['scene.html',r.html],['desktop.gentletheme',JSON.stringify(theme)],['scene.json',JSON.stringify({zones},null,2)]])fs.writeFileSync(path.join(out,n),v,{flag:'wx'});console.log('Native fallback: '+omitted+' overlapping protected effect(s) omitted.');
}
