import {formatEther} from 'ethers';
import {getLanguage,speciesLabel} from './i18n.js';
import {CLAIM200_RECORD_LABELS as labels} from './claim200-records.js';
export function createClaim200UI(c){
 const {client,$,esc,sheet,close,showPage,notice,error,receipt,saveTx,markTx,key}=c;
 let filter='all',limit=20,cache=null,loading=false,claimBusy=false;
 const words=()=>labels[getLanguage()]||labels.zh;
 const sp=id=>FishGuide.species.find(s=>s.id===Number(id));
 const pendingKey=id=>key()+':claim:'+id;
 const pending=id=>{try{return localStorage.getItem(pendingKey(id));}catch{return null;}};
 function remember(id,hash,scope=key()){try{const k=scope+':claim:'+id;if(hash)localStorage.setItem(k,hash);else localStorage.removeItem(k);}catch{}}
 function clearCache(){cache=null;}
 function artwork(f){const s=sp(f.speciesId),t=FishGuide.tiers.find(x=>x.id===s?.rarity);return `<div class="claim-catch-art" style="--catch-color:${esc(t?.color||'#98b5c7')}"><img src="/nft-images/${Number(f.speciesId)}.png" alt="${esc(s?speciesLabel(s):'鱼获')}" width="900" height="1200"><div><span>${esc(t?.name||'收藏鱼获')}</span><h2>${esc(s?speciesLabel(s):'鱼获')}</h2><p>${Number(f.lengthMm)/10} cm · ${Number(f.massGrams)/1000} kg</p></div></div>`;}
 async function popup(id){
  if(!client.address)return c.walletDialog();const scope=key();
  try{
   const [entry,result]=await Promise.all([client.contract.entries(id),client.contract.entryOutcome(id)]);
   if(scope!==key())return;
   if(entry.player.toLowerCase()!==client.address.toLowerCase())throw Error('鱼获不属于当前地址');
   if(result.outcome!==2n&&result.outcome!==4n)throw Error('鱼获还在验证中，请稍后查看记录');
   const f=await client.contract.awardFish(id);if(scope!==key())return;
   const claimed=result.outcome===4n;
   sheet(`<div class="claim-dialog"><span class="eyebrow">BNBFISH · YOUR CATCH</span>${artwork(f)}<div class="claim-steps"><span class="done">鱼获已锁定</span><i>›</i><span class="${claimed?'done':''}">钱包领取</span><i>›</i><span class="${claimed?'done':''}">NFT 到账</span></div><p class="claim-promise">${claimed?'NFT 已领取，转账后仍保留这次垂钓记录。':words().note}</p><div class="claim-fee"><span>领取费用</span><b id="claim-gas">${claimed?'已完成':'点击下方按钮估算网络 Gas'}</b></div><p class="module-note">领取不再收取 0.00001 BNB 协议费。NFT 仅供收藏娱乐，没有经济价值属性。</p><p id="claim-message" role="status"></p><div class="claim-actions"><button id="claim-later" class="claim-secondary">${claimed?'查看记录':'稍后领取'}</button><button id="claim-now" class="sheet-action" ${claimed?'disabled':''}>${claimed?'已领取':pending(id)?'核验已提交交易':'估算 Gas · 领取鱼获'}</button></div></div>`);
   $('#modal .sheet').classList.add('claim-sheet');$('#claim-later').onclick=()=>{close();showRecords(claimed?'claimed':'unclaimed');};
   const button=$('#claim-now'),message=$('#claim-message');let quote;
   const update=text=>{if(message.isConnected)message.textContent=text;};
   async function complete(hash,confirmedReceipt){
    const r=confirmedReceipt||await client.reader.getTransactionReceipt(hash);
    if(scope!==key())return false;
    if(!r){update('交易已提交，等待网络确认。可关闭窗口，稍后从未领取记录继续核验。');return false;}
    if(r.status!==1){remember(id,null,scope);throw Error('领取交易未成功，鱼获仍保留在未领取中');}
    const entry=await client.contract.entries(id);if(scope!==key())return false;
    if(Number(entry.state)!==2||entry.tokenId===0n)throw Error('交易已确认，正在核验鱼获状态，请稍后刷新');
    remember(id,null,scope);clearCache();update('领取成功 · NFT 已进入你的钱包');
    if(button.isConnected){button.textContent='已领取 ✓';button.disabled=true;$('#claim-gas').textContent='NFT #'+entry.tokenId;document.querySelectorAll('.claim-steps span').forEach(x=>x.classList.add('done'));$('#claim-later').textContent='查看记录';$('#claim-later').onclick=()=>{close();showRecords('claimed',true);};message.classList.add('claim-success-message');message.insertAdjacentHTML('beforeend',` <a href="${esc(client.config.explorer+'/tx/'+hash)}" target="_blank" rel="noopener noreferrer">↗</a>`);}
    const old=document.querySelector('.claim-success-toast');old?.remove();const toast=document.createElement('div');toast.className='claim-success-toast';toast.setAttribute('role','status');toast.textContent='✓ '+(words().claimed)+' · NFT #'+entry.tokenId;document.body.appendChild(toast);setTimeout(()=>toast.remove(),8000);
    window.dispatchEvent(new CustomEvent('bnbfish:claimed',{detail:{scope,entryId:String(id),tokenId:String(entry.tokenId)}}));return true;
   }
   button.onclick=async()=>{
    if(claimBusy)return;claimBusy=true;button.disabled=true;let done=false;
    try{
     if(scope!==key())throw Error('账户已变化，请重新打开记录');
     const hash=pending(id);if(hash){done=await complete(hash);return;}
     if(!quote){update('正在估算领取 Gas…');quote=await client.prepareClaim(id);if(scope!==key()||!button.isConnected)return;$('#claim-gas').textContent=formatEther(quote.gasCost)+' BNB';button.textContent='前往钱包确认领取';update('鱼获已经为你保留；请核对网络 Gas 后确认。');return;}
     update('等待钱包确认…');const tx=await client.claimCatch(quote);remember(id,tx.hash,scope);const storage=saveTx(tx,'领取鱼获',{entryId:String(id)},scope+':tx');update('已提交 · 正在等待链上确认，可关闭此窗口');
     const r=await receipt(tx);markTx(storage,tx.hash,r.status===1?'已入块':'失败');
     if(scope!==key())return;done=await complete(r.hash||tx.hash,r);
    }catch(e){update(error(e));quote=null;if(button.isConnected)button.textContent=pending(id)?'核验已提交交易':'重新估算 Gas';}
    finally{claimBusy=false;if(button.isConnected&&!done)button.disabled=false;}
   };
  }catch(e){notice(e);}
 }
 async function showRecords(selected=filter,refresh=false){
  filter=selected;showPage('records','鱼获记录','BNBFISH · COLLECTION JOURNAL',`<div class="claim-record-intro"><span>每一次相遇，都值得珍藏</span><p>未领取鱼获永久保留，随时领取到钱包。</p></div><div class="claim-record-tabs"><button data-claim-filter="all">全部垂钓</button><button data-claim-filter="unclaimed">未领取</button><button data-claim-filter="claimed">已领取</button><button id="claim-transfers">转入 / 转出</button></div><div class="claim-record-toolbar"><span id="claim-count">正在核验链上记录…</span><button id="claim-refresh">同步 ↻</button></div><div id="claim-record-list" aria-live="polite"></div><button id="claim-more" class="history-more" hidden>查看更多记录</button>`);
  const host=$('#claim-record-list'),count=$('#claim-count'),scope=client.address?key():null;
  document.querySelectorAll('[data-claim-filter]').forEach(b=>{b.classList.toggle('selected',b.dataset.claimFilter===filter);b.onclick=()=>showRecords(b.dataset.claimFilter);});
  $('#claim-transfers').onclick=()=>c.openTransfers();$('#claim-refresh').onclick=()=>showRecords(filter,true);
  if(!scope){count.textContent='连接钱包，查看你的鱼获记录';host.innerHTML='<button class="sheet-action" id="claim-connect">连接钱包</button>';$('#claim-connect').onclick=c.walletDialog;return;}
  try{
   let data=cache?.scope===scope&&cache.limit===limit&&Date.now()-cache.at<15000&&!refresh?cache.data:null;
   if(!data){let rows=[],offset=0,result;do{result=await client.claimRecords({offset,limit:Math.min(50,limit-offset)});rows.push(...result.rows);offset=result.nextOffset;}while(result.hasMore&&rows.length<limit);data={...result,rows};cache={scope,limit,at:Date.now(),data};}
   if(!host.isConnected||scope!==key())return;
   const rows=data.rows.filter(r=>filter==='all'||r.status===filter);
   count.textContent=`已读取 ${data.rows.length} / ${data.count} 次垂钓 · 链上区块 ${data.blockTag}`;
   host.innerHTML=rows.map(r=>{const s=r.fish?sp(r.fish.speciesId):null,t=FishGuide.tiers.find(t=>t.id===s?.rarity);return `<article class="claim-record" style="--catch-color:${esc(t?.color||'#93aeba')}"><div class="claim-record-art">${s?`<img src="/nft-images/${s.id}.png" alt="${esc(speciesLabel(s))}" width="900" height="1200" loading="lazy">`:'<span>≈</span>'}</div><div class="claim-record-copy"><span class="claim-record-state" data-state="${r.status}">${esc(words()[r.status])}</span><b>${esc(s?speciesLabel(s):r.status==='escaped'?'这次鱼儿游远了':'静候湖面鱼讯')}</b><small>${s?esc(t?.name)+' · ':''}${new Date(r.castAt*1000).toLocaleString()}</small><small>垂钓 #${r.id}${r.fish?' · '+r.fish.lengthMm/10+' cm':''}</small></div>${r.fish?`<button data-claim-entry="${r.id}" class="claim-row-action">${r.claimable?pending(r.id)?'确认中':'领取':'查看'}</button>`:'<span class="claim-record-water">'+esc(FishGuide.waters[r.water]?.name||'')+'</span>'}</article>`;}).join('')||'<div class="history-empty"><h3>这里还没有鱼获</h3><p>已确认但未领取的鱼获会一直为你保留。更早记录可继续加载。</p></div>';
   host.querySelectorAll('[data-claim-entry]').forEach(b=>b.onclick=()=>popup(b.dataset.claimEntry));$('#claim-more').hidden=!data.hasMore;$('#claim-more').onclick=()=>{limit+=20;showRecords(filter);};
  }catch(e){if(host.isConnected)count.textContent='读取暂未完成：'+error(e);}
 }
 async function poll(){
  if(loading||!c.getRequest()||!client.address||c.isBusy())return;loading=true;const id=c.getRequest(),scope=key();
  try{
   const [entry,result,head]=await Promise.all([client.contract.entries(id),client.contract.entryOutcome(id),client.reader.getBlockNumber()]);if(scope!==key()||id!==c.getRequest())return;
   if(entry.player.toLowerCase()!==client.address.toLowerCase())throw Error('垂钓记录不属于当前地址');
   const state=Number(result.outcome),target=Number(await client.contract.targetBlock(entry.roundId))+3;
   if([1,5,7].includes(state)){if(state===7){let health;try{health=await c.getAutomation();}catch{}if(scope!==key()||id!==c.getRequest())return;if(health&&health.ready===false){c.setProgress({title:'公共验证暂缓 · 记录已保留',detail:['needs-funding','income-budget-limit','gas-budget-limit'].includes(health.code)?'验证服务正在等待费用预算，尚未确定鱼获。预算恢复后继续处理，不需要重复抛竿。':'验证服务暂不可用，记录仍在链上，稍后自动重试。',meta:'垂钓 #'+id,tone:'attention'});return;}}c.setProgress({title:state===1?`守漂中 · 预计还需 ${Math.max(0,target-head)} 个区块`:state===5?'鱼讯等待历史证明恢复':'鱼讯正在验证',detail:state===1?'目标区块到达后，由合约锁定鱼获。':'记录仍保留在链上；验证完成后才能确定鱼获，不会将延迟当作空竿。',meta:'垂钓 #'+id});return;}
   if(![2,3,4].includes(state))throw Error('无法识别鱼获状态');
   if(state===2){c.setRevealing(true,id);close();const f=await client.contract.awardFish(id),s=sp(f.speciesId);c.setProgress({title:'鱼儿上钩了',detail:'鱼获已锁定 · 可立即领取，也可稍后领取',tone:'success'});await Lake3D.feedback('catch',{name:s?.name,size:Math.max(.65,Math.min(1.65,Number(f.lengthMm)/700))});if(scope!==key()||id!==c.getRequest())return;c.clearRequest();clearCache();c.setRevealing(false);await popup(id);}
   else {c.clearRequest();if(state===3)await Lake3D.feedback('reset');c.setProgress({title:state===3?'鱼儿游走了 · 再试一竿':'鱼获已领取',detail:state===3?'本次垂钓已结束，可在记录中查看。':'可在鱼篓查看 NFT 收藏卡。',tone:'complete'});}
  }catch(e){if(scope===key())c.setProgress({title:'正在恢复鱼讯',detail:error(e)+'，稍后自动重试。',tone:'attention'});}finally{loading=false;if(scope===key())c.setRevealing(false);c.syncDock();}
 }
 return {popup,showRecords,poll,clearCache};
}
