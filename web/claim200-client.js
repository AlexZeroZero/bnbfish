import {Contract,keccak256} from 'ethers';
import art from '../artifacts/claim200/BnbfishClaim200.json' with {type:'json'};
import {loadClaim200Records} from './claim200-records.js';
import {CLAIM200_IDENTITY} from './claim200-identity.js';
export const claim200Abi=art.abi;
export function validateClaim200Config(c){
 const p=CLAIM200_IDENTITY;
 if(!p||c.chainId!==56||c.local||c.protocol!=='claim200-reserved-v2'||c.contract?.toLowerCase()!==p.contract.toLowerCase()||c.rulesHash!==p.rulesHash||c.protocolFeeWei!=='10000000000000'||c.feeRecipient?.toLowerCase()!=='0x1bb935eeedd1338ebbb4faa79c1009314b8c520e'||c.rpcUrl!=='https://bsc-dataseed.bnbchain.org'||c.explorer!=='https://bscscan.com')throw Error('新版主网配置尚未完成独立核验');return p;
}
export function installClaim200Client(Type){
 const proto=Type.prototype;Object.defineProperty(proto,'claim200',{get(){return this.config?.protocol==='claim200-reserved-v2';}});
 for(const [name,fn] of Object.entries({
  async guard(){
   const p=validateClaim200Config(this.config);if(!this.signer||!this.address)throw Error('请连接钱包');
   const [chain,accounts]=await Promise.all([this.injected.request({method:'eth_chainId'}),this.injected.request({method:'eth_accounts'})]);
   if(BigInt(chain)!==56n||accounts[0]?.toLowerCase()!==this.address.toLowerCase())throw Error('账户或网络已改变，请重新连接');
   const [a,b,hash,fee,recipient]=await Promise.all([this.reader.getCode(p.contract),this.injected.request({method:'eth_getCode',params:[p.contract,'latest']}),this.contract.rulesHash(),this.contract.protocolFee(),this.contract.feeRecipient()]);
   if(keccak256(a)!==p.runtimeCodeHash||keccak256(b)!==p.runtimeCodeHash||hash!==p.rulesHash||fee!==10000000000000n||recipient.toLowerCase()!==this.config.feeRecipient.toLowerCase())throw Error('链上代码或收费核验不符，交易已阻止');
  },
  async prepareCast(water){await this.guard();if(!Number.isInteger(water)||water<0||water>2)throw Error('无效水域');const round=await this.contract.currentRound();if(await this.contract.entryOf(round,this.address)!==0n)throw Error('本次 200 区块垂钓已参与，请等待下一次鱼讯后再抛竿');const gas=await this.contract.connect(this.signer).cast.estimateGas(water,{value:10000000000000n});return {water,address:this.address,fee:10000000000000n,gasCost:await this.gasCost(gas)};},
  async sendCast(q){await this.guard();if(q.address!==this.address||q.fee!==10000000000000n)throw Error('抛竿信息已变化，请重新确认');return this.contract.connect(this.signer).cast(q.water,{value:q.fee});},
  castTicketId(log){return log.args.entryId.toString();},
  async pendingTicket(){const page=await loadClaim200Records(this.contract,this.address,{limit:50});const row=page.rows.find(x=>['waiting','verifying','proof'].includes(x.status));return row?BigInt(row.id):0n;}
 })){const original=proto[name];proto[name]=function(...args){return this.claim200?fn.apply(this,args):original.apply(this,args);};}
 proto.claimRecords=function(options){return loadClaim200Records(this.contract,this.address,options);};
 proto.prepareClaim=async function(id){await this.guard();const e=await this.contract.entries(id);if(e.player.toLowerCase()!==this.address.toLowerCase()||(await this.contract.entryOutcome(id)).outcome!==2n)throw Error('鱼获已领取或暂未确认，请刷新记录');const gas=await this.contract.connect(this.signer).claim.estimateGas(id);return{id,address:this.address,gasCost:await this.gasCost(gas)};};
 proto.claimCatch=async function(q){await this.guard();if(q.address!==this.address)throw Error('账户已变化');return this.contract.connect(this.signer).claim(q.id);};
}
