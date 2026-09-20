// Bound the signed transaction itself, not only an estimated accounting entry.
export function verificationBudget({estimate,gasPrice,balance,maxTx,maxDay,spent}){
 if(estimate<=0n||gasPrice<=0n)throw Error('Invalid gas estimate');
 const minimum=(estimate*105n+99n)/100n;
 const preferred=(estimate*120n+99n)/100n;
 const limits=[['gas-budget-limit',maxTx],['gas-budget-limit',maxDay-spent],['needs-funding',balance]];
 for(const [code,available] of limits)if(available<minimum*gasPrice)return {ok:false,code};
 const gasLimit=limits.reduce((gas,[,available])=>gas<available/gasPrice?gas:available/gasPrice,preferred);
 return {ok:true,gasLimit,reserved:gasLimit*gasPrice};
}
