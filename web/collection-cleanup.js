// Remove only retired collection caches. Never erase current claims or preferences.
const retired=['0x84a26c7d59f600120653a41769ce08174e34642f','0xfc6ec4896289fa57d071020a769e4fa41a2d6d82'];
export function clearRetiredCollections(storage){
 let removed=0;
 try {for(const key of Array.from({length:storage.length},(_,i)=>storage.key(i))){
  const k=String(key).toLowerCase();
  if(retired.some(address=>k.startsWith('bnbfish-bnb:56:'+address+':')||k.startsWith('bnbfish-switch:'+address+':')||k==='bnbfish-activation:'+address)){
   storage.removeItem(key);removed++;
  }
 }}catch{}return removed;
}
