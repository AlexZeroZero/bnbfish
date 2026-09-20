/* Local material construction. No network, wallet or game-state dependencies. */
window.SurfaceCraft = function(T, renderer) {
  const textures=[];
  function finish(c,color=false,rx=1,ry=1){const t=new T.CanvasTexture(c);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());textures.push(t);return t;}
  function fabric(kind){
    const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),im=ctx.createImageData(512,512);
    let seed=739;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){
      const i=(y*512+x)*4,carbon=kind==='carbon',tile=((x>>4)+(y>>4))%2;
      const grain=carbon?Math.pow(Math.sin((tile?x:y)*Math.PI/4),2):Math.sin(x*.18+Math.sin(y*.12)*2);
      const pit=carbon?0:Math.pow(rand(),45)*90;
      const v=carbon?24+grain*15+Math.sin((tile?y:x)%16/16*Math.PI)*16:181+grain*7+rand()*18-pit;
      im.data[i]=v;im.data[i+1]=v*(carbon?1.06:.79);im.data[i+2]=v*(carbon?1.13:.52);im.data[i+3]=255;
    }ctx.putImageData(im,0,0);return finish(c,true,kind==='carbon'?2:1,kind==='carbon'?10:2);
  }
  // A sky/shore light probe supplies broad real reflections to polished fittings.
  const studio=new T.Scene();const skyGeo=new T.SphereGeometry(20,40,24);
  const skyMat=new T.ShaderMaterial({side:T.BackSide,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 p;void main(){vec3 d=normalize(p);vec3 c=mix(vec3(.15,.19,.16),vec3(.69,.79,.85),smoothstep(-.12,.15,d.y));c=mix(c,vec3(.35,.52,.70),smoothstep(.2,1.,d.y));c+=vec3(1.,.84,.60)*pow(max(dot(d,normalize(vec3(-1.,2.,1.))),0.),90.)*2.;gl_FragColor=vec4(c,1.);}'});
  studio.add(new T.Mesh(skyGeo,skyMat));const cube=new T.WebGLCubeRenderTarget(128,{type:T.HalfFloatType});new T.CubeCamera(.1,50,cube).update(renderer,studio);
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromCubemap(cube.texture);cube.dispose();pmrem.dispose();skyGeo.dispose();skyMat.dispose();
  return {carbon:fabric('carbon'),cork:fabric('cork'),environment:environment.texture,dispose(){textures.forEach(t=>t.dispose());environment.dispose();}};
};
