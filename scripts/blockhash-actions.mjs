// Read-only action planner. No choice of entropy, recipient, species, or redraw.
// Intended for a separately configured keeper; the live VRF keeper is untouched.
export async function planBlockhashAction(n,head){
 head=BigInt(head);
 const target=await n.nextTarget();
 if(target===0n)return {status:'not-started'};
 if(await n.activeCount()===0n)return {status:'idle'};
 if(head<target+3n)return {status:'waiting-bite',target,remaining:target+3n-head};
 const node=await n.nodes(target);
 if(node.state===1n&&node.winner!==0n){
  const last=await n.lastMintBlock();
  if(last!==0n&&head<last+10n)return {status:'confirming-catch',target,remaining:last+10n-head};
 }
 // Advance itself preserves the target hash before processing participants.
 // A preserved hash never expires; a missing expired hash is explicitly skipped.
 return {status:node.state===0n&&head>target+256n&&(await n.savedHashes(target))==='0x'+'0'.repeat(64)?'recovering-expired-node':'processing-catch',method:'advanceFor',args:[target,20],target};
}
