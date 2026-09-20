// Candidate-only adapter. Never interpret the live 10-block contract using this ABI.
export const CLAIM200_RECORD_LABELS={
 zh:{waiting:'垂钓中',verifying:'等待验证',proof:'等待恢复区块证明',unclaimed:'未领取',claimed:'已领取',escaped:'鱼跑了',claim:'领取鱼获',note:'鱼获已锁定，可随时领取；领取需支付网络 Gas。'},
 en:{waiting:'Fishing',verifying:'Awaiting verification',proof:'Awaiting block proof',unclaimed:'Unclaimed',claimed:'Claimed',escaped:'Fish escaped',claim:'Claim catch',note:'Your catch is reserved without expiry. Claiming requires network gas.'},
 ru:{waiting:'Рыбалка',verifying:'Ожидание проверки',proof:'Ожидание доказательства блока',unclaimed:'Не получено',claimed:'Получено',escaped:'Рыба ушла',claim:'Получить улов',note:'Улов закреплён за вами бессрочно. При получении оплачивается комиссия сети.'},
 ja:{waiting:'釣り中',verifying:'検証待ち',proof:'ブロック証明の復元待ち',unclaimed:'未受取',claimed:'受取済み',escaped:'魚が逃げました',claim:'釣果を受け取る',note:'釣果は期限なく確保されています。受取にはネットワークガス代が必要です。'}
};
export function claim200RecordStatus(outcome){
 const status={1:'waiting',2:'unclaimed',3:'escaped',4:'claimed',5:'proof',7:'verifying'}[Number(outcome)];
 if(!status)throw Error('Unknown claim200 outcome');return status;
}
export async function loadClaim200Records(contract,address,{offset=0,limit=20,blockTag}={}){
 if(!Number.isSafeInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>50)throw Error('Invalid pagination');
 if(blockTag===undefined)blockTag=await contract.runner.provider.getBlockNumber();
 const at={blockTag},count=Number(await contract.playerEntryCount(address,at));
 if(!Number.isSafeInteger(count))throw Error('Record count exceeds safe range');
 const end=Math.max(0,count-offset),start=Math.max(0,end-limit);
 const rows=await Promise.all(Array.from({length:end-start},async(_,index)=>{
  const id=await contract.playerEntryAt(address,end-1-index,at);
  const [entry,result]=await Promise.all([contract.entries(id,at),contract.entryOutcome(id,at)]);
  if(entry.player.toLowerCase()!==address.toLowerCase())throw Error('Record owner mismatch');
  const status=claim200RecordStatus(result.outcome);
  // Never fabricate an unclaimed fish while its on-chain reservation is pending.
  const catchData=(status==='unclaimed'||status==='claimed')?await contract.awardFish(id,at):null;
  return {id:id.toString(),roundId:entry.roundId.toString(),castAt:Number(entry.castAt),water:Number(entry.water),status,claimable:status==='unclaimed',tokenId:entry.tokenId===0n?null:entry.tokenId.toString(),fish:catchData?{speciesId:Number(catchData.speciesId),tier:Number(catchData.tier),lengthMm:Number(catchData.lengthMm),massGrams:catchData.massGrams.toString(),qualityBps:Number(catchData.qualityBps),caughtAt:Number(catchData.caughtAt)}:null};
 }));
 return {rows,count,nextOffset:offset+rows.length,hasMore:start>0,blockTag};
}
