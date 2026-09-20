// Read-only, shared snapshots. Mint totals never include transfers or local animations.
export function createGlobalCatches({provider,contract,chainId,address,rulesHash,speciesIds,claim200=false,ttlMs=12000,depth=3,now=Date.now}){
 let snapshot=null,inflight=null,lastAttempt=-Infinity;const ids=[...new Set(speciesIds)].sort((a,b)=>a-b);
 const numeric=(value,max=2000000)=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<0||n>max)throw Error('INVALID_CHAIN_DATA');return n;};
 async function batches(values,fn){const out=[];for(let i=0;i<values.length;i+=8)out.push(...await Promise.all(values.slice(i,i+8).map(fn)));return out;}
 async function read(){
  const [network,head]=await Promise.all([provider.getNetwork(),provider.send('eth_blockNumber',[])]);if(Number(network.chainId)!==chainId)throw Error('RPC_CHAIN_MISMATCH');
  const blockNumber=Math.max(0,Number(BigInt(head))-depth),block=await provider.getBlock(blockNumber);if(!block?.hash)throw Error('BLOCK_UNAVAILABLE');const options={blockTag:blockNumber};
  if(await contract.rulesHash(options)!==rulesHash)throw Error('RULES_MISMATCH');
  const claimed=numeric(await contract.totalSupply(options));
  const total=claim200?numeric(await contract.totalAllocated(options)):claimed;
  if(claimed>total)throw Error('ALLOCATION_MISMATCH');
  let reusable=false;
  if(snapshot&&snapshot.blockNumber<=blockNumber){const old=await provider.getBlock(snapshot.blockNumber);reusable=old?.hash===snapshot.blockHash&&total>=snapshot.total;}
  let counts,latest;
  async function fishRow(tokenId){const f=await contract.fish(tokenId,options),ticket=await (claim200?contract.entries(f.requestId,options):contract.tickets(f.requestId,options));const speciesId=numeric(f.speciesId,65535);if(!ids.includes(speciesId)||BigInt(ticket.tokenId)!==BigInt(tokenId)||Number(ticket.state)!==2||!/^0x[0-9a-f]{40}$/i.test(ticket.player))throw Error('INVALID_CATCH');return {tokenId:String(tokenId),ticketId:String(f.requestId),speciesId,player:ticket.player,caughtAt:numeric(f.caughtAt,100000000000),water:numeric(f.water,2)};}
  if(claim200){
   counts=reusable&&total===snapshot.total?snapshot.species.map(row=>({...row})):await batches(ids,async speciesId=>({speciesId,count:numeric(await contract.speciesAllocated(speciesId,options))}));
   counts=counts.filter(row=>row.count>0);
   latest=reusable&&claimed===snapshot.claimed?snapshot.latest:await batches(Array.from({length:Math.min(claimed,12)},(_,i)=>claimed-i),fishRow);
  }
  else if(reusable&&total-snapshot.total<=64){counts=snapshot.species.map(row=>({...row}));const fresh=await batches(Array.from({length:total-snapshot.total},(_,i)=>snapshot.total+i+1),fishRow);for(const row of fresh){const count=counts.find(c=>c.speciesId===row.speciesId);if(count)count.count++;else counts.push({speciesId:row.speciesId,count:1});}latest=[...fresh.reverse(),...snapshot.latest].slice(0,12);}
  else {counts=await batches(ids,async speciesId=>({speciesId,count:numeric(await contract.speciesMinted(speciesId,options))}));counts=counts.filter(row=>row.count>0);latest=await batches(Array.from({length:Math.min(total,12)},(_,i)=>total-i),fishRow);}
  if(counts.reduce((sum,row)=>sum+row.count,0)!==total)throw Error('SUPPLY_MISMATCH');
  const check=await provider.getBlock(blockNumber);if(check?.hash!==block.hash)throw Error('SNAPSHOT_REORG');
  snapshot={chainId,contract:address,total,claimed,unclaimed:total-claimed,includesUnclaimed:claim200,speciesCount:counts.length,species:counts.sort((a,b)=>b.count-a.count||a.speciesId-b.speciesId),latest,blockNumber,blockHash:block.hash,updatedAt:now(),stale:false,confirmationDepth:depth};return snapshot;
 }
 return {async get(){
  if(snapshot&&now()-snapshot.updatedAt<ttlMs)return snapshot;
  if(!inflight&&now()-lastAttempt>=Math.min(ttlMs,5000)){lastAttempt=now();inflight=read().finally(()=>{inflight=null;});inflight.catch(()=>{});}
  if(!inflight){if(snapshot)return {...snapshot,stale:true};throw Error('FEED_UNAVAILABLE');}
  let timeout;try{return await Promise.race([inflight,new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error('FEED_TIMEOUT')),18000);timeout.unref?.();})]);}catch(e){if(snapshot)return {...snapshot,stale:true};throw e;}finally{clearTimeout(timeout);}
 }};
}
