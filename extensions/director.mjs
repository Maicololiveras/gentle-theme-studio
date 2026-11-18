import {layer} from '../skills/gentle-theme-studio/scripts/theme.mjs';
import {motions} from '../skills/gentle-theme-studio/scripts/motion.mjs';
export default function director(pi){
 pi.registerTool({name:'theme_motion_layer',label:'Design a procedural motion layer',
 description:'Create a validated theme layer after inspecting the source. Choose a preset and supply measured normalized geometry. For lid-rig, each guide is [x, upperY, lowerY, upperSkinHex, lowerSkinHex, lashHex, optional closedY]. Use all seven fields on every guide for an asymmetric closing line. No closed-eye image needed. Return the layer to the draft recipe and use the theme compiler to export.',
 parameters:{type:'object',additionalProperties:false,required:['id','preset','intensity'],properties:{
 id:{type:'string'},preset:{type:'string',enum:Object.values(motions).flat().filter(k=>k!=='blink')},intensity:{type:'number',minimum:0,maximum:1},
 guides:{type:'array',maxItems:24,items:{type:'array',minItems:6,maxItems:7,items:{anyOf:[{type:'number'},{type:'string'}]}}},
 region:{type:'array',maxItems:32,items:{type:'array',minItems:2,maxItems:2,items:{type:'number'}}}}},
 async execute(_id,args){layer(args);return {content:[{type:'text',text:JSON.stringify(args)}],details:{layer:args}}}});
}
