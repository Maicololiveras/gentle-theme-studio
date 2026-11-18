"""Export a diagnostic closed-eye PNG from procedural rigs; Python/Pillow and Node 20+."""
import argparse,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
p=argparse.ArgumentParser(description=__doc__)
for n in ('original','recipe','output'):p.add_argument(n)
a=p.parse_args()
src=Image.open(a.original).convert('RGBA'); w,h=src.size
recipe=json.loads(Path(a.recipe).read_text())
layers=[l for l in recipe['layers'] if l['preset']=='lid-rig']
if not layers:p.error('No procedural lid rigs in recipe')
module=Path(__file__).with_name('lid-rig.mjs').resolve().as_uri()
js="""const {validateRig,drawRig}=await import(process.argv[1]);let s='';for await(const chunk of process.stdin)s+=chunk;
const {layers,w,h}=JSON.parse(s);const lines=[];
for(const l of layers){validateRig(l);if(!Number.isFinite(l.intensity)||l.intensity<0||l.intensity>1)throw Error('Invalid intensity');drawRig({image:{x:0,y:0,w,h},line:(...v)=>lines.push(v)},2,l)}console.log(JSON.stringify(lines));"""
lines=json.loads(subprocess.run(['node','--input-type=module','-e',js,module],input=json.dumps(dict(layers=layers,w=w,h=h)),capture_output=True,text=True,check=True).stdout)
# Supersample each small eye separately. Never resample the whole source.
overlay=Image.new('RGBA',src.size)
if lines:
    # Group local strokes into tiles; handle edge pixels across tile boundaries.
    import math
    tiles={}
    for x,y,_,z,c,alpha,width in lines:
        for tx in range(max(0,math.floor((x-width/2-2)/64)),min((w-1)//64,math.floor((x+width/2+2)/64))+1):
            for ty in range(max(0,math.floor((y-2)/64)),min((h-1)//64,math.floor((z+2)/64))+1):
                tiles.setdefault((tx,ty),[]).append((x,y,z,c,alpha,width))
    for (tx,ty),strokes in tiles.items():
        ox,oy=tx*64,ty*64; tile=Image.new('RGBA',(272,272)); draw=ImageDraw.Draw(tile)
        for x,y,z,c,alpha,width in strokes:
            draw.rectangle(tuple(round(v*4) for v in (x-width/2-ox+2,y-oy+2,x+width/2-ox+2,z-oy+2)),fill=(*bytes.fromhex(c[1:]),round(255*alpha)))
        reduced=tile.resize((68,68),Image.Resampling.LANCZOS).crop((2,2,66,66));overlay.paste(reduced,(ox,oy))
src=Image.alpha_composite(src,overlay)
with open(a.output,'xb') as out:src.save(out,format='PNG')
