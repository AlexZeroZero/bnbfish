/* Fullscreen is entered only from a deliberate user click. */
(()=>{
 const button=document.createElement('button');button.id='fullscreen-toggle';button.type='button';button.className='fullscreen-toggle';
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg><span>进入全屏</span>';
 document.querySelector('.phone').appendChild(button);
 const message=document.createElement('div');message.className='fullscreen-message';message.setAttribute('role','status');message.hidden=true;document.querySelector('.phone').appendChild(message);let timer;
 function sync(){const active=!!document.fullscreenElement;button.querySelector('span').textContent=active?'退出全屏':'进入全屏';button.setAttribute('aria-pressed',String(active));button.title=active?'退出全屏（Esc）':'隐藏浏览器栏，进入全屏';}
 button.onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.fullscreenEnabled&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else throw Error('unsupported');}catch{message.textContent='此浏览器未开放全屏。页面已铺满窗口；电脑也可尝试 F11。';message.hidden=false;clearTimeout(timer);timer=setTimeout(()=>message.hidden=true,5000);}finally{sync();}};
 document.addEventListener('fullscreenchange',sync);sync();
})();
