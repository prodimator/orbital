import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRun as createLandedRun,
  gravity,
  step,
  advance,
  sweptHit,
  THRUST,
} from '../src/physics.js';

test('planets noticeably bend coasting flight far above their surfaces', () => {
  for (const value of [0, 0.5, 0.999]) {
    const planet = createLandedRun(() => value).bodies[1];
    const distance = planet.r + 150;
    const g = gravity({x: planet.x + distance, y: planet.y}, [planet]);
    assert.ok(-g.x >= 8, 'Pull remains noticeable 150 units above even a small planet');
    assert.ok(-g.x > (planet.mu / distance ** 2) * 2, 'Distant pull exceeds the old field');
    assert.equal(g.y, 0);
    const farther = gravity({x: planet.x + distance + 150, y: planet.y}, [planet]);
    assert.ok(-farther.x > 0 && -farther.x < -g.x, 'Attraction fades with distance');
  }
});

test('thrust exceeds planetary attraction at every altitude, including overlapping fields', () => {
  const planets = createLandedRun(() => 0.999).bodies.slice(1);
  for (const p of planets) {
    p.x = 0;
    p.y = 0;
  }
  for (const altitude of [0, 3.5, 10, 50, 150, 300, 900]) {
    for (const bodies of [planets, ...planets.map((p) => [p])]) {
      const g = gravity({x: planets[0].r + altitude, y: 0}, bodies);
      assert.ok(Math.hypot(g.x, g.y) <= THRUST * 0.7 + 1e-10);
      assert.ok(g.x < 0);
    }
  }
});

test('sun retains its exact inverse-square force when planetary fields overlap', () => {
  const s = createLandedRun(() => 0.999);
  const sun = s.bodies[0];
  const planets = s.bodies.slice(1);
  for (const ship of [
    {x: 150, y: 80},
    {x: -400, y: 200},
  ]) {
    const d2 = ship.x ** 2 + ship.y ** 2;
    const starOnly = gravity(ship, [sun]);
    assert.equal(starOnly.x, -ship.x * (sun.mu / (d2 * Math.sqrt(d2))));
    const planetOnly = gravity(ship, planets);
    const combined = gravity(ship, s.bodies);
    assert.ok(Math.abs(combined.x - planetOnly.x - starOnly.x) < 1e-10);
    assert.ok(Math.abs(combined.y - planetOnly.y - starOnly.y) < 1e-10);
  }
});

test('outward thrust escapes a planet from rest just above its surface', () => {
  for (const value of [0, 0.5, 0.999]) {
    const s = createLandedRun(() => value);
    const planet = s.bodies[1];
    // Isolate planetary escape from solar gravity and prescribed orbital motion.
    planet.phase = 0;
    planet.omega = 0;
    planet.x = planet.orbit;
    planet.y = 0;
    s.bodies = [planet];
    s.phase = 'flying';
    s.ship = {x: planet.x + planet.r + 3.6, y: 0, vx: 0, vy: 0, angle: 0, r: 3.5};
    for (let i = 0; i < 480; i++) step(s, {up: true});
    assert.ok(s.alive, 'Full outward thrust clears the surface without a launch boost');
    assert.ok(s.ship.x - planet.x - planet.r > 200);
    assert.ok(s.ship.vx > 100);
  }
});
test('larger randomized stars pull harder at the same distance', () => {
  const system = (value) => {
    let calls = 0;
    return createRun(() => {
      calls++;
      return calls === 9 ? value : calls === 8 ? 0.99 : 0.5;
    });
  };
  const small = system(0),
    large = system(0.999999);
  const a = small.bodies[0],
    b = large.bodies[0];
  assert.ok(a.r < b.r);
  assert.ok(a.mu < b.mu);
  assert.ok(Math.abs(gravity({x: 500, y: 0}, [b]).x) > Math.abs(gravity({x: 500, y: 0}, [a]).x));
  for (const s of [small, large]) {
    for (const p of s.bodies.slice(1)) assert.ok(p.orbit - p.r > s.bodies[0].r + 30);
    for (let i = 0; i < 240; i++) step(s, {up: true});
    assert.ok(s.alive, 'Extreme star sizes permit an outward launch');
  }
});
test('gravity attracts and falls with distance squared', () => {
  const b = [{x: 0, y: 0, mu: 100}];
  assert.equal(gravity({x: 10, y: 0}, b).x, -1);
  assert.equal(gravity({x: 20, y: 0}, b).x, -0.25);
});
test('coasting conserves velocity; thrust and steering respond', () => {
  let s = createRun(() => 0.5);
  s.bodies = [];
  s.ship = {x: 0, y: 0, vx: 3, vy: 0, angle: 0, r: 3};
  step(s, {}, 0.1);
  assert.equal(s.ship.vx, 3);
  step(s, {up: true, left: true}, 0.1);
  assert.ok(s.ship.vy > 0);
  assert.ok(s.ship.angle > 0);
});
test('random launches clear every body', () => {
  for (let i = 0; i < 100; i++) {
    let s = createRun();
    assert.ok(s.bodies.length >= 3 && s.bodies.length <= 5);
    for (const b of s.bodies)
      assert.ok(Math.hypot(s.ship.x - b.x, s.ship.y - b.y) > b.r + s.ship.r);
  }
});
test('swept collision detects crossing without endpoint overlap', () => {
  assert.equal(sweptHit({x: -20, y: 0}, {x: 20, y: 0}, 5), true);
  assert.equal(sweptHit({x: -20, y: 6}, {x: 20, y: 6}, 5), false);
});
test('collision ends scoring and outer boundary ends run', () => {
  let s = createRun();
  s.ship.x = 0;
  s.ship.y = 0;
  step(s, {}, 1 / 120);
  assert.equal(s.alive, false);
  let t = s.time;
  step(s, {}, 1);
  assert.equal(s.time, t);
  s = createRun();
  s.ship.x = 901;
  step(s, {}, 1 / 120);
  assert.equal(s.alive, false);
});
test('fixed timestep matches at 30 and 144 fps', () => {
  let a = createRun(() => 0.3),
    b = createRun(() => 0.3);
  for (let i = 0; i < 60; i++) advance(a, {up: true}, 1 / 30);
  for (let i = 0; i < 288; i++) advance(b, {up: true}, 1 / 144);
  assert.ok(Math.abs(a.ship.x - b.ship.x) < 1e-8);
  assert.ok(Math.abs(a.time - b.time) < 1e-8);
});
test('gravity demands input after launch while thrust remains effective', () => {
  let poweredSurvivors = 0;
  for (let seed = 1; seed <= 100; seed++) {
    let n = seed;
    const random = () => (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296;
    const idle = createRun(random),
      powered = structuredClone(idle);
    while (idle.alive && idle.time < 12) step(idle, {});
    assert.equal(idle.alive, false, `Seed ${seed} can coast for 12 seconds without input`);
    while (powered.alive && powered.time < 3) step(powered, {up: true});
    if (powered.alive) poweredSurvivors++;
  }
  assert.ok(
    poweredSurvivors >= 95,
    'At least 95% of sampled launches remain survivable with immediate thrust',
  );
});

function createRun(random) {
  const s = createLandedRun(random);
  step(s, {up: true});
  return s;
}
