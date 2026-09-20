/* Presentation layer only: collectible surfaces never participate in NFT validation. */
(()=>{
 const tiers=[['common','普通','银辉','I'],['rare','稀有','蓝银','II'],['precious','珍稀','紫辉','III'],['exceptional','罕见','玫瑰金','IV'],['legendary','极其罕见','香槟金','V']];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function tier(value){return tiers.find(t=>t[0]===value||t[1]===value)||tiers[0];}
 function ornament(value){
  const paths=Array.from({length:7},(_,i)=>`<path d="M${3+i*3} 63 C${3+i*3} ${24+i*2},${33+i*2} ${21+i*2},${56+i*3} 3"/>`).join('');
  return `<span class="frame-engraving" aria-hidden="true">${['a','b','c','d'].map(c=>`<svg class="engraving-${c}" viewBox="0 0 80 68" fill="none" stroke="currentColor" stroke-width=".75">${paths}</svg>`).join('')}</span><span class="frame-caustic" aria-hidden="true"></span><span class="rarity-motion" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>`;
 }
 function band(value){return '<span class="frame-band" aria-hidden="true">Bnbfish<span>AQUATIC COLLECTION</span></span>';}
 function header(value){return `<div class="specimen-edition"><span>Bnbfish<small>AQUATIC COLLECTION</small></span><b>收藏卡</b></div>`;}
 function detail(o){const t=tier(o.rarity),colors=['#ffffff','#49a6ff','#bb86fc','#ff82bd','#ffbc55'];return `<div class="specimen-detail" data-tier="${t[0]}" style="--rarity:${colors[tiers.indexOf(t)]}">${ornament(t[0])}${header(t[0])}<div class="${o.guide?'guide-detail-art':'result-art nft-detail-art'}">${FishArt({name:o.name,collectible:true})}</div><div class="specimen-title"><h2>${esc(o.name)}</h2><span>${t[1]}</span></div><div class="result-meta"><div><small>${o.guide?'尺寸范围':'尺寸'}</small><b>${esc(o.length||'—')}</b></div><div><small>${o.guide?'类别':'重量'}</small><b>${esc(o.guide?o.group||'鱼类':o.weight||'—')}</b></div><div><small>收藏等级</small><b>${t[3]} · ${t[1]}</b></div></div><div class="specimen-foot">${esc(o.guide?'物种图鉴 · 展示参考':o.footer||'BNB · ON-CHAIN COLLECTIBLE')}</div></div>`;}

 function trackMotion(){
  const tracked=new Set();let queued=false;
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('motion-visible',e.isIntersecting)),{threshold:.12});
  const sync=()=>{queued=false;for(const el of tracked)if(!el.isConnected){observer.unobserve(el);tracked.delete(el);}document.querySelectorAll('.nft-card[data-tier],.specimen-detail[data-tier]').forEach(el=>{if(!tracked.has(el)){tracked.add(el);observer.observe(el);}});};
  new MutationObserver(()=>{if(!queued){queued=true;requestAnimationFrame(sync);}}).observe(document.body,{childList:true,subtree:true});
  const visibility=()=>document.documentElement.classList.toggle('collectibles-paused',document.hidden);
  document.addEventListener('visibilitychange',visibility);visibility();sync();
  // Touch reflection follows the finger without capturing vertical scrolling.
  let active=null;
  const reset=()=>{if(active){active.style.removeProperty('--touch-x');active.style.removeProperty('--touch-y');active.classList.remove('material-touch');active=null;}};
  document.addEventListener('pointermove',e=>{
   if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const card=e.target.closest?.('.specimen-detail');if(!card){reset();return;}
   if(active&&active!==card)reset();active=card;const r=card.getBoundingClientRect();
   card.style.setProperty('--touch-x',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');
   card.style.setProperty('--touch-y',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');card.classList.add('material-touch');
  },{passive:true});
  document.addEventListener('pointerup',reset,{passive:true});document.addEventListener('pointercancel',reset,{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',trackMotion,{once:true});else trackMotion();
 window.NftFrame={tiers,tier,ornament,band,header,detail};
})();
