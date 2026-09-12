import * as THREE from 'three';
import { LIMIT } from './physics.js';
export function createView(container) {
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));container.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#070c13');
  const camera=new THREE.OrthographicCamera();camera.position.z=1500;
  scene.add(new THREE.AmbientLight(0xa5c3db,1.6));
  const light=new THREE.PointLight(0xffdaa2,150000,0,2);light.position.z=90;scene.add(light);
  const stars=[];for(let i=0;i<1800;i++)stars.push((Math.random()-.5)*5000,(Math.random()-.5)*3000,-100-Math.random()*100);
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x779aaa,size:1.6,transparent:true,opacity:.65})));
  let system=new THREE.Group();scene.add(system);let meshes=[];
  function ring(radius,color,opacity){const points=[];for(let i=0;i<=200;i++){const a=i/200*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,-4));}return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));}
  const boundary=ring(LIMIT,0x6a9d9c,.22);scene.add(boundary);
  const shape=new THREE.Shape();shape.moveTo(10,0);shape.lineTo(-6,5);shape.lineTo(-3,0);shape.lineTo(-6,-5);shape.closePath();
  const ship=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshBasicMaterial({color:0xe2fff4}));ship.position.z=10;ship.scale.setScalar(1.6);scene.add(ship);
  const flameShape=new THREE.Shape();flameShape.moveTo(-4,2.6);flameShape.lineTo(-22,0);flameShape.lineTo(-4,-2.6);flameShape.closePath();
  const flame=new THREE.Mesh(new THREE.ShapeGeometry(flameShape),new THREE.MeshBasicMaterial({color:0x7fffd5,transparent:true,opacity:.8}));ship.add(flame);
  const marker=ring(17,0xb3eedc,.5);ship.add(marker);
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(220*3),3));trailGeo.setDrawRange(0,0);const trail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:0x88d7c4,transparent:true,opacity:.35}));trail.frustumCulled=false;scene.add(trail);let history=[];
  function reset(state){
    system.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose();});scene.remove(system);system=new THREE.Group();scene.add(system);meshes=[];history=[];trailGeo.setDrawRange(0,0);
    for(const b of state.bodies){
      if(b.orbit)system.add(ring(b.orbit,0x557684,.23));
      const mesh=new THREE.Mesh(new THREE.SphereGeometry(b.r,48,32),b.orbit?new THREE.MeshStandardMaterial({color:b.color,roughness:.9}):new THREE.MeshBasicMaterial({color:b.color}));
      system.add(mesh);meshes.push(mesh);
      if(!b.orbit){for(let i=1;i<=9;i++){const halo=new THREE.Mesh(new THREE.RingGeometry(b.r+i*3,b.r+i*3+5,96),new THREE.MeshBasicMaterial({color:0xffac49,transparent:true,opacity:.065*(1-i/11),depthWrite:false}));halo.position.z=-2;system.add(halo);}}
      else {const rim=ring(b.r+3,b.color,.25);mesh.add(rim);}
    }
  }
  function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h);const aspect=w/h;const extent=1020/Math.min(1,aspect);camera.left=-extent*aspect;camera.right=extent*aspect;camera.top=extent;camera.bottom=-extent;camera.updateProjectionMatrix();}
  addEventListener('resize',resize);resize();
  function draw(state,thrust,active){
    state.bodies.forEach((b,i)=>{meshes[i].position.set(b.x,b.y,0);});
    ship.position.set(state.ship.x,state.ship.y,10);ship.rotation.z=state.ship.angle;ship.visible=state.alive;
    flame.visible=thrust&&active;flame.scale.x=.8+Math.random()*.5;marker.visible=!active;
    if(active&&state.alive){history.push(new THREE.Vector3(state.ship.x,state.ship.y,5));if(history.length>220)history.shift();const positions=trailGeo.attributes.position;history.forEach((p,i)=>positions.setXYZ(i,p.x,p.y,p.z));positions.needsUpdate=true;trailGeo.setDrawRange(0,history.length);}
    renderer.render(scene,camera);
  }
  return {reset,draw};
}
