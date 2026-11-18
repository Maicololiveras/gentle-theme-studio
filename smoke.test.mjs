import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';
import {run} from './skills/gentle-theme-studio/scripts/theme.mjs';
test('revision preserves image and rain; only the lamp changes',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'theme-'));
 try{
 const image=process.env.THEME_TEST_IMAGE||path.join(tmp,'dot.png');
 if(!process.env.THEME_TEST_IMAGE)fs.writeFileSync(image,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFYkAAAAASUVORK5CYII=','base64'));
 const d=path.join(tmp,'draft');run('create',d,image,'examples/crimson.json');run('update',d,'1','examples/dim-lamp.json');
 assert.throws(()=>run('update',d,'1','examples/dim-lamp.json'),/EEXIST/);
 const [a,b]=[1,2].map(n=>JSON.parse(fs.readFileSync(run('export',d,String(n),path.join(tmp,n+'.gentletheme')))));
 assert.deepEqual(Buffer.from(a.background.image.split(',')[1],'base64'),fs.readFileSync(image));
 assert.ok(a.background.effects[0].strength>b.background.effects[0].strength);a.background.effects[0].strength=b.background.effects[0].strength;assert.deepEqual(a,b);
 const ctx={SCENES:{}};vm.runInNewContext(b.background.sceneCode,ctx);let count=0;ctx.SCENES.studio.draw({image:{x:0,y:0,w:1000,h:500},line(){count++}},1);assert.ok(count>0);
 fs.appendFileSync(path.join(d,'original'),'x');assert.throws(()=>run('export',d,'1',path.join(tmp,'bad')),/Original image changed/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}});
import {compile} from './skills/gentle-theme-studio/scripts/theme.mjs';
test('scene selection works without a face; textured lids close together and uncover original',()=>{
 const r=JSON.parse(fs.readFileSync('examples/crimson-immersive.json'));
 assert.deepEqual(JSON.parse(run('suggest','window')),['rain','wet-glass']);
 const eyes=r.layers.filter(l=>l.preset==='blink');
 const ctx={SCENES:{}};vm.runInNewContext(compile({...r,layers:eyes},Buffer.alloc(0),'image/png').background.sceneCode,ctx);
 let xs=[];const g={image:{x:0,y:0,w:1938,h:811},line(x){xs.push(x)}};
 for(const t of [0,1.75,2.2])ctx.SCENES.studio.draw(g,t);
 assert.equal(xs.length,0);ctx.SCENES.studio.draw(g,2.00);
 assert.ok(xs.some(x=>x<1560)&&xs.some(x=>x>1580));
 assert.throws(()=>compile({...r,layers:[{...eyes[0],paint:['invalid']}]},Buffer.alloc(0),'image/png'),/texture/);
 const pane=r.layers.find(l=>l.preset==='wet-glass');
 vm.runInNewContext(compile({...r,layers:[pane]},Buffer.alloc(0),'image/png').background.sceneCode,ctx);
 let strokes=0,drops=0;ctx.SCENES.studio.draw({...g,line(){strokes++},ellipse(){drops++}},4);assert.ok(strokes&&drops);
});
import director from './extensions/director.mjs';
test('agent can author and render a new eye solely from geometry and material colors',async()=>{
 let tool;director({registerTool(t){tool=t}});const spec={id:'eye',preset:'lid-rig',intensity:1,guides:[[.1,.4,.4,'#ccaa99','#bbaa99','#312021'],[.2,.33,.48,'#eeccaa','#ddaa88','#542013'],[.31,.39,.39,'#ccaa99','#be9988','#312021']]};
 const {details}=await tool.execute('test',spec);const r=JSON.parse(fs.readFileSync('examples/crimson-procedural.json'));r.layers=[details.layer];
 const ctx={SCENES:{}};vm.runInNewContext(compile(r,Buffer.from('source'),'image/png').background.sceneCode,ctx);
 const lines=[],g={image:{x:10,y:20,w:800,h:400},line(...v){lines.push(v)}};
 for(const t of [0,2.2])ctx.SCENES.studio.draw(g,t);assert.equal(lines.length,0);
 ctx.SCENES.studio.draw(g,2);assert.ok(lines.length>100);for(const [x,y,X,Y] of lines){assert.equal(x,X);assert.ok(x>=90&&x<=258&&y>=152&&Y<=212)}
 await assert.rejects(tool.execute('bad',{...spec,paint:['ffffff']}),/Unexpected fields/);
 assert.throws(()=>compile({...r,layers:[{...spec,guides:spec.guides.toReversed()}]},Buffer.alloc(0),'image/png'),/ordered lid/);
});
