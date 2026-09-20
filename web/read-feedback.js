/* Lightweight feedback for overlapping reads. No invented progress percentages. */
(()=>{
 const pending=new Map(),bar=document.createElement('div');bar.className='read-feedback';bar.hidden=true;
 bar.innerHTML='<span class="read-orbit"></span><span class="read-label">正在读取</span><i></i>';
 bar.setAttribute('role','status');bar.setAttribute('aria-live','polite');document.querySelector('.phone').appendChild(bar);
 let count=0,showTimer,hideTimer;
 function start(label='正在读取链上数据',timeout=160000){
  const id=++count;clearTimeout(hideTimer);pending.set(id,label);bar.classList.remove('settled');bar.querySelector('.read-label').textContent=label;
  if(!showTimer)showTimer=setTimeout(()=>{showTimer=null;if(pending.size)bar.hidden=false;},160);
  let done=false;const timer=setTimeout(finish,timeout);
  function finish(){if(done)return;done=true;clearTimeout(timer);pending.delete(id);if(pending.size){bar.querySelector('.read-label').textContent=[...pending.values()].at(-1);return;}clearTimeout(showTimer);showTimer=null;bar.classList.add('settled');bar.querySelector('.read-label').textContent='读取结束';hideTimer=setTimeout(()=>{bar.hidden=true;},450);}
  return finish;
 }
 function reveal(node){if(!node||matchMedia('(prefers-reduced-motion: reduce)').matches)return;node.animate([{opacity:.5,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'ease-out'});}
 window.ReadFeedback={start,reveal};
})();
