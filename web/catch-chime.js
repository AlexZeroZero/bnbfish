/* Original soft bell cue; independent of lake recording download. */
window.CatchChime=(()=>{const voices=new Set();return {stop(){for(const osc of voices){try{osc.stop();}catch{}}voices.clear();},play(ctx,destination,kind){
 if(!['bite','catch'].includes(kind)||ctx.state!=='running')return;
 const notes=kind==='bite'?[783.99,1046.50]:[783.99,1046.50,1318.51];
 const start=ctx.currentTime+.01;
 notes.forEach((hz,i)=>{
  const t=start+i*.13,voice=ctx.createGain();voice.gain.setValueAtTime(0,t);voice.gain.linearRampToValueAtTime(.19,t+.008);voice.gain.exponentialRampToValueAtTime(.0001,t+.52);voice.connect(destination);
  let left=2;[1,2.003].forEach((ratio,j)=>{const osc=ctx.createOscillator(),partial=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(hz*ratio,t);partial.gain.value=j?.12:1;osc.connect(partial).connect(voice);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();partial.disconnect();if(!--left)voice.disconnect();};osc.start(t);osc.stop(t+.54);});
 });
}};})();
