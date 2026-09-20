// Rasterize the existing collectible SVG artwork into standalone wallet cards.
// This is presentation only. Never writes protocol manifests or contract metadata.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const sharp=require(process.env.BNBFISH_SHARP||'C:/Users/ALIENWARE/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest=JSON.parse(fs.readFileSync('config/species-v1.json','utf8'));
const source=fs.readFileSync('web/fish-catalog.js','utf8');const artwork=JSON.parse(source.slice(source.indexOf('['),source.lastIndexOf(']')+1));
const glyphs=JSON.parse(fs.readFileSync('artifacts/card-export/glyphs.json','utf8')).glyphs;
const colors={common:['#ffffff','#b9c9d2','#f1f7f7'],rare:['#49a6ff','#80b9dc','#d5f5ff'],precious:['#bb86fc','#b59aca','#f6e7ff'],exceptional:['#ff82bd','#d4a3b2','#ffe3db'],legendary:['#ffbc55','#d7b67d','#fff1c9']};
const cache=new Map();function asset(file){if(!cache.has(file))cache.set(file,'data:image/png;base64,'+fs.readFileSync('web/'+file).toString('base64'));return cache.get(file);}
const displayFiles=new Set(['legendary-v1.png','exceptional-v1.png','rare-expansion-v2.png','exceptional-expansion-v2.png','legendary-expansion-v2.png','aquatic-invertebrates-v1.png','sea-invertebrates-v1.png']);
function text(value,x,y,size,color){let offset=0;return `<g fill="${color}">`+[...value].map(c=>{const g=glyphs[c];if(!g)throw Error('Missing glyph '+c);const scale=size/g.units;const svg=`<path d="${g.path}" transform="translate(${x+offset} ${y}) scale(${scale} ${-scale})"/>`;offset+=g.advance*scale+size*.04;return svg;}).join('')+'</g>';}
function card(s){
 const a=artwork.find(a=>a.name===s.name);if(!a)throw Error('Missing artwork '+s.id);
 const file=a.asset||a.tone+'-v1.png',artPath=(displayFiles.has(file)?'assets/collectibles/':'assets/fish-catalog/')+file;
 const [W,H]=a.atlas,[x,y,w,h]=a.rect,[ink,foil,light]=colors[s.rarity];
 const tier=manifest.tiers.find(t=>t.id===s.rarity);const grade=manifest.tiers.indexOf(tier)+1;
 const paths=Array.from({length:5},(_,i)=>`<path d="M${4+i*7} 92 C${4+i*7} ${24+i*6},${37+i*6} ${22+i*6},${95+i*2} 4"/>`).join('');
 const corners=[[18,18,1,1],[882,18,-1,1],[882,1182,-1,-1],[18,1182,1,-1]].map(([cx,cy,sx,sy])=>`<g transform="translate(${cx} ${cy}) scale(${sx} ${sy})" opacity=".65" fill="none" stroke="${light}" stroke-width="1.1">${paths}</g>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1200" viewBox="0 0 900 1200">
 <defs><clipPath id="card"><rect x="3" y="3" width="894" height="1194" rx="38"/></clipPath>
 <linearGradient id="shade" x2="0" y2="1"><stop offset=".22" stop-color="#0b1725" stop-opacity="0"/><stop offset=".63" stop-color="#0b1725" stop-opacity=".38"/><stop offset="1" stop-color="#0b1725" stop-opacity=".96"/></linearGradient>
 <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${light}"/><stop offset=".22" stop-color="${foil}"/><stop offset=".46" stop-color="${light}"/><stop offset=".65" stop-color="${foil}"/><stop offset="1" stop-color="${light}"/></linearGradient>
 <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1"><stop offset=".1" stop-color="#fff" stop-opacity="0"/><stop offset=".35" stop-color="${light}" stop-opacity=".07"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
 <filter id="shadow" x="-.1" y="-.1" width="1.2" height="1.3"><feDropShadow dx="0" dy="14" stdDeviation="9" flood-color="#071923" flood-opacity=".55"/></filter></defs>
 <rect width="900" height="1200" rx="38" fill="#0b1725"/>
 <g clip-path="url(#card)"><image href="${asset('assets/collectibles/underwater-v1.png')}" x="0" y="0" width="900" height="1200" preserveAspectRatio="xMidYMid slice"/><rect width="900" height="1200" fill="url(#shade)"/>
 <text x="66" y="94" fill="#edf7f8" font-family="Georgia,serif" font-size="35" letter-spacing="1">Bnbfish</text><text x="68" y="122" fill="#cbdee2" font-family="Arial,sans-serif" font-size="12" letter-spacing="3">AQUATIC COLLECTION</text>
 <rect x="741" y="66" width="90" height="47" rx="7" fill="#173544" fill-opacity=".48" stroke="${light}" stroke-opacity=".7"/><text x="786" y="98" text-anchor="middle" fill="#f1f8f9" font-family="Arial,sans-serif" font-size="23">NFT</text>
 <g filter="url(#shadow)"><svg x="38" y="210" width="824" height="510" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet"><svg width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><image href="${asset(artPath)}" width="${W}" height="${H}"/></svg></svg></g>
 ${text(s.name,68,858,62,ink)}${text(tier.name,70,918,31,ink)}
 <g fill="${foil}">${Array.from({length:5},(_,i)=>`<rect x="${696+i*27}" y="899" width="17" height="5" rx="2" opacity="${i<grade?.85:.18}"/>`).join('')}</g>
 <path d="M70 961 H830" stroke="${foil}" stroke-opacity=".5"/>
 <text x="70" y="1005" fill="#cfdee7" font-family="Arial,sans-serif" font-size="19" letter-spacing="2.5">BNB CHAIN · ERC-721</text><text x="830" y="1005" text-anchor="end" fill="#cfdee7" font-family="Arial,sans-serif" font-size="18" letter-spacing="1.5">SPECIES ${s.id}</text>
 ${text('收藏娱乐·无经济价值属性',70,1064,23,'#aebfca')}
 <rect width="900" height="1200" fill="url(#sheen)"/></g>
 <rect x="3" y="3" width="894" height="1194" rx="38" fill="none" stroke="url(#edge)" stroke-width="5"/><rect x="12" y="12" width="876" height="1176" rx="30" fill="none" stroke="${foil}" stroke-width="1.5" opacity=".75"/><rect x="17" y="17" width="866" height="1166" rx="26" fill="none" stroke="${light}" stroke-width=".7" opacity=".5"/>${corners}</svg>`;
}
const selected=process.argv.slice(2).map(Number);const species=manifest.species.filter(s=>s.enabled&&(!selected.length||selected.includes(s.id)));
const dir='release/nft-cards-v1';fs.mkdirSync(dir,{recursive:true});const rows=[];
for(const s of species){const svg=card(s);const png=await sharp(Buffer.from(svg)).png({compressionLevel:9,palette:true,colours:256,dither:.6}).toBuffer();fs.writeFileSync(path.join(dir,s.id+'.png'),png);rows.push({id:s.id,name:s.name,tier:s.rarity,width:900,height:1200,bytes:png.length,sha256:createHash('sha256').update(png).digest('hex')});console.log(s.id,s.name,png.length);}
fs.writeFileSync(path.join(dir,selected.length?'sample-manifest.json':'manifest.json'),JSON.stringify({version:'wallet-card-v1',source:'Existing approved Bnbfish collectible artwork and frame',perSpecies:true,rows},null,2));
