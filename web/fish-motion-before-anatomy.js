/* Analytic swimming rig: head +X, caudal travelling wave towards -X. */
window.FishMotion = function(T) {
  const root=new T.Group(), parts=[];
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,512);gradient.addColorStop(0,'#52675a');gradient.addColorStop(.25,'#a5ad92');gradient.addColorStop(.55,'#d9d4b6');gradient.addColorStop(.8,'#e4e1cf');gradient.addColorStop(1,'#647467');ctx.fillStyle=gradient;ctx.fillRect(0,0,1024,512);
  for(let row=0;row<24;row++)for(let col=0;col<46;col++){let x=col*24+(row%2)*12,y=row*23;ctx.beginPath();ctx.ellipse(x,y,13,11,0,-1.2,1.2);ctx.strokeStyle='rgba(40,56,43,.30)';ctx.lineWidth=1.2;ctx.stroke();ctx.beginPath();ctx.ellipse(x-1,y-1,11,9,0,-1.1,.9);ctx.strokeStyle='rgba(255,255,240,.42)';ctx.lineWidth=.8;ctx.stroke();}
  ctx.strokeStyle='rgba(73,84,58,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(70,249);ctx.bezierCurveTo(350,260,650,256,990,245);ctx.stroke();
  const scales=new T.CanvasTexture(canvas);scales.colorSpace=T.SRGBColorSpace;scales.anisotropy=8;
  const material=new T.MeshPhysicalMaterial({color:0xffffff,map:scales,bumpMap:scales,bumpScale:.004,roughness:.25,metalness:.18,clearcoat:.7,clearcoatRoughness:.22});
  const g=new T.BufferGeometry(),vertices=[],uv=[],indices=[];const rings=96,sides=48;
  for(let i=0;i<=rings;i++){const u=i/rings,x=-.60+u*1.2;const fullness=Math.pow(Math.sin(Math.PI*u),.72);const taper=.42+.58*Math.min(1,u*2.6); 
    for(let j=0;j<=sides;j++){const v=j/sides,angle=v*Math.PI*2;vertices.push(x,Math.cos(angle)*.25*fullness*taper,Math.sin(angle)*.145*fullness*taper);uv.push(u,v);if(i<rings&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+1,k+sides+1,k+1,k+sides+2,k+sides+1);}}
  }
  g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const a=g.attributes.position;
  const body=new T.Mesh(g,material);root.add(body);parts.push({g,base:a.array.slice()});
  const finMat=new T.MeshStandardMaterial({color:0xa5a17c,side:T.DoubleSide,transparent:true,opacity:.78,roughness:.48});
  function fin(points) {const shape=new T.Shape();points.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();const geom=new T.ShapeGeometry(shape,24),mesh=new T.Mesh(geom,finMat),finGroup=new T.Group();finGroup.add(mesh);root.add(finGroup);parts.push({g:geom,base:geom.attributes.position.array.slice()});
    for(let j=1;j<points.length;j++){const ray=new T.BufferGeometry().setFromPoints([new T.Vector3(...points[0],0),new T.Vector3(...points[j],0)]);finGroup.add(new T.Line(ray,new T.LineBasicMaterial({color:0xc2d1cd,transparent:true,opacity:.40})));parts.push({g:ray,base:ray.attributes.position.array.slice()});}for(let j=1;j<20;j++){const u=j/20*(points.length-2),k=Math.floor(u)+1,f=u-Math.floor(u),p=points[k],q=points[Math.min(k+1,points.length-1)];const gg=new T.BufferGeometry().setFromPoints([new T.Vector3(points[0][0],points[0][1],.001),new T.Vector3(p[0]+(q[0]-p[0])*f,p[1]+(q[1]-p[1])*f,.001)]);finGroup.add(new T.Line(gg,new T.LineBasicMaterial({color:0xe0d6b2,transparent:true,opacity:.23})));parts.push({g:gg,base:gg.attributes.position.array.slice()});}return finGroup; }
  fin([[-.48,0],[-.86,.26],[-.79,.12],[-.70,0],[-.79,-.12],[-.86,-.24],[-.48,0]]);
  fin([[-.30,.12],[-.26,.28],[-.10,.34],[.08,.25],[.22,.17]]);
  fin([[-.30,-.12],[-.38,-.26],[-.11,-.21],[.04,-.16]]);
  for(const side of [-1,1]) {
    const eye=new T.Mesh(new T.SphereGeometry(.022,28,20),new T.MeshStandardMaterial({color:0xd8be7a,roughness:.24}));eye.position.set(.43,.055,side*.077);root.add(eye);
    const glint=new T.Mesh(new T.SphereGeometry(.003,10,8),new T.MeshBasicMaterial({color:0xffffff}));glint.position.set(.445,.068,side*.097);root.add(glint);
    const pupil=new T.Mesh(new T.SphereGeometry(.012,24,16),new T.MeshStandardMaterial({color:0x08141b,roughness:.12}));pupil.position.set(.438,.057,side*.089);root.add(pupil);
    const curve=new T.EllipseCurve(.29,0,.035,.145,-1.2,1.2,false,0);const gg=new T.BufferGeometry().setFromPoints(curve.getPoints(24).map(p=>new T.Vector3(p.x,p.y,side*.105)));root.add(new T.Line(gg,new T.LineBasicMaterial({color:0x46656c})));
    const f=fin([[.22,-.04],[.03,-.24],[-.13,-.18],[.12,-.02]]);f.position.z=side*.08;f.rotation.x=side*.65;
  }
  const mouth=new T.Mesh(new T.TorusGeometry(.018,.004,10,28),new T.MeshStandardMaterial({color:0x899b99}));mouth.rotation.y=Math.PI/2;mouth.position.x=.594;root.add(mouth);
  // Raised operculum rims and translucent lip tissue add depth at close range.
  const gillMat=new T.MeshPhysicalMaterial({color:0xb5bca0,roughness:.32,metalness:.22,clearcoat:.6});
  for(const side of [-1,1]){const points=[];for(let i=0;i<=28;i++){const a=-1.25+i/28*2.5;points.push(new T.Vector3(.27+.048*Math.cos(a),.15*Math.sin(a),side*(.1+.01*Math.cos(a))));}root.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),28,.0035,8,false),gillMat));}
  const lip=new T.Mesh(new T.TorusGeometry(.020,.003,12,40),new T.MeshPhysicalMaterial({color:0xc7b3a0,roughness:.42,clearcoat:.65}));lip.rotation.y=Math.PI/2;lip.position.x=.597;root.add(lip);
  root.userData.mouth=new T.Vector3(.62,0,0);
  root.userData.material=material;
  const fishParts=[...root.children];let aquatic=null;
  root.userData.species=name=>{if(aquatic){root.remove(aquatic);const materials=new Set();aquatic.traverse(o=>{o.geometry?.dispose();if(o.material)materials.add(o.material)});materials.forEach(m=>m.dispose());aquatic=null;}aquatic=window.AquaticRig?.(T,name);fishParts.forEach(p=>p.visible=!aquatic);if(aquatic){root.add(aquatic);root.userData.mouth.set(.4,0,0);return;}root.userData.mouth.set(.62,0,0);const long=/鳅|鳗|鳡|刀鱼/.test(name||''),broad=/鲫|鲤|鳊|鲂/.test(name||'');root.userData.profile={long,broad,smooth:/鲶|鳗|鳅|江团|鲟/.test(name||'')};material.bumpScale=root.userData.profile.smooth?.0007:.004;finMat.color.set(/黄金/.test(name||'')?0xb18b42:/鲶|江团/.test(name||'')?0x596e70:0xa5a17c);material.color.set(/黄金/.test(name||'')?0xf6d16d:0xffffff);};
  root.userData.swim=(time,effort=1)=>{if(aquatic){aquatic.userData.swim(time,effort);return;}for(const p of parts){const attr=p.g.attributes.position;for(let i=0;i<attr.count;i++){const x=p.base[i*3],u=Math.max(0,(.35-x)/1.2),bend=Math.sin(time*15-u*5.5)*u*u*.15*effort;const profile=root.userData.profile||{};attr.setXYZ(i,x,p.base[i*3+1]*(profile.long?.66:profile.broad?1.12:1),p.base[i*3+2]*(profile.long?.78:1)+bend);}attr.needsUpdate=true;if(p.g===g)p.g.computeVertexNormals();}};
  return root;
};
