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
