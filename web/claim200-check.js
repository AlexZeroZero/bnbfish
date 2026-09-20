import {Contract,keccak256,getAddress} from 'ethers';
import art from '../artifacts/claim200/BnbfishClaim200.json' with {type:'json'};
import definition from '../artifacts/claim200/rules.json' with {type:'json'};
export {art,definition};
const RECIPIENT=getAddress('0x1bb935eeedd1338ebbb4faa79c1009314b8c520e');
function mask(code){const chars=code.slice(2).toLowerCase().split('');for(const refs of Object.values(art.immutableReferences))for(const r of refs)chars.fill('0',r.start*2,(r.start+r.length)*2);return chars.join('');}
export async function verifyClaim200(provider,address,admin,{initial=false,onProgress=()=>{}}={}){
 if(BigInt(await provider.send('eth_chainId',[]))!==56n)throw Error('需要 BNB 主网');
 const code=await provider.getCode(address);if(mask(code)!==mask(art.runtimeBytecode))throw Error('200 区块合约代码不匹配');
 const n=new Contract(address,art.abi,provider);
 if(await n.rulesHash()!==definition.hash||getAddress(await n.owner())!==getAddress(admin)||getAddress(await n.feeRecipient())!==RECIPIENT||await n.protocolFee()!==10000000000000n||await n.INTERVAL()!==200n||await n.MAX_WINNERS()!==50n||await n.HASH_DEPTH()!==3n||await n.MAX_SUPPLY()!==2000000n)throw Error('规则、收费或权限不匹配');
 if(initial&&(!await n.paused()||await n.nextTokenId()!==1n||await n.startBlock()!==0n||await n.totalAllocated()!==0n||await n.settlementCursor()!==0n||await n.issuedCasts()!==0n||await n.protocolFeesCollected()!==0n))throw Error('初始状态不匹配');
 if(await n.imageBase()!=='https://bnbfish.trade/nft-images/')throw Error('NFT 图片地址不匹配');
 const tiers=['common','rare','precious','exceptional','legendary'];
 const all=definition.rules.catalog.filter(s=>s.enabled).sort((a,b)=>a.id-b.id),counts=tiers.map(t=>all.filter(s=>s.rarity===t).length),seen=[0,0,0,0,0];
 for(let i=0;i<5;i++)if(await n.tierCaps(i)!==BigInt(definition.rules.tierCaps[i]))throw Error('稀有度配额不匹配');
 for(const s of all){
  const tier=tiers.indexOf(s.rarity),cap=BigInt(Math.floor(definition.rules.tierCaps[tier]/counts[tier])+(seen[tier]++<definition.rules.tierCaps[tier]%counts[tier]?1:0));
  const sp=await n.species(s.id),expected=[s.id,tier,s.waters.reduce((a,w)=>a|(1<<w),0),s.selectionWeight,s.lengthMinMm,s.lengthMaxMm,s.referenceLengthMm,s.referenceMassGrams];
  if(await n.speciesCaps(s.id)!==cap||Array.from(sp).some((v,i)=>v!==BigInt(expected[i])))throw Error('物种配置不匹配：'+s.id);
  if(initial&&(await n.speciesMinted(s.id)!==0n||await n.speciesAllocated(s.id)!==0n))throw Error('新系列已有铸造记录');
  onProgress(seen.reduce((a,b)=>a+b,0),all.length);
 }
 return {contract:address,runtimeCodeHash:keccak256(code),rulesHash:definition.hash,feeRecipient:RECIPIENT,protocolFeeWei:'10000000000000',paused:await n.paused(),startBlock:(await n.startBlock()).toString()};
}
