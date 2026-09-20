import {BrowserProvider,JsonRpcProvider,Contract,keccak256,formatEther,parseEther} from 'ethers';
import {ACTIVATION} from './claim200-activation-config.js';
import {claim200Abi} from './claim200-client.js';
import {sameTransaction} from './transaction-security.js';
const $=s=>document.querySelector(s),msg=t=>$('#status').textContent=t,p=new JsonRpcProvider(ACTIVATION.rpcUrl,56,{staticNetwork:true,batchMaxCount:1}),n=new Contract(ACTIVATION.contract,claim200Abi,p);
let wallet,signer,busy=false;const activateKey='bnbfish:claim200:activate:'+ACTIVATION.contract;
$('#contract').textContent=ACTIVATION.contract;$('#recipient').textContent=ACTIVATION.feeRecipient;$('#operator').textContent=ACTIVATION.operator;
async function read(){
 const [code,chain,hash,owner,fee,recipient,paused,balance]=await Promise.all([p.getCode(ACTIVATION.contract),p.send('eth_chainId',[]),n.rulesHash(),n.owner(),n.protocolFee(),n.feeRecipient(),n.paused(),p.getBalance(ACTIVATION.operator)]);
 if(BigInt(chain)!==56n||keccak256(code)!==ACTIVATION.runtimeCodeHash||hash!==ACTIVATION.rulesHash||owner.toLowerCase()!==ACTIVATION.admin.toLowerCase()||fee!==10000000000000n||recipient.toLowerCase()!==ACTIVATION.feeRecipient.toLowerCase())throw Error('链上配置与已核验版本不符');
 $('#balance').textContent=formatEther(balance)+' BNB';$('#chain-state').textContent=paused?'已部署 · 暂停，等待开启':'已开启';$('#activate').disabled=!signer||!paused||busy;if(!paused)$('#activate').textContent='已开启，无需重复操作';return {paused,balance};
}
async function guard(){
 if(!wallet||!signer)throw Error('请连接管理员钱包');
 const [chain,accounts,code]=await Promise.all([wallet.send('eth_chainId',[]),wallet.send('eth_accounts',[]),wallet.send('eth_getCode',[ACTIVATION.contract,'latest'])]);
 if(BigInt(chain)!==56n||accounts[0]?.toLowerCase()!==ACTIVATION.admin.toLowerCase()||keccak256(code)!==ACTIVATION.runtimeCodeHash)throw Error('钱包网络、管理员或合约代码不符');return read();
}
async function wait(tx){try{return await tx.wait(3);}catch(e){if(e.code==='TRANSACTION_REPLACED'&&!e.cancelled&&e.receipt?.status===1&&sameTransaction(tx,e.replacement))return e.receipt;throw e;}}
$('#connect').onclick=async()=>{if(busy)return;busy=true;try{if(!window.ethereum)throw Error('请在带有钱包的浏览器打开');wallet=new BrowserProvider(window.ethereum,undefined,{batchMaxCount:1});await wallet.send('eth_requestAccounts',[]);signer=await wallet.getSigner();await guard();$('#fund').disabled=false;msg('管理员已核验。先核对验证 Gas 余额，再开启合约。');}catch(e){signer=null;msg(e.shortMessage||e.message);}finally{busy=false;await read().catch(e=>msg(e.message));}};
$('#fund').onclick=async()=>{if(busy)return;busy=true;$('#fund').disabled=true;try{await guard();const value=parseEther($('#fund-amount').value.trim());if(value<=0n||value>parseEther('0.1'))throw Error('本页单次拨入须大于 0 且不超过 0.1 BNB');msg('请在钱包中核对：向 '+ACTIVATION.operator+' 拨入 '+formatEther(value)+' BNB，另付网络 Gas。');const tx=await signer.sendTransaction({to:ACTIVATION.operator,value});msg('拨入已提交：'+tx.hash);const r=await wait(tx);if(r.status!==1)throw Error('转账未成功');msg('验证余额已补充，可开启新版。');}catch(e){msg(e.shortMessage||e.message);}finally{busy=false;$('#fund').disabled=false;await read().catch(e=>msg(e.message));}};
$('#activate').onclick=async()=>{if(busy)return;busy=true;$('#activate').disabled=true;try{
 const state=await guard();if(!state.paused){msg('新版已开启。');return;}
 const saved=localStorage.getItem(activateKey);if(saved){const r=await p.getTransactionReceipt(saved);if(!r){msg('开启交易待确认，请勿重复提交：'+saved);return;}if(r.status===1)throw Error('已有成功开启交易，请刷新检查状态，勿重复操作');localStorage.removeItem(activateKey);}
 if(state.balance<parseEther('0.0003'))throw Error('公共验证地址余额不足 0.0003 BNB，请先补充运行余额');
 const [config,health]=await Promise.all([fetch('/api/config',{cache:'no-store'}).then(r=>r.json()),fetch('/api/automation',{cache:'no-store'}).then(r=>r.json())]);
 if(config.contract?.toLowerCase()!==ACTIVATION.contract.toLowerCase()||health.contract?.toLowerCase()!==ACTIVATION.contract.toLowerCase()||health.address?.toLowerCase()!==ACTIVATION.operator.toLowerCase()||!health.ready)throw Error('网站或验证服务尚未就绪，请稍后重新检查');
 msg('请在钱包中确认开启已部署合约（setPaused(false)），只支付网络 Gas。');const tx=await n.connect(signer).setPaused(false);localStorage.setItem(activateKey,tx.hash);msg('开启交易已提交：'+tx.hash);const r=await wait(tx);if(r.status!==1)throw Error('开启交易未成功');await read();msg('新版垂钓已开启。返回游戏刷新即可测试；每杆 0.00001 BNB 协议费，Gas 另计。');
}catch(e){msg(e.shortMessage||e.message);}finally{busy=false;await read().catch(e=>msg(e.message));}};
await read().catch(e=>msg(e.shortMessage||e.message));
