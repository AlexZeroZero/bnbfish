/* Separate invertebrate silhouettes; no fish-tail deformation for rigid shells. */
window.AquaticRig=(T,name)=>{
 const crab=/蟹/.test(name),shrimp=/虾/.test(name),snail=/螺/.test(name),shell=/蚌|蚬|蛏|扇贝|蚶|贻贝|珠母贝|鲍/.test(name),cephalopod=/蛸|乌贼/.test(name),cucumber=/刺参/.test(name);if(!crab&&!shrimp&&!snail&&!shell&&!cephalopod&&!cucumber)return null;
 const group=new T.Group(),joints=[];const mat=new T.MeshPhysicalMaterial({color:crab?(/帝王/.test(name)?0x9d4a32:0x687044):shrimp?0xb37955:0x92815b,roughness:.35,metalness:.12,clearcoat:.6});
 const pearl=new T.MeshPhysicalMaterial({color:0xe1d8c3,roughness:.3,metalness:.1,clearcoat:.6});
 function ellipsoid(x,y,z,sx,sy,sz,m=mat){const mesh=new T.Mesh(new T.SphereGeometry(1,32,20),m);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);group.add(mesh);return mesh}
 function limb(points,r=.015){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),mesh=new T.Mesh(new T.TubeGeometry(curve,18,r,7,false),mat);group.add(mesh);return mesh}
 if(cephalopod){ellipsoid(-.12,.01,0,/乌贼/.test(name)?.35:.24,.15,.18);for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;joints.push({mesh:limb([[.06,0,0],[.26,-.04,Math.sin(a)*.14],[.5,-.08,Math.sin(a)*.28],[.65,Math.cos(a)*.08,Math.sin(a)*.22]],.022),side:i%2?1:-1,i})}for(const z of [-.12,.12])ellipsoid(.06,.04,z,.025,.025,.025,pearl);
 }else if(cucumber){ellipsoid(0,0,0,.48,.10,.13);for(let i=0;i<18;i++)ellipsoid((i%6)*.14-.35,.09,Math.floor(i/6)*.08-.08,.02,.04,.02);
 }else if(crab){ellipsoid(0,0,0,.3,.10,.24);for(const side of [-1,1]){for(let i=0;i<4;i++){const x=.15-i*.12;const leg=limb([[x,0,side*.13],[x-.08,-.05,side*(.35+i*.025)],[x-.18,-.14,side*(.56+i*.025)]]);joints.push({mesh:leg,side,i})}for(const offset of [-.06,.06])limb([[.22,0,side*.15],[.39,.02,side*.29],[.54,.04,side*(.2+offset)]]);ellipsoid(.3,.045,side*.07,.015,.022,.015,pearl)}
 }else if(shrimp){for(let i=0;i<7;i++)ellipsoid(.35-i*.11,-Math.max(0,i-3)*.025,0,.09,.085-i*.006,.1-i*.008);for(const side of [-1,1]){limb([[.39,.045,side*.04],[.7,.11,side*.17],[1,.09,side*.25]],.003);for(let i=0;i<5;i++)joints.push({mesh:limb([[.26-i*.1,-.04,side*.04],[.2-i*.1,-.19,side*.14]],.005),side,i});ellipsoid(-.43,-.09,side*.065,.13,.018,.10)}
 }else if(snail){for(let i=0;i<6;i++)ellipsoid(-.15+i*.07,i*.075,0,.25-i*.034,.12-i*.012,.21-i*.028);ellipsoid(.05,-.06,0,.28,.05,.18,pearl);
 }else{const narrow=/蛏/.test(name),fan=/扇贝/.test(name);for(const side of [-1,1]){const valve=ellipsoid(0,side*.035,0,narrow?.52:.34,.07,fan?.30:narrow?.08:.20,side>0?mat:pearl);valve.rotation.z=side*.06}for(let i=0;i<12;i++){const theta=i/12*Math.PI*2;limb([[0,.09,0],[Math.cos(theta)*.23,.08,Math.sin(theta)*.16]],.002)}}
 group.userData.swim=(time,effort)=>{for(const j of joints)j.mesh.rotation.x=Math.sin(time*(crab?4:8)+j.i)*.08*j.side*effort};return group;
};
