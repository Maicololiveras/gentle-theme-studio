import {validateZone} from '../skills/gentle-theme-studio/scripts/living.mjs';
import {layer} from '../skills/gentle-theme-studio/scripts/theme.mjs';
import {motions} from '../skills/gentle-theme-studio/scripts/motion.mjs';
export default function director(pi){
 pi.registerTool({name:'theme_living_zone',label:'Direct original pixels',description:'After inspecting the original, propose aura flow, breathing glow, subtle face yaw, or a protected zone. Use normalized ellipse center/radii and angle in degrees. Return zone to scene.json; use living.mjs to export. Never invent missing facial surfaces.',parameters:{type:'object',additionalProperties:false,required:['kind','x','y','rx','ry','angle','strength','phase','tint'],properties:{kind:{type:'string',enum:['aura','glow','turn','protect']},...Object.fromEntries(['x','y','rx','ry','strength','phase'].map(k=>[k,{type:'number',minimum:0,maximum:1}])),angle:{type:'number',minimum:-180,maximum:180},tint:{type:'string'}}},async execute(id,args){validateZone(args);return {content:[{type:'text',text:JSON.stringify(args)}],details:{zone:args}}}});
 pi.registerTool({name:'theme_motion_layer',label:'Design a procedural motion layer',
 description:'Create a validated theme layer after inspecting the source. Choose a preset and supply measured normalized geometry. For lid-rig, each guide is [x, upperY, lowerY, upperSkinHex, lowerSkinHex, lashHex, optional closedY]. Use all seven fields on every guide for an asymmetric closing line. No closed-eye image needed. Return the layer to the draft recipe and use the theme compiler to export.',
 parameters:{type:'object',additionalProperties:false,required:['id','preset','intensity'],properties:{
 id:{type:'string'},preset:{type:'string',enum:Object.values(motions).flat().filter(k=>k!=='blink')},intensity:{type:'number',minimum:0,maximum:1},
 path:{type:"array",minItems:2,maxItems:48,items:{type:"array",minItems:2,maxItems:2,items:{type:"number"}}},tint:{type:"string"},phase:{type:"number"},cue:{type:"array",minItems:2,maxItems:2,items:{type:"number"}},seconds:{type:"number"},
 guides:{type:'array',maxItems:24,items:{type:'array',minItems:6,maxItems:7,items:{anyOf:[{type:'number'},{type:'string'}]}}},
 region:{type:'array',maxItems:32,items:{type:'array',minItems:2,maxItems:2,items:{type:'number'}}}}},
 async execute(_id,args){layer(args);return {content:[{type:'text',text:JSON.stringify(args)}],details:{layer:args}}}});
}
