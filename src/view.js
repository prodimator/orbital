import * as THREE from 'three';
import {LIMIT} from './physics.js';
import {frame} from './camera.js';
export function createView(container) {
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070c13');
  const camera = new THREE.OrthographicCamera();
  camera.position.z = 1500;
  scene.add(new THREE.AmbientLight(0xa5c3db, 1.6));
  const light = new THREE.PointLight(0xffdaa2, 150000, 0, 2);
  light.position.z = 90;
  scene.add(light);
  const stars = [];
  for (let i = 0; i < 1800; i++)
    stars.push(
      (Math.random() - 0.5) * 5000,
      (Math.random() - 0.5) * 3000,
      -100 - Math.random() * 100,
    );
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(
    new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({color: 0x779aaa, size: 1.6, transparent: true, opacity: 0.65}),
    ),
  );
  let system = new THREE.Group();
  scene.add(system);
  let meshes = [];
  function ring(radius, color, opacity) {
    const points = [];
    for (let i = 0; i <= 200; i++) {
      const a = (i / 200) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, -4));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({color, transparent: true, opacity}),
    );
  }
  const boundary = ring(LIMIT, 0x6a9d9c, 0.22);
  scene.add(boundary);
  const shape = new THREE.Shape();
  shape.moveTo(10, 0);
  shape.lineTo(-6, 5);
  shape.lineTo(-3, 0);
  shape.lineTo(-6, -5);
  shape.closePath();
  const ship = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({color: 0xe2fff4}),
  );
  ship.position.z = 10;
  ship.scale.setScalar(1.6);
  scene.add(ship);
  const flameShape = new THREE.Shape();
  flameShape.moveTo(-4, 2.6);
  flameShape.lineTo(-22, 0);
  flameShape.lineTo(-4, -2.6);
  flameShape.closePath();
  const flame = new THREE.Mesh(
    new THREE.ShapeGeometry(flameShape),
    new THREE.MeshBasicMaterial({color: 0x7fffd5, transparent: true, opacity: 0.8}),
  );
  ship.add(flame);
  const marker = ring(17, 0xb3eedc, 0.5);
  ship.add(marker);
  const trailGeo = new THREE.BufferGeometry();
  trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(220 * 3), 3));
  trailGeo.setDrawRange(0, 0);
  const trail = new THREE.Line(
    trailGeo,
    new THREE.LineBasicMaterial({color: 0x88d7c4, transparent: true, opacity: 0.35}),
  );
  trail.frustumCulled = false;
  scene.add(trail);
  let history = [];
  const rockGeometry = new THREE.IcosahedronGeometry(1, 0);
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9aa83,
    roughness: 1,
    flatShading: true,
    emissive: 0x38251b,
    emissiveIntensity: 0.7,
  });
  const bulletGeometry = new THREE.PlaneGeometry(12, 2.5);
  const bulletMaterial = new THREE.MeshBasicMaterial({color: 0x91ddff});
  const bulletMeshes = new Map();
  const rockMeshes = new Map();
  function reset(state) {
    for (const mesh of bulletMeshes.values()) scene.remove(mesh);
    bulletMeshes.clear();
    for (const mesh of rockMeshes.values()) scene.remove(mesh);
    rockMeshes.clear();
    system.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) o.material.dispose();
    });
    scene.remove(system);
    system = new THREE.Group();
    scene.add(system);
    meshes = [];
    history = [];
    trailGeo.setDrawRange(0, 0);
    focusX = state.ship.x;
    focusY = state.ship.y;
    snap = true;
    apply(0);
    for (const b of state.bodies) {
      if (b.orbit) system.add(ring(b.orbit, 0x557684, 0.23));
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(b.r, 48, 32),
        b.orbit
          ? new THREE.MeshStandardMaterial({color: b.color, roughness: 0.9})
          : new THREE.MeshBasicMaterial({color: b.color}),
      );
      system.add(mesh);
      meshes.push(mesh);
      if (!b.orbit) {
        for (let i = 1; i <= 9; i++) {
          const halo = new THREE.Mesh(
            new THREE.RingGeometry(b.r + i * 3, b.r + i * 3 + 5, 96),
            new THREE.MeshBasicMaterial({
              color: 0xffac49,
              transparent: true,
              opacity: 0.065 * (1 - i / 11),
              depthWrite: false,
            }),
          );
          halo.position.z = -2;
          system.add(halo);
        }
      } else {
        const rim = ring(b.r + 3, b.color, 0.25);
        mesh.add(rim);
      }
    }
  }
  let zoom = 1,
    hudPx = 0,
    focusX = 0,
    focusY = 0,
    snap = true;
  function apply(elapsed) {
    const f = frame({
      shipX: focusX,
      shipY: focusY,
      width: innerWidth,
      height: innerHeight,
      zoom,
      hudPx,
      bound: LIMIT + 60,
    });
    camera.left = -f.halfW;
    camera.right = f.halfW;
    camera.top = f.halfH;
    camera.bottom = -f.halfH;
    const k = snap ? 1 : 1 - Math.exp(-elapsed / 0.12);
    snap = false;
    camera.position.x += (f.cx - camera.position.x) * k;
    camera.position.y += (f.cy - camera.position.y) * k;
    camera.updateProjectionMatrix();
  }
  function resize() {
    renderer.setSize(innerWidth, innerHeight);
    snap = true;
    apply(0);
  }
  function setFraming(next) {
    if (next.zoom !== undefined) zoom = next.zoom;
    if (next.hudPx !== undefined) hudPx = next.hudPx;
    snap = true;
    apply(0);
  }
  addEventListener('resize', resize);
  resize();
  function draw(state, thrust, active, elapsed = 0) {
    focusX = state.ship.x;
    focusY = state.ship.y;
    apply(Math.min(elapsed, 0.1));
    state.bodies.forEach((b, i) => {
      meshes[i].position.set(b.x, b.y, 0);
    });
    ship.position.set(state.ship.x, state.ship.y, 10);
    ship.rotation.z = state.ship.angle;
    ship.visible = state.alive;
    flame.visible = thrust && active;
    flame.scale.x = 0.8 + Math.random() * 0.5;
    marker.visible = !active;
    if (active && state.alive) {
      history.push(new THREE.Vector3(state.ship.x, state.ship.y, 5));
      if (history.length > 220) history.shift();
      const positions = trailGeo.attributes.position;
      history.forEach((p, i) => positions.setXYZ(i, p.x, p.y, p.z));
      positions.needsUpdate = true;
      trailGeo.setDrawRange(0, history.length);
    }
    const ids = new Set(state.asteroids.map((a) => a.id));
    for (const [id, mesh] of rockMeshes) {
      if (!ids.has(id)) {
        scene.remove(mesh);
        rockMeshes.delete(id);
      }
    }
    for (const a of state.asteroids) {
      let mesh = rockMeshes.get(a.id);
      if (!mesh) {
        mesh = new THREE.Mesh(rockGeometry, rockMaterial);
        rockMeshes.set(a.id, mesh);
        scene.add(mesh);
      }
      mesh.position.set(a.x, a.y, 4);
      mesh.scale.setScalar(a.r);
      mesh.rotation.set(a.age * 0.7, a.age * 0.4, a.age * 0.9);
    }
    const bulletIds = new Set(state.projectiles.map((p) => p.id));
    for (const [id, mesh] of bulletMeshes) {
      if (!bulletIds.has(id)) {
        scene.remove(mesh);
        bulletMeshes.delete(id);
      }
    }
    for (const p of state.projectiles) {
      let mesh = bulletMeshes.get(p.id);
      if (!mesh) {
        mesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bulletMeshes.set(p.id, mesh);
        scene.add(mesh);
      }
      mesh.position.set(p.x, p.y, 12);
      mesh.rotation.z = Math.atan2(p.vy, p.vx);
    }
    renderer.render(scene, camera);
  }
  return {reset, draw, setFraming};
}
