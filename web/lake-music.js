/* Original stereo score; independent from positional lake foley. */
(()=>{
 const music=new Audio('assets/audio/shore-letter-v3.ogg');music.loop=true;music.volume=0;music.preload='none';
 let enabled=false,revision=0,fadeTimer;const button=document.createElement('button');button.type='button';button.className='lake-music-toggle';
 button.style.cssText='position:absolute;right:18px;top:272px;z-index:12;border:1px solid #dcebf477;border-radius:18px;padding:7px 12px;background:#183345bb;color:#edf8ff;font:12px system-ui;cursor:pointer';
 function label(){button.textContent=enabled?'♫ 岸边来信 · 开启':'♫ 音乐 · 关闭';button.setAttribute('aria-pressed',String(enabled));}
 function fade(target,pause=false){clearInterval(fadeTimer);const from=music.volume,start=performance.now();fadeTimer=setInterval(()=>{const p=Math.min(1,(performance.now()-start)/1100);music.volume=from+(target-from)*(p*p*(3-2*p));if(p===1){clearInterval(fadeTimer);if(pause)music.pause();}},35);}
 async function play(){const token=++revision;try{await music.play();if(token!==revision||!enabled||document.hidden){if(!enabled||document.hidden)music.pause();return;}fade(.3);}catch{if(token===revision){enabled=false;label();button.textContent='♫ 音乐 · 点击重试';}}}
 button.onclick=()=>{enabled=!enabled;label();if(enabled)play();else{revision++;fade(0,true);}};
 document.addEventListener('visibilitychange',()=>{revision++;clearInterval(fadeTimer);if(document.hidden){music.pause();music.volume=0;}else if(enabled)play();});
 window.addEventListener('pagehide',()=>{revision++;clearInterval(fadeTimer);music.pause();music.volume=0;});
 const attach=()=>{const host=document.querySelector('#lake-webgl');if(host?.parentElement&&!host.parentElement.contains(button))host.parentElement.appendChild(button);if(!host){clearInterval(fadeTimer);music.pause();}};
 new MutationObserver(attach).observe(document.body,{childList:true,subtree:true});label();attach();
})();
