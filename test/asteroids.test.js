import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, step, gravity, sweptHit} from '../src/physics.js';
import {spawnAsteroid, updateAsteroids} from '../src/asteroids.js';
test('asteroids enter outside perimeter with varied inward velocities', () => {
  const s = createRun(() => 0.4),
    a = spawnAsteroid(s),
    b = spawnAsteroid(s);
  assert.ok(Math.hypot(a.x, a.y) > 900);
  assert.ok(a.x * a.vx + a.y * a.vy < 0);
  assert.notEqual(a.vx, b.vx);
  assert.notEqual(a.x, b.x);
});
test('asteroids accelerate under celestial gravity and strike the ship across frames', () => {
  const s = createRun(() => 0.4);
  s.phase = 'flying';
  s.asteroids = [{id: 1, x: 400, y: 0, vx: 0, vy: 10, r: 5, age: 0}];
  s.nextAsteroid = 100;
  const previous = s.bodies.map((b) => ({...b}));
  updateAsteroids(s, 0.01, {...s.ship}, previous, gravity, sweptHit);
  assert.ok(s.asteroids[0].vx < 0);
  s.bodies = [];
  s.ship = {x: 0, y: 0, r: 3};
  s.asteroids = [{id: 2, x: -20, y: 0, vx: 400, vy: 0, r: 5, age: 0}];
  updateAsteroids(s, 0.1, {...s.ship}, [], gravity, sweptHit);
  assert.equal(s.alive, false);
  assert.match(s.reason, /asteroid/i);
});
test('spawn schedule pauses while landed and resets for a new run', () => {
  const s = createRun(() => 0.4);
  for (let i = 0; i < 1200; i++) step(s, {});
  assert.equal(s.asteroids.length, 0);
  step(s, {up: true});
  s.bodies = [];
  s.ship.vx = 0;
  s.ship.vy = 0;
  for (let i = 0; i < 850; i++) step(s, {});
  assert.ok(s.asteroids.length > 0);
  assert.equal(createRun().asteroids.length, 0);
});
