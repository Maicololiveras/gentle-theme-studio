"""Bake selected, registered eyelid pixels into a NEW recipe. Requires Pillow."""
import argparse, json
from pathlib import Path
from PIL import Image
p=argparse.ArgumentParser(description=__doc__)
for name in ('source','closed','recipe','layer','output'):p.add_argument(name)
a=p.parse_args()
r=json.loads(Path(a.recipe).read_text()); layer=next(x for x in r['layers'] if x['id']==a.layer and x['preset']=='blink')
src=Image.open(a.source).convert('RGB'); key=Image.open(a.closed).convert('RGB')
if src.size!=key.size: p.error('Source and registered keyframe must have matching dimensions')
w,h=src.size; guides=layer['guides']; left,right=guides[0][0],guides[-1][0]
if not all(0<=g[0]<=1 and 0<=g[1]<=g[2]<=1 for g in guides) or not all(b[0]>a[0] for a,b in zip(guides,guides[1:])):p.error('Invalid guide bounds')
cols=[]; n=max(2,min(160,round((right-left)*w)))
for i in range(n):
    x=left+(right-left)*(i+.5)/n
    j=next(j for j in range(1,len(guides)) if x<=guides[j][0])
    lo,hi=guides[j-1:j+1]; t=(x-lo[0])/(hi[0]-lo[0])
    u=lo[1]+(hi[1]-lo[1])*t; d=lo[2]+(hi[2]-lo[2])*t
    m=max(2,min(96,round((d-u)*h))); colors=[]
    for k in range(m):
        pos=(min(w-1,int(x*w)),min(h-1,int((u+(d-u)*(k+.5)/m)*h)))
        blend=min(1,(i+.5)/2,(n-i-.5)/2,(k+.5)/1.5,(m-k-.5)/1.5)
        colors.append(''.join('%02x'%round(c+(v-c)*blend) for c,v in zip(src.getpixel(pos),key.getpixel(pos))))
    cols.append(''.join(colors))
layer['paint']=cols
with open(a.output,'x') as f: json.dump(r,f,indent=2)
