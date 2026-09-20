"""Extract the existing species atlas art; preserve proportions, no restyling."""
from pathlib import Path
import json,hashlib
from PIL import Image
root=Path(__file__).resolve().parents[1]
m=json.loads((root/'config/species-v1.json').read_text(encoding='utf-8'))
out=root/'web/nft-images';out.mkdir(exist_ok=True)
checks={}
for s in m['species']:
    art=s['art'];image=Image.open(root/'web'/art['path']).convert('RGBA')
    x,y,w,h=art['rect'];fish=image.crop((x,y,x+w,y+h))
    fish.thumbnail((768,512),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(768,512),(0,0,0,0));canvas.alpha_composite(fish,((768-fish.width)//2,(512-fish.height)//2))
    dest=out/(str(s['id'])+'.png');canvas.save(dest);checks[s['id']]=hashlib.sha256(dest.read_bytes()).hexdigest()
(root/'docs/NFT-IMAGE-HASHES.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print('Exported',len(checks),'species images')
