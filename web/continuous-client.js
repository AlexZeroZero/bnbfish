// All state comes from the selected contract. Never create fish from UI timers.
export const continuousMethods={
 get continuous(){return this.config?.protocol==='blockhash-continuous-v1';},
 castTicketId(log){return (log.args.ticketId??log.args.requestId).toString();},
 async fishingEntries(limit=20,before=null){
  const address=this.address,blockTag=Number(await this.reader.send('eth_blockNumber',[]));
  const count=Number(await this.contract.playerTicketCount(address,{blockTag}));
  const end=before==null?count:Math.min(count,before),first=Math.max(0,end-Math.min(100,limit)),rows=[];
  for(let i=end;i>first;i-=6)rows.push(...await Promise.all(Array.from({length:Math.min(6,i-first)},async(_,j)=>{
   const id=await this.contract.playerTicketAt(address,i-j-1,{blockTag});
   const ticket=await this.contract.tickets(id,{blockTag});return {id,ticket};
  })));
  return {rows,count,before:first,more:first>0};
 },
 async pendingTicket(){
  if(!this.continuous)return this.contract.pendingRequest(this.address);
  let before=null;do{const page=await this.fishingEntries(60,before);const row=page.rows.find(r=>Number(r.ticket.state)===1);if(row)return row.id;before=page.more?page.before:0;}while(before>0);return 0n;
 },
 async fishingState(id){
  const head=Number(await this.reader.send('eth_blockNumber',[])),options={blockTag:head};
  const [ticket,next,eligible]=await Promise.all([this.contract.tickets(id,options),this.contract.nextTarget(options),this.contract.eligibleFrom(id,options)]);
  const node=await this.contract.nodes(next,options);
  const target=next>eligible?next:eligible;
  const [last,remaining,previous]=await Promise.all([this.contract.lastMintBlock(options),this.contract.waterRemaining(ticket.water,options),next>10n?this.contract.nodes(next-10n,options):null]);
  return {head:BigInt(head),ticket,next,target,node,last,remaining,previousExpired:Number(previous?.state)===3};
 },
 async waitMembership(onWait=()=>{},timeoutMs=45000){
  if(!this.continuous)return;
  const address=this.address,until=Date.now()+timeoutMs;let checkedAt=0;

  do{
   if(this.address!==address||!this.signer)throw Error('账户已变化，请重新连接');
   if(this.config?.chainId===56&&Date.now()-checkedAt>10000){
    checkedAt=Date.now();let health=null;
    try{const r=await fetch('/api/automation',{signal:AbortSignal.timeout(6000),cache:'no-store'});if(r.ok)health=await r.json();}catch{}
    if(health?.contract?.toLowerCase()===this.config.contract.toLowerCase()&&health.code==='needs-funding')throw Error('自动推进服务 Gas 余额不足，已有鱼竿仍在链上。请等待运营方补充 Gas 后再操作；本次未提交交易。');
   }
   const [next,count,head]=await Promise.all([this.contract.nextTarget(),this.contract.activeCount(),this.reader.send('eth_blockNumber',[])]);
   if(next===0n)throw Error('合约尚未开启');
   if(count===0n||BigInt(head)<next)return;
   onWait();await new Promise(resolve=>setTimeout(resolve,1000));
  }while(Date.now()<until);
  throw Error('鱼获确认尚未完成，暂不能改变垂钓资格。本次没有提交新交易，请稍后重试。');
 },
 async prepareWithdraw(id,onWait){
  await this.guard();await this.waitMembership(onWait);const address=this.address;
  const t=await this.contract.tickets(id);
  if(t.player.toLowerCase()!==address.toLowerCase()||Number(t.state)!==1)throw Error('这条垂钓记录已结束或不属于当前地址');
  const gas=await this.contract.connect(this.signer).withdrawRod.estimateGas(id);
  return {id,address,gasCost:await this.gasCost(gas)};
 },
 async withdraw(q,onWait){await this.guard();if(q.address!==this.address)throw Error('账户已变化');await this.waitMembership(onWait);await this.guard();return this.contract.connect(this.signer).withdrawRod(q.id);}
};
export function continuousProgress(s,automation){
 const meta='垂钓 #'+s.id+' · 区块 '+s.head;
 if(s.remaining===0n)return {title:'当前水域鱼获已全部收藏',detail:'不会继续产生这处水域的鱼获。可在垂钓记录中收竿。',meta,tone:'attention'};
 if(automation?.code==='needs-funding')return {title:'自动鱼讯暂缓 · 运营 Gas 不足',detail:'自动推进服务余额不足，鱼竿仍在链上持续垂钓。运营方补充 Gas 后自动恢复，无需重复抛竿。',meta,tone:'attention'};
 if(automation?.ready===false)return {title:'鱼讯确认暂缓 · 仍在垂钓',detail:'自动推进暂不可用。记录仍在链上；超时未确认的时段不会补发或伪装成空竿。',meta,tone:'attention'};
 if(s.head<s.target)return {title:'守漂中 · 距下次鱼讯 '+(s.target-s.head)+' 个区块',detail:(s.previousExpired?'上一时段确认超时。':'')+'尚未获得鱼获会继续垂钓，无需再次抛竿。10个区块不等于10秒。',meta};
 const gap=s.last===0n?0n:s.last+10n-s.head;
 return {title:gap>0n?'鱼获确认中 · 至少再等 '+gap+' 个区块':'鱼儿正在靠近 · 自动确认中',detail:s.head>s.next+256n&&Number(s.node.state)===0?'正在恢复延迟的鱼讯。未保存哈希的过期时段将跳过，你仍继续垂钓。':'目标区块已到达，等待链上处理。是否获得鱼获以合约完成记录为准。',meta,tone:s.head>s.next+256n?'attention':'waiting'};
}
