from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.varLib.instancer import instantiateVariableFont
import json
catalog=json.loads(Path('config/species-v1.json').read_text(encoding='utf-8'))
chars=set(''.join(s['name'] for s in catalog['species'])+'普通稀有珍稀罕见极其罕见收藏娱乐无经济价值属性月影湖青岚河星潮海·')
fonts=[instantiateVariableFont(TTFont('web/assets/collectibles/noto-serif-sc.woff2'),{'wght':550}),TTFont('C:/Windows/Fonts/simsun.ttc',fontNumber=0)];rows={}
for ch in chars:
 font=next((f for f in fonts if ord(ch) in f.getBestCmap()),None)
 if font is None:raise Exception('Missing glyph '+str(ord(ch)))
 cmap=font.getBestCmap();glyphset=font.getGlyphSet();name=cmap[ord(ch)];pen=SVGPathPen(glyphset);glyphset[name].draw(pen);rows[ch]={'path':pen.getCommands(),'advance':font['hmtx'][name][0],'units':font['head'].unitsPerEm}
Path('artifacts/card-export').mkdir(exist_ok=True)
Path('artifacts/card-export/glyphs.json').write_text(json.dumps({'units':font['head'].unitsPerEm,'glyphs':rows},ensure_ascii=False),encoding='utf-8')
print('Outlined characters',len(rows))

