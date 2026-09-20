import {Contract,keccak256} from 'ethers';
import art from '../artifacts/blockhash/BnbfishBlockhash.json' with {type:'json'};
import definition from '../artifacts/blockhash/rules.json' with {type:'json'};
export {art,definition};
function mask(code){let chars=code.slice(2).split('');for(const refs of Object.values(art.immutableReferences))for(const r of refs)chars.fill('0',r.start*2,(r.start+r.length)*2);return chars.join('');}
export async function verifyBlockhash(provider,address,admin,{initial=false,onProgress=()=>{}}={}){
 if((await provider.getNetwork()).chainId!==56n)throw Error('需要 BNB 主网');
 const code=await provider.getCode(address);if(mask(code)!==mask(art.runtimeBytecode))throw Error('合约运行时代码不匹配');
 const n=new Contract(address,art.abi,provider);
 if(await n.rulesHash()!==definition.hash||(await n.owner()).toLowerCase()!==admin.toLowerCase()||await n.baitFee()!==0n||await n.INTERVAL()!==10n||await n.HASH_DEPTH()!==3n||await n.MAX_SUPPLY()!==2000000n)throw Error('规则或权限不匹配');
 if(initial&&(!await n.paused()||await n.nextTokenId()!==1n||await n.startBlock()!==0n))throw Error('新部署初始状态不匹配');
 const tiers=['common','rare','precious','exceptional','legendary'];
 const all=definition.rules.catalog.filter(s=>s.enabled).sort((a,b)=>a.id-b.id),counts=tiers.map(t=>all.filter(s=>s.rarity===t).length),seen=[0,0,0,0,0];
 for(let i=0;i<5;i++)if(await n.tierCaps(i)!==BigInt(definition.rules.tierCaps[i]))throw Error('稀有度配额不匹配');
 for(const s of all){
  const tier=tiers.indexOf(s.rarity),cap=BigInt(Math.floor(definition.rules.tierCaps[tier]/counts[tier])+(seen[tier]++<definition.rules.tierCaps[tier]%counts[tier]?1:0));
  const sp=await n.species(s.id),actual=await n.speciesCaps(s.id);
  const expected=[s.id,tier,s.waters.reduce((a,w)=>a|(1<<w),0),s.selectionWeight,s.lengthMinMm,s.lengthMaxMm,s.referenceLengthMm,s.referenceMassGrams];
  if(actual!==cap||Array.from(sp).some((v,i)=>v!==BigInt(expected[i])))throw Error('物种配置不匹配：'+s.id);
  onProgress(seen.reduce((a,b)=>a+b,0),all.length);
 }
 return {contract:address,runtimeCodeHash:keccak256(code),rulesHash:definition.hash,paused:await n.paused(),startBlock:(await n.startBlock()).toString(),imageBase:await n.imageBase()};
}
