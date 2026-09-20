import fs from 'node:fs';import express from 'express';import {build} from 'esbuild';
fs.mkdirSync('.runtime/claim200-preview',{recursive:true});
const source=`import {createClaim200UI} from '../../web/claim200-ui.js';import {claim200Protocol} from '../../web/claim200-protocol.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
Lake3D.mount($('#lake-webgl'),false,'月影湖');
const module=document.createElement('section');module.id='module-page';$('.phone').appendChild(module);module.hidden=true;
const close=()=>{$('#modal').hidden=true;$('#lake-webgl').dataset.renderPaused='false';};
const sheet=html=>{$('#modal').innerHTML='<section class="sheet"><button class="sheet-close">×</button><div class="sheet-content">'+html+'</div></section>';$('#modal').hidden=false;$('.sheet-close').onclick=close;};
const showPage=(name,title,sub,html)=>{close();module.hidden=false;module.dataset.page=name;module.innerHTML='<header class="module-header"><div><span class="eyebrow">交互预览 · 非链上数据</span><h1>'+title+'</h1></div><button id="preview-close">×</button></header><div class="module-scroll">'+html+'</div>';$('#preview-close').onclick=()=>module.hidden=true;};
const species=FishGuide.species.filter(s=>s.enabled).slice(0,6);const rows=species.map((s,i)=>({id:String(i+1),status:i<3?'unclaimed':i===3?'claimed':'verifying',castAt:1758000000-i*300,water:i%3,claimable:i<3,fish:i<4?{speciesId:s.id,lengthMm:320+i*35,massGrams:'450',qualityBps:8000,caughtAt:1758000000}:null}));
const client={address:'0x1111111111111111111111111111111111111111',claimRecords:async()=>({rows,count:6,blockTag:123000000,hasMore:false}),contract:{entries:async()=>({player:client.address}),entryOutcome:async()=>({outcome:2n}),awardFish:async()=>rows[0].fish},prepareClaim:async()=>({gasCost:14000000000000n}),claimCatch:async()=>{throw Error('这是本地交互预览，不发送交易');}};
const ui=createClaim200UI({client,$,esc,sheet,close,showPage,notice:e=>sheet('<p>'+esc(e.message)+'</p>'),error:e=>e.message,key:()=> 'preview-only',walletDialog:()=>{},openTransfers:()=>{},getRequest:()=>null,isBusy:()=>false,setProgress:()=>{},syncDock:()=>{},clearRequest:()=>{},setRevealing:()=>{}});
$('[data-nav=records]').onclick=()=>ui.showRecords();$('#cast').onclick=()=>ui.popup('1');$('#dock-more').onclick=()=>sheet(claim200Protocol());
const flag=document.createElement('p');flag.style.cssText='position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:999;color:white;background:#203b4ddd;padding:8px 18px;border-radius:20px;font-size:12px';flag.textContent='本地交互预览 · 非真实鱼获 · 不发送交易';document.body.appendChild(flag);ui.showRecords();`;
fs.writeFileSync('.runtime/claim200-preview/preview.js',source);
await build({entryPoints:['.runtime/claim200-preview/preview.js'],bundle:true,format:'esm',outfile:'.runtime/claim200-preview/preview.bundle.js'});
let html=fs.readFileSync('web/index.html','utf8').replace(/<script type="module" src="app\.bundle\.js[^>]*><\/script>/,'<script type="module" src="/preview.bundle.js"></script>');
const app=express();app.get('/preview',(_,res)=>res.type('html').send(html));app.get('/preview.bundle.js',(_,res)=>res.type('js').send(fs.readFileSync('.runtime/claim200-preview/preview.bundle.js')));app.use(express.static('web'));app.listen(4217,'127.0.0.1',()=>console.log('Preview http://127.0.0.1:4217/preview'));

