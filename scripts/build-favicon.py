"""Render the authored vector mark at browser and home-screen sizes."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,re,io
root=Path(__file__).resolve().parents[1];web=root/'web'
# Curves are shared by the SVG and PNG renderings.
shapes=[('#f7ca57',[('M',12,21),('L',25,29),('C',32,20,43,19,53,31),('C',44,44,32,45,24,35),('L',12,43),('L',16,32),('Z',)]),
 ('#ffe6a0',[('M',27,26),('C',31,19,36,16,41,18),('L',40,24),('Z',)]),
 ('#dfaa36',[('M',30,33),('L',37,31),('L',33,39),('Z',)])]
def dpath(cmds):return ' '.join(c[0]+' '+ ' '.join(map(str,c[1:])) for c in cmds)
svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><title>BNBFISH</title><rect width="64" height="64" rx="15" fill="#123d64"/><rect x="2" y="2" width="60" height="60" rx="13" fill="none" stroke="#397294" stroke-width="1"/>'
svg+=''.join(f'<path fill="{color}" d="{dpath(cmds)}"/>' for color,cmds in shapes)
svg+='<circle cx="44" cy="29" r="2.3" fill="#123d64"/><path d="M18 49 C26 53 38 53 46 48" fill="none" stroke="#8ed7ed" stroke-width="2.6" stroke-linecap="round"/></svg>'
(web/'favicon.svg').write_text(svg)
scale=16;im=Image.new('RGBA',(64*scale,64*scale));draw=ImageDraw.Draw(im)
box=lambda xy:tuple(v*scale for v in xy)
draw.rounded_rectangle(box((0,0,64,64)),radius=15*scale,fill='#123d64')
draw.rounded_rectangle(box((2,2,62,62)),radius=13*scale,outline='#397294',width=scale)
def points(commands):
 out=[];pos=(0,0)
 for c in commands:
  if c[0] in ('M','L'):pos=tuple(c[1:]);out.append(pos)
  elif c[0]=='C':
   a=pos;b=c[1:3];cc=c[3:5];end=c[5:7]
   for i in range(1,41):
    t=i/40;out.append(tuple((1-t)**3*a[k]+3*(1-t)**2*t*b[k]+3*(1-t)*t*t*cc[k]+t**3*end[k] for k in (0,1)))
   pos=end
 return [(round(x*scale),round(y*scale)) for x,y in out]
for color,cmds in shapes:draw.polygon(points(cmds),fill=color)
draw.ellipse(box((41.7,26.7,46.3,31.3)),fill='#123d64')
wave=points([('M',18,49),('C',26,53,38,53,46,48)])
draw.line(wave,fill='#8ed7ed',width=round(2.6*scale))
for x,y in [wave[0],wave[-1]]:draw.ellipse((x-1.3*scale,y-1.3*scale,x+1.3*scale,y+1.3*scale),fill='#8ed7ed')
for size,name in [(16,'favicon-16.png'),(32,'favicon-32.png'),(180,'apple-touch-icon.png'),(192,'icon-192.png'),(512,'icon-512.png')]:im.resize((size,size),Image.Resampling.LANCZOS).save(web/name)
im.resize((256,256),Image.Resampling.LANCZOS).save(web/'favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
(web/'site.webmanifest').write_text(json.dumps({'name':'BNBFISH','short_name':'BNBFISH','start_url':'/','display':'standalone','background_color':'#123d64','theme_color':'#123d64','icons':[{'src':f'/icon-{n}.png?v=fish1','sizes':f'{n}x{n}','type':'image/png','purpose':'any'} for n in [192,512]]},indent=2))
tags='<link rel="icon" href="/favicon.ico?v=fish1" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg?v=fish1"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=fish1"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=fish1"><link rel="manifest" href="/site.webmanifest?v=fish1"><meta name="theme-color" content="#123d64">'
pages=['index.html','nft-card-gallery.html','claim200-activate.html','claim200-deploy.html','developers/nft/index.html','copyright/index.html']
for name in pages:
 p=web/name;s=p.read_text(encoding='utf8');s=re.sub(r'<link\b[^>]*rel="(?:icon|shortcut icon|apple-touch-icon|manifest)"[^>]*>','',s);s=re.sub(r'<meta\b[^>]*name="theme-color"[^>]*>','',s);s=s.replace('</head>',tags+'</head>');p.write_text(s,encoding='utf8')
print('Browser icons generated; wired into '+str(len(pages))+' public pages.')
