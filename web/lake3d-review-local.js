/* Local Three.js WebGL scene. Visual time never determines chain results. */
window.Lake3D = (() => {
  let active;
  function mount(host, waiting, waterName='月影湖') {
    if(!host) return;
    if(active){active.attach(host,waiting,waterName);return;}
    let renderer;
    try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'}); }
    catch(e){host.innerHTML='<div class="webgl-error">设备暂不支持 WebGL 3D，请开启浏览器硬件加速后重试。</div>';return;}
    let currentWater=Waters[waterName]?waterName:'月影湖', config=Waters[currentWater];
    const T=THREE,scene=new T.Scene(),camera=new T.PerspectiveCamera(62,1,.1,250);
    camera.position.set(0,2.3,7);camera.lookAt(0,1.25,-14);
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
    host.style.backgroundImage=`url('${config.image}')`;host.style.backgroundSize='cover';host.appendChild(renderer.domElement);renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();host.dataset.ready='context-lost';});renderer.domElement.addEventListener('webglcontextrestored',()=>{host.dataset.ready='true';});renderer.domElement.setAttribute('aria-label','实时 3D 湖面、鱼竿与浮漂');renderer.domElement.setAttribute('role','img');
    const sky=new T.Mesh(new T.SphereGeometry(180,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 v;void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 v;void main(){vec3 d=normalize(v);float h=max(d.y,0.);vec3 c=mix(vec3(.67,.69,.60),vec3(.19,.29,.31),pow(h,.45));vec3 light=normalize(vec3(12.,12.,-48.));float a=distance(d,light);c+=vec3(.72,.80,.56)*exp(-a*18.)*.3;c=mix(c,vec3(.95,.94,.73),1.-smoothstep(.024,.027,a));gl_FragColor=vec4(c,1.);}`}));scene.add(sky);
    scene.fog=new T.FogExp2(0x9aab99,.013);
    const ambient=new T.HemisphereLight(0xb8e1e1,0x183d3b,2.2);scene.add(ambient);const sun=new T.DirectionalLight(0xffdfab,2.1);sun.position.set(12,18,-30);scene.add(sun);
    const mapCache=new Map();
    function mapTexture(name){if(mapCache.has(name))return mapCache.get(name);const entry={ready:false,texture:null};mapCache.set(name,entry);entry.texture=new T.TextureLoader().load(Waters[name].image,()=>{entry.ready=true;if(currentWater===name){host.dataset.ready='true';renderer.domElement.style.opacity='1';}},undefined,()=>{if(currentWater===name)host.dataset.ready='fallback';});entry.texture.colorSpace=T.SRGBColorSpace;entry.texture.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());return entry;}
    let panorama=mapTexture(currentWater).texture;host.dataset.water=currentWater;
    // Closed cylindrical scenery: front panorama plus mirrored rear continuity.
    // No exposed side edges at the permitted camera yaw, including ultrawide screens.
    const geo=new T.PlaneGeometry(Math.PI*2,100,256,1),pos=geo.attributes.position,panUV=geo.attributes.uv;
    for(let i=0;i<pos.count;i++){const angle=pos.getX(i);pos.setXYZ(i,Math.sin(angle)*72,pos.getY(i),-Math.cos(angle)*72);panUV.setX(i,Math.acos(Math.cos(angle+Math.PI/2))/Math.PI);}
    geo.computeVertexNormals();const backdrop=new T.Mesh(geo,new T.MeshBasicMaterial({map:panorama,fog:false,side:T.DoubleSide}));backdrop.position.set(0,config.height,0);scene.add(backdrop);
    const uniforms={panoramaHeight:{value:config.height},waterColor:{value:new T.Vector3(...config.base)},mistColor:{value:new T.Vector3(...config.mist)},flow:{value:new T.Vector2(...config.flow)},waveScale:{value:config.wave},panorama:{value:panorama},time:{value:0},impact:{value:-100},center:{value:new T.Vector2(-.6,-7)}};
    const water=new T.Mesh(new T.PlaneGeometry(240,240,240,240),new T.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`uniform float waveScale;uniform float time;uniform float impact;uniform vec2 center;varying vec3 wp;varying vec3 normalW;
      float wave(vec2 p){float t=time;float w=sin(p.x*.67+t*.72)*.047+sin(p.y*.94-t*.65)*.035+sin(p.x*1.7+p.y*1.3+t*.9)*.019;float d=distance(p,center),age=t-impact;float ring=sin(d*11.-age*8.)*exp(-pow(d-age*2.2,2.)*1.8)*exp(-age*.55);return w*waveScale+(age>0.?ring*.18:0.);}
      void main(){vec3 p=position;vec2 q=vec2(p.x,-p.y);float h=wave(q);p.z=h;wp=vec3(q.x,h,q.y);float e=.04;normalW=normalize(vec3(wave(q-vec2(e,0.))-wave(q+vec2(e,0.)),2.*e,wave(q-vec2(0.,e))-wave(q+vec2(0.,e))));gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader:`uniform float panoramaHeight;uniform vec3 waterColor;uniform vec3 mistColor;uniform vec2 flow;uniform sampler2D panorama;uniform float time;uniform float impact;uniform vec2 center;varying vec3 wp;varying vec3 normalW;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
      float detail(vec2 p){return noise(p)*.55+noise(p*2.03+5.)*.27+noise(p*4.17)*.13;}
      void main(){vec2 p=wp.xz;float fade=1.-smoothstep(18.,95.,length(wp-cameraPosition));float r1=dot(p,vec2(.87,.49))*7.3+time*1.2;float r2=dot(p,vec2(-.32,.95))*12.7-time*.93;float r3=dot(p,vec2(.98,-.21))*22.+time*1.7;vec2 grad=vec2(.87,.49)*cos(r1)*.035+vec2(-.32,.95)*cos(r2)*.018+vec2(.98,-.21)*cos(r3)*.008*fade;vec3 n=normalize(normalW+vec3(grad.x,0.,grad.y));vec3 v=normalize(cameraPosition-wp),l=normalize(vec3(12.,12.,-48.)-wp);float fres=.025+.975*pow(1.-max(dot(n,v),0.),5.);vec3 refl=reflect(-v,n);float a=dot(refl.xz,refl.xz),b=dot(wp.xz,refl.xz),c=dot(wp.xz,wp.xz)-5184.;float dist=(-b+sqrt(max(0.,b*b-a*c)))/max(a,.001);vec3 hit=wp+refl*dist;vec2 uv=vec2(acos(cos(atan(hit.x,-hit.z)+1.570796327))/3.141592654,(hit.y-panoramaHeight)/100.+.5);vec3 reflection=texture2D(panorama,clamp(uv,vec2(.005),vec2(.995))).rgb;vec3 base=mix(waterColor,reflection*.91,clamp(.24+fres*.7,0.,.96));base+=vec3(.018,.028,.035)*sin(wp.x*.23+wp.z*.18)*.3;float spec=max(dot(n,normalize(l+v)),0.);float sparkle=pow(spec,180.)*.65+pow(spec,36.)*.11;base+=vec3(1.,.89,.72)*sparkle;float tiny=pow(max(dot(n,normalize(vec3(-.2,1.,.3)+v)),0.),145.);base+=vec3(.24,.49,.46)*tiny*.16;float d=distance(wp.xz,center),age=time-impact;float ring=exp(-pow(d-age*2.2,2.)*14.)*exp(-age*.8);if(age>0.)base+=vec3(.3,.6,.51)*ring*.45;float fog=1.-exp(-length(wp-cameraPosition)*.009);base=mix(base,mistColor,fog);gl_FragColor=vec4(base,.98-.32*(1.-smoothstep(.2,1.6,d)));}` }));water.rotation.x=-Math.PI/2;scene.add(water);
    const textures=[];
    function texture(kind){const c=document.createElement('canvas');const size=kind==='stone'?1024:256;c.width=c.height=size;const ctx=c.getContext('2d'),im=ctx.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){let i=(y*size+x)*4;let h=Math.sin(x*127.1+y*311.7)*43758.5453;let n=h-Math.floor(h);let v=kind==='carbon'?40+((Math.floor(x/5)+Math.floor(y/5))%2)*35+n*22:kind==='cork'?125+n*60+Math.sin(y*.9)*12:132+Math.sin(x*.022+Math.sin(y*.017)*2)*18+Math.sin(x*.071-y*.049)*10+Math.sin(x*.21+y*.17)*5+n*12;im.data[i]=v;im.data[i+1]=v;im.data[i+2]=v;im.data[i+3]=255;}ctx.putImageData(im,0,0);const tex=new T.CanvasTexture(c);tex.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='carbon'?3:2,kind==='carbon'?12:2);textures.push(tex);return tex;}
    function shoreTexture(file,color=true){const tex=new T.TextureLoader().load('assets/shore/'+file,()=>{host.dataset.shore='photo-materials-v2';},undefined,()=>{host.dataset.shore='texture-error';});tex.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());textures.push(tex);return tex;}
    const stone=shoreTexture('granite-v2.png'),stoneRelief=shoreTexture('granite-v2.png',false),leafTexture=shoreTexture('reed-v2.png'),carbon=texture('carbon'),cork=texture('cork');stone.repeat.set(2,1);stoneRelief.repeat.copy(stone.repeat);
    const rockMat=new T.MeshStandardMaterial({color:0xf2f0e8,map:stone,bumpMap:stoneRelief,bumpScale:.10,roughness:.82,vertexColors:true});
    const shore=new T.Group();scene.add(shore);
    const rockGeo=new T.SphereGeometry(1,48,32),rp=rockGeo.attributes.position,colors=[];
    for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),r=1+.13*Math.sin(x*4+z*3)*Math.cos(y*5)+.035*Math.sin(x*13-z*9);rp.setXYZ(i,x*r,y*r,z*r);const moss=Math.max(0,y)*(.5+.5*Math.sin(x*12+z*8));const c=new T.Color().setRGB(.83-moss*.17,.84-moss*.08,.82-moss*.23);colors.push(c.r,c.g,c.b);}rockGeo.setAttribute('color',new T.Float32BufferAttribute(colors,3));rockGeo.computeVertexNormals();
    rockMat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 shoreWorld;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nshoreWorld=(modelMatrix*vec4(transformed,1.)).xyz;');shader.fragmentShader='varying vec3 shoreWorld;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat wet=1.-smoothstep(-.025,.19,shoreWorld.y);diffuseColor.rgb*=mix(1.,.55,wet);');shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(roughnessFactor,.28,1.-smoothstep(-.025,.19,shoreWorld.y));');};
    for(let i=0;i<24;i++){const m=new T.Mesh(rockGeo,rockMat),size=.35+(i%5)*.14;m.position.set((i%2?1:-1)*(2.7+i*.105),-.09,4.8-i*.38);m.scale.set(size*1.5,size*.65,size);m.rotation.set(i*.31,.7*i,.1*Math.sin(i));shore.add(m);}
    for(let i=0;i<3;i++){const m=new T.Mesh(rockGeo,rockMat);m.position.set(i===0?-2.25:i===1?2.55:-3.05,.10,i===2?-1.2:.25);m.scale.set(i===2?.7:1.15,i===2?.42:.72,.82);m.rotation.y=i*1.7;shore.add(m);}
    const dummy=new T.Object3D();
    // Fine reeds and small leaves along the near shore.
    const reeds=new T.InstancedMesh(new T.CylinderGeometry(.007,.019,1,4),new T.MeshStandardMaterial({color:0x849375,roughness:.9}),70);
    for(let i=0;i<70;i++){let side=i%2?1:-1;dummy.position.set(side*(2.5+(i%7)*.19),.25,3.4-(i%11)*.36);dummy.scale.set(1,.65+(i%5)*.19,1);dummy.rotation.set(.13*Math.sin(i),0,side*.14);dummy.updateMatrix();reeds.setMatrixAt(i,dummy.matrix);}reeds.count=28;scene.add(reeds);
    // Tapered curved leaf geometry: vein shading and vertex wind, one instanced draw.
    const leafGeo=new T.PlaneGeometry(.13,1,8,20);leafGeo.translate(0,.5,0);const lp=leafGeo.attributes.position;
    for(let i=0;i<lp.count;i++){const y=lp.getY(i);lp.setX(i,lp.getX(i)*Math.sin(Math.PI*y)*.95);lp.setY(i,y-.18*y*y*y);lp.setZ(i,.52*y*y+Math.abs(lp.getX(i))*.42);}leafGeo.computeVertexNormals();
    const leafWind={value:0};const leafMat=new T.MeshStandardMaterial({color:0xffffff,map:leafTexture,side:T.DoubleSide,roughness:.58});
    leafMat.onBeforeCompile=shader=>{shader.uniforms.leafTime=leafWind;shader.vertexShader='uniform float leafTime;varying vec2 bladeUV;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbladeUV=uv;transformed.x+=sin(leafTime*1.25+instanceMatrix[3].x*2.+instanceMatrix[3].z)*position.y*position.y*.06;');shader.fragmentShader='varying vec2 bladeUV;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat vein=exp(-abs(bladeUV.x-.5)*70.);float ribs=pow(.5+.5*sin(bladeUV.y*95.+abs(bladeUV.x-.5)*30.),10.);diffuseColor.rgb*=.72+.28*bladeUV.y;diffuseColor.rgb+=vec3(.09,.12,.035)*vein+vec3(.018,.027,.008)*ribs;');};
    const leaves=new T.InstancedMesh(leafGeo,leafMat,280);
    for(let i=0;i<280;i++){const side=i%2?1:-1,clump=Math.floor(i/10),angle=(i%10)*2.399;dummy.position.set(side*(2.8+.8*(.5+.5*Math.sin(clump*7.31)))+Math.sin(angle)*.14,-.03,3.6-5.4*(.5+.5*Math.sin(clump*3.79+1.2)));dummy.scale.set(.65+(i%3)*.12,.55+(i%7)*.13,1);dummy.rotation.set(.08+(i%5)*.065,angle,side*(.10+(i%4)*.065));dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);}reeds.add(leaves);
    const pebbles=new T.InstancedMesh(rockGeo,rockMat,120);
    for(let i=0;i<120;i++){const side=i%2?1:-1;dummy.position.set(side*(2.25+(i%13)*.12),-.035,4.8-Math.floor(i/13)*.58);const size=.035+(i%7)*.012;dummy.scale.set(size*1.5,size*.5,size);dummy.rotation.set(i*.7,i*.9,i*.3);dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix);}shore.add(pebbles);
    const dryMat=new T.MeshStandardMaterial({color:0xa59a6e,map:leafTexture,side:T.DoubleSide,roughness:.88});const grasses=new T.InstancedMesh(leafGeo,dryMat,180);
    for(let i=0;i<180;i++){const side=i%2?1:-1;dummy.position.set(side*(2.65+(i%9)*.19),.01,4.4-Math.floor(i/18)*.52);dummy.scale.set(.14,.22+(i%6)*.05,.35);dummy.rotation.set(.2,i*2.4,side*.25);dummy.updateMatrix();grasses.setMatrixAt(i,dummy.matrix);}shore.add(grasses);
    function applyWater(name){if(!Waters[name])name='月影湖';currentWater=name;config=Waters[name];const entry=mapTexture(name);panorama=entry.texture;backdrop.position.y=config.height;uniforms.panoramaHeight.value=config.height;backdrop.material.map=panorama;uniforms.panorama.value=panorama;uniforms.waterColor.value.set(...config.base);uniforms.mistColor.value.set(...config.mist);uniforms.flow.value.set(...config.flow);uniforms.waveScale.value=config.wave;rockMat.color.setHex(name==='星潮海'?0xeee9df:0xf2f0e8);scene.fog.color.setRGB(...config.mist);ambient.groundColor.setHex(name==='星潮海'?0x454452:0x183d3b);sun.color.setHex(config.sun);reeds.visible=name!=='星潮海';reeds.material.color.setHex(config.reeds);leafMat.color.setHex(0xf3f0d4);shore.scale.set(1,name==='星潮海'?.85:name==='青岚河'?.7:1,1);host.style.backgroundImage=`url('${config.image}')`;host.style.backgroundSize='cover';host.dataset.water=name;host.dataset.ready=entry.ready?'true':'loading';renderer.domElement.style.opacity=entry.ready?'1':'0';}
    applyWater(currentWater);
    const rod=new T.Group();rod.rotation.order='YXZ';rod.position.set(.58,.50,4.6);scene.add(rod);
    const shaftMat=new T.MeshStandardMaterial({color:0x647985,map:carbon,bumpMap:carbon,bumpScale:.009,metalness:.72,roughness:.26}),gold=new T.MeshStandardMaterial({color:0xd7bb7c,metalness:.75,roughness:.25});
    const shaft=new T.Mesh(new T.CylinderGeometry(.009,.043,3.7,40,24),shaftMat);shaft.position.y=2.1;rod.add(shaft);
    const grip=new T.Mesh(new T.CylinderGeometry(.060,.068,.65,32,8),new T.MeshStandardMaterial({color:0xe5c49a,map:cork,bumpMap:cork,bumpScale:.027,roughness:.85}));grip.position.y=.38;rod.add(grip);
    for(let i=0;i<7;i++){const ring=new T.Mesh(new T.TorusGeometry(.065-i*.006,.009,6,12),gold);ring.position.set(0,.8+i*.49,-.047);rod.add(ring);}
    const reel=new T.Mesh(new T.CylinderGeometry(.16,.16,.16,24),gold);reel.rotation.z=Math.PI/2;reel.position.set(.12,.65,.12);rod.add(reel);
    for(let i=0;i<5;i++){const collar=new T.Mesh(new T.CylinderGeometry(.052-i*.006,.053-i*.006,.055,20),gold);collar.position.y=.76+i*.67;rod.add(collar);}
    const spool=new T.Mesh(new T.CylinderGeometry(.125,.125,.19,32),new T.MeshStandardMaterial({color:0xc8d4c3,metalness:.42,roughness:.4}));spool.rotation.z=Math.PI/2;spool.position.set(.14,.65,.12);rod.add(spool);
    const arm=new T.Mesh(new T.CylinderGeometry(.016,.016,.23,8),gold);arm.rotation.z=.8;arm.position.set(.25,.53,.12);rod.add(arm);
    const knob=new T.Mesh(new T.SphereGeometry(.052,12,8),shaftMat);knob.scale.set(1,1,1.6);knob.position.set(.34,.46,.12);rod.add(knob);
    // Machined reel rims, wound line and grip binding catch grazing light.
    const chrome=new T.MeshStandardMaterial({color:0xc5d1db,metalness:.92,roughness:.19});
    for(let i=0;i<13;i++){const winding=new T.Mesh(new T.TorusGeometry(.127,.0025,6,48),chrome);winding.rotation.y=Math.PI/2;winding.position.set(.055+i*.014,.65,.12);rod.add(winding);}
    for(const x of [.045,.24]){const rim=new T.Mesh(new T.TorusGeometry(.15,.012,10,48),shaftMat);rim.rotation.y=Math.PI/2;rim.position.set(x,.65,.12);rod.add(rim);}
    for(let i=0;i<18;i++){const binding=new T.Mesh(new T.TorusGeometry(.064,.002,6,32),shaftMat);binding.rotation.x=Math.PI/2;binding.position.y=.09+i*.032;rod.add(binding);}
    const bailCurve=new T.CatmullRomCurve3([new T.Vector3(.05,.49,.12),new T.Vector3(.32,.51,.26),new T.Vector3(.34,.79,.26),new T.Vector3(.05,.81,.12)]);rod.add(new T.Mesh(new T.TubeGeometry(bailCurve,40,.006,8,false),chrome));
    const tip=new T.Object3D();tip.position.set(0,3.97,0);rod.add(tip);rod.rotation.set(-.83,0,.12);
    const float=new T.Group();
    const lacquer=new T.MeshPhysicalMaterial({color:0xd89139,roughness:.21,clearcoat:1,clearcoatRoughness:.12});
    const profile=[[-.28,.012],[-.20,.045],[-.09,.070],[.03,.074],[.14,.052],[.22,.018]].map(([y,r])=>new T.Vector2(r,y));
    const body=new T.Mesh(new T.LatheGeometry(profile,40),lacquer);float.add(body);
    const stem=new T.Mesh(new T.CylinderGeometry(.009,.013,.74,20),new T.MeshPhysicalMaterial({color:0xf2eac6,roughness:.3,clearcoat:.6}));stem.position.y=.35;float.add(stem);
    for(let i=0;i<7;i++){const band=new T.Mesh(new T.CylinderGeometry(.0105,.0105,.045,20),new T.MeshStandardMaterial({color:i%2?0xe34927:0x222a27,roughness:.3}));band.position.y=.24+i*.064;float.add(band);}
    const keel=new T.Mesh(new T.CylinderGeometry(.008,.011,.24,16),new T.MeshStandardMaterial({color:0x333a3d,metalness:.55,roughness:.28}));keel.position.y=-.36;float.add(keel);
    const eyelet=new T.Mesh(new T.TorusGeometry(.023,.004,10,28),gold);eyelet.position.y=-.49;float.add(eyelet);
    const hookMetal=new T.MeshStandardMaterial({color:0xc4cbd2,metalness:.92,roughness:.19});
    const hookCurve=new T.CatmullRomCurve3([new T.Vector3(0,.12,0),new T.Vector3(0,-.01,0),new T.Vector3(.01,-.07,0),new T.Vector3(.045,-.09,0),new T.Vector3(.08,-.065,0),new T.Vector3(.085,-.01,0)]);
    const hook=new T.Group();hook.add(new T.Mesh(new T.TubeGeometry(hookCurve,40,.005,10,false),hookMetal));const point=new T.Mesh(new T.ConeGeometry(.007,.034,12),hookMetal);point.position.set(.085,.004,0);hook.add(point);const barb=new T.Mesh(new T.ConeGeometry(.004,.02,8),hookMetal);barb.position.set(.075,-.018,0);barb.rotation.z=-.55;hook.add(barb);hook.position.y=-.73;float.add(hook);
    const baitMat=new T.MeshPhysicalMaterial({color:0xc88c70,roughness:.58,clearcoat:.18});
    const baitPath=new T.CatmullRomCurve3([new T.Vector3(.01,-.04,.01),new T.Vector3(.045,-.025,.008),new T.Vector3(.07,-.055,.012),new T.Vector3(.055,-.09,.015)]);hook.add(new T.Mesh(new T.TubeGeometry(baitPath,24,.012,12,false),baitMat));
    const leader=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,-.49,0),new T.Vector3(0,-.61,0)]),new T.LineBasicMaterial({color:0xbacbd0,transparent:true,opacity:.45}));float.add(leader);scene.add(float);
    const lineGeo=new T.BufferGeometry();lineGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(41*3),3));const line=new T.Line(lineGeo,new T.LineBasicMaterial({color:0xd0e6d7,transparent:true,opacity:.73}));scene.add(line);
    const dropCanvas=document.createElement('canvas');dropCanvas.width=dropCanvas.height=32;const dropCtx=dropCanvas.getContext('2d'),dropGradient=dropCtx.createRadialGradient(13,11,1,16,16,15);dropGradient.addColorStop(0,'rgba(255,255,255,1)');dropGradient.addColorStop(.3,'rgba(235,250,255,.85)');dropGradient.addColorStop(1,'rgba(225,245,255,0)');dropCtx.fillStyle=dropGradient;dropCtx.fillRect(0,0,32,32);const sprayMap=new T.CanvasTexture(dropCanvas);textures.push(sprayMap);
    const splashGeo=new T.BufferGeometry(),drops=new Float32Array(36*3);splashGeo.setAttribute('position',new T.BufferAttribute(drops,3));const spray=new T.Points(splashGeo,new T.PointsMaterial({color:0xd8f3df,size:.045,map:sprayMap,transparent:true,depthWrite:false,opacity:0}));scene.add(spray);
    let frame,dead=false,t=0,last=performance.now(),castAt=-100,phase=waiting?'waiting':'idle',biteAt=-100;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let feedbackState=null;
    const caughtFish=FishMotion(T);caughtFish.visible=false;scene.add(caughtFish);
    const fishMaterial=caughtFish.userData.material;
    const hookEnd=new T.Vector3();let hooked=false;
    window.LakeAudio?.mount(host);
    function impactAt(position,kind){uniforms.center.value.set(position.x,position.z);uniforms.impact.value=t;window.LakeAudio?.event(kind);}
    function finishFeedback(cancelled=false){if(!feedbackState)return;const done=feedbackState.resolve;feedbackState=null;caughtFish.visible=false;done({cancelled});}
    function feedback(stage,options={}){finishFeedback(true);host.dataset.feedback=stage;
      if(stage==='reset'||stage==='waiting'){phase=stage==='waiting'?'waiting':'idle';host.dataset.phase=phase;return Promise.resolve({cancelled:false});}
      if(!['bite','catch','escape'].includes(stage))return Promise.resolve({cancelled:true});
      phase='waiting';host.dataset.phase=stage;const duration=reduced.matches?.35:stage==='bite'?1.8:stage==='catch'?45:4.2;
      caughtFish.userData.species?.(options.name);fishMaterial.color.set(options.name?.includes('黄金')?0xf6d16d:0xffffff);caughtFish.scale.setScalar(T.MathUtils.clamp(Number(options.size)||1,.65,1.65));
      window.LakeAudio?.event(stage);window.LakeAudio?.notify(stage);
      return new Promise(resolve=>{feedbackState={stage,start:t,duration,resolve,events:new Set()};});
    }
    let target=new T.Vector3(-.6,.12,-7),tipWorld=new T.Vector3();
    float.position.copy(waiting?target:new T.Vector3(.25,.65,1.5));
    const resize=new ResizeObserver(()=>{if(!host.isConnected)return;const w=host.clientWidth,h=host.clientHeight;const desktop=matchMedia("(min-width:1000px)").matches;renderer.setPixelRatio(Math.min(desktop?Math.max(1.25,devicePixelRatio):devicePixelRatio,2,Math.sqrt(8000000/Math.max(1,w*h))));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(host);
    let yaw=0,pitch=0,wantYaw=0,wantPitch=0,drag=null,inspect=false;
    const canvas=renderer.domElement;canvas.style.touchAction='none';canvas.style.cursor='grab';canvas.tabIndex=0;
    const raycaster=new T.Raycaster(),mouse=new T.Vector2(),surface=new T.Plane(new T.Vector3(0,1,0),0),picked=new T.Vector3();let sway=0,swayVelocity=0;
    const aimRing=new T.Mesh(new T.RingGeometry(.34,.40,64),new T.MeshBasicMaterial({color:0xf5ddb1,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false,depthTest:false}));aimRing.rotation.x=-Math.PI/2;aimRing.position.copy(target);aimRing.position.y=.18;aimRing.renderOrder=5;scene.add(aimRing);
    function rayAt(e){const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);}
    function aimAt(e){if(phase!=='idle'||feedbackState)return;rayAt(e);if(!raycaster.ray.intersectPlane(surface,picked)||picked.z>1||picked.distanceTo(camera.position)>45)return;target.set(T.MathUtils.clamp(picked.x,-12,12),.12,T.MathUtils.clamp(picked.z,-18,-3));aimRing.position.set(target.x,.18,target.z);host.dataset.landing=target.x.toFixed(1)+','+target.z.toFixed(1);host.dispatchEvent(new CustomEvent('landingchange',{detail:{x:target.x,z:target.z}}));}
    canvas.addEventListener('pointerdown',e=>{if(phase==='casting'||feedbackState)return;rayAt(e);const onRod=raycaster.intersectObject(rod,true).length>0;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,onRod,moved:false};host.dataset.pointerMode=onRod?'rod':'lake';if(onRod)swayVelocity+=.8;canvas.setPointerCapture(e.pointerId);canvas.style.cursor=onRod?'grabbing':'grab';});
    canvas.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved ||= Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5;if(drag.onRod){swayVelocity=T.MathUtils.clamp(swayVelocity+dx*.015,-3,3);aimAt(e);}else{wantYaw=T.MathUtils.clamp(wantYaw-dx*.003,-.78,.78);wantPitch=T.MathUtils.clamp(wantPitch+dy*.0018,-.12,.17);}drag.x=e.clientX;drag.y=e.clientY;});
    canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&!drag.onRod)aimAt(e);drag=null;canvas.style.cursor='grab';});
    for(const ev of ['pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>{drag=null;canvas.style.cursor='grab';});
    canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();wantYaw=e.key==='Home'?0:T.MathUtils.clamp(wantYaw+(e.key==='ArrowLeft'?-.15:.15),-.78,.78);wantPitch=0;}});
    function animate(now){if(dead)return;frame=requestAnimationFrame(animate);let dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden||!host.isConnected)return;t+=dt;leafWind.value=reduced.matches?0:t;uniforms.time.value=t;uniforms.waveScale.value=config.wave*(reduced.matches?.25:1);
      const damp=1-Math.exp(-dt*7);yaw+=(wantYaw-yaw)*damp;pitch+=(wantPitch-pitch)*damp;camera.position.y+=(2.3-camera.position.y)*.08;camera.lookAt(Math.sin(yaw)*21,1.25+pitch*21,7-Math.cos(yaw)*21);
      swayVelocity+=(-sway*28-swayVelocity*6)*dt;sway+=swayVelocity*dt;aimRing.visible=phase==='idle';aimRing.material.opacity=.55+Math.sin(t*2)*.15;rod.rotation.y+=(-Math.atan2(target.x-rod.position.x,rod.position.z-target.z)-rod.rotation.y)*Math.min(1,dt*5);if(phase!=='casting'&&!feedbackState)rod.rotation.z=.12+sway;const age=t-castAt;
      if(phase==='casting'){
        if(age<.55){let p=age/.55;rod.rotation.x=-.83+p*p*1.65;camera.position.y=2.3-p*.09;float.position.set(.25,1+p*1.8,1.5+p*1.5);}
        else {let p=Math.min(1,(age-.55)/1.3);rod.rotation.x=.82-(1-Math.pow(1-Math.min(1,p*4),3))*1.82+Math.sin(p*24)*Math.exp(-p*5)*.07;camera.position.y=2.3+(reduced.matches?0:Math.sin(p*11)*Math.exp(-p*5)*.12);rod.rotation.z=.12+Math.sin(p*Math.PI)*.13;float.position.set(T.MathUtils.lerp(.25,target.x,p),T.MathUtils.lerp(2.8,target.y,p)+Math.sin(p*Math.PI)*(reduced.matches?.6:3.4),T.MathUtils.lerp(3,target.z,p));if(p===1){phase='waiting';impactAt(target,'splash');host.dataset.phase='waiting';}}
      } else {rod.rotation.x+=( -.83+Math.sin(t*1.2)*.008-rod.rotation.x)*.06;if(phase==='waiting'){float.position.copy(target);float.position.y=.11+Math.sin(t*2)*.04;float.rotation.z=Math.sin(t*1.7)*.09;}else{float.position.set(.25,.65+Math.sin(t)*.06,1.5);}}
      let slack=.28;hooked=false;
      if(feedbackState){const f=feedbackState,p=Math.min(1,(t-f.start)/f.duration),motion=reduced.matches?.25:1;
        const emit=(key,threshold)=>{if(p>=threshold&&!f.events.has(key)){f.events.add(key);impactAt(caughtFish.position,key);}};
        caughtFish.userData.swim(t,(f.stage==='escape'?1.5:1)*motion);
        if(f.stage==='bite'){
          const tug=Math.sin(p*Math.PI)**2;
          // A submerged fish pulls downward; the float tilts towards its mouth.
          caughtFish.visible=true;caughtFish.position.set(target.x-.25+Math.sin(p*5)*.18,-.12-tug*.12,target.z+.18);
          caughtFish.rotation.set(0,-.3, -.10);float.position.y=.12-tug*.28+Math.sin(p*16)*.035;
          float.rotation.z=-tug*.38;rod.rotation.x-=tug*.08;slack=.10;emit('bite',.35);
        }
        if(f.stage==='catch'){
          const smooth=x=>{x=T.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
          const tow=smooth((p-.16)/.66),lift=smooth((p-.70)/.25);
          const struggle=Math.sin(Math.PI*Math.min(1,p/.77))*(1-lift)*motion;
          const lateral=Math.sin(p*25)*.42*struggle;
          caughtFish.visible=true;
          caughtFish.position.set(T.MathUtils.lerp(target.x,.35,tow)+lateral,
            -.14+Math.sin(p*36)*.09*struggle+lift*1.18,
            T.MathUtils.lerp(target.z,2.2,tow));
          // +X is the mouth. Roll about the fish's longitudinal axis, then raise the head.
          const heading=-Math.atan2(2.2-target.z,.35-target.x);
          caughtFish.rotation.order='YXZ';
          caughtFish.rotation.set(Math.sin(p*29)*.85*struggle,heading+lift*.65+Math.sin(p*25)*.22*struggle,
            lift*.95+Math.sin(p*20)*.08*struggle);
          caughtFish.userData.swim(t,(.5+1.15*struggle)*(1-lift*.65)*motion);
          caughtFish.updateMatrixWorld(true);hookEnd.copy(caughtFish.userData.mouth).applyMatrix4(caughtFish.matrixWorld);hooked=true;
          float.position.copy(hookEnd);float.position.y+=.55;slack=.025;
          rod.rotation.x=-.83+tow*.38+lift*.18+Math.sin(p*25)*.025*struggle;spool.rotation.x=t*10;
          emit('splash',.12);emit('tail',.32);emit('splash-near',.52);emit('lift',.74);
        }
        if(f.stage==='escape'){
          const release=.36,q=Math.max(0,(p-release)/(1-release));
          caughtFish.visible=q<.70;caughtFish.position.set(target.x+q*q*4,-.07-q*q*1.8,target.z-q*4);
          caughtFish.rotation.set(0,.8+q*.6,-q*.12);
          if(p<release){caughtFish.updateMatrixWorld(true);hookEnd.copy(caughtFish.userData.mouth).applyMatrix4(caughtFish.matrixWorld);hooked=true;slack=.035;float.position.y=.12-Math.sin(p/release*Math.PI)*.3;}
          else {slack=.28+Math.sin(q*Math.PI)*.65;float.position.y=.12+Math.sin(q*19)*Math.exp(-q*5)*.19;}
          float.rotation.z=Math.sin(p*22)*Math.exp(-q*5)*.28;rod.rotation.x=-.83+Math.sin(q*16)*Math.exp(-q*6)*.12;
          emit('escape',release);
        }
        if(p===1){const final=f.stage;finishFeedback();phase=final==='bite'?'waiting':'idle';host.dataset.phase=phase;host.dataset.feedback=final+'-complete';}
      }
      tip.getWorldPosition(tipWorld);const lineEnd=hooked?hookEnd:float.position;const a=lineGeo.attributes.position;for(let i=0;i<=40;i++){let p=i/40;a.setXYZ(i,T.MathUtils.lerp(tipWorld.x,lineEnd.x,p),T.MathUtils.lerp(tipWorld.y,lineEnd.y+(hooked?0:.2),p)-Math.sin(p*Math.PI)*(phase==='casting'?.65:slack),T.MathUtils.lerp(tipWorld.z,lineEnd.z,p));}a.needsUpdate=true;
      let s=t-uniforms.impact.value;spray.material.opacity=Math.max(0,1-s/1.2);if(s<1.2){for(let i=0;i<36;i++){let theta=i*2.4,v=.6+(i%5)*.15;drops[i*3]=uniforms.center.value.x+Math.cos(theta)*s*v;drops[i*3+1]=Math.max(0,.1+s*(1.5+(i%4)*.2)-2.8*s*s);drops[i*3+2]=uniforms.center.value.y+Math.sin(theta)*s*v;}splashGeo.attributes.position.needsUpdate=true;}
      if(inspect){camera.position.set(-.7,1.25,3.0);camera.lookAt(-2.3,.45,.15);}else{camera.position.x=0;camera.position.z=7;}
      camera.fov=(inspect?48:62)+(!reduced.matches&&phase==='casting'?Math.sin(Math.min(age/1.85,1)*Math.PI)*3:0);camera.updateProjectionMatrix();if(host.dataset.renderPaused!=='true')renderer.render(scene,camera);
    }frame=requestAnimationFrame(animate);host.dataset.phase=phase;
    active={attach(next,isWaiting,name){const changed=currentWater!==name;resize.disconnect();host=next;applyWater(name);if(changed){finishFeedback(true);phase=isWaiting?'waiting':'idle';wantYaw=wantPitch=0;uniforms.impact.value=-100;}else if(!feedbackState&&phase!=='casting'){phase=isWaiting?'waiting':'idle';}host.appendChild(renderer.domElement);window.LakeAudio?.mount(host);resize.observe(host);host.dataset.phase=feedbackState?.stage||phase;host.dataset.feedback=feedbackState?.stage||phase;},inspectShore(){inspect=true;},recenter(){inspect=false;wantYaw=wantPitch=0;},cast(){inspect=false;finishFeedback(true);drag=null;castAt=t;phase='casting';host.dataset.phase=phase;host.dataset.feedback='casting';},feedback,bite(){return feedback('bite');},dispose(){finishFeedback(true);dead=true;cancelAnimationFrame(frame);resize.disconnect();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of [o.material].flat())m.dispose();}});mapCache.forEach(entry=>entry.texture.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();}};
  }
  return {mount,inspectShore:()=>active?.inspectShore(),recenter:()=>active?.recenter(),cast:()=>active?.cast(),bite:()=>active?.bite(),feedback:(stage,options)=>active?.feedback(stage,options)||Promise.resolve({cancelled:true})};
})();
