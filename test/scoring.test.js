import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun as createLandedRun, step, advance} from '../src/physics.js';
import {proximityRate} from '../src/scoring.js';
test('surface proximity rewards close passes with a bounded nonlinear bonus', () => {
  const body = {x: 0, y: 0, r: 20};
  const rate = (gap) => proximityRate({x: 23.5 + gap, y: 0, r: 3.5}, [body]);
  assert.equal(rate(100), 0);
  assert.equal(rate(0), 20);
  assert.equal(rate(50), 5);
  assert.ok(rate(10) > rate(30));
  assert.equal(proximityRate({x: 93.5, y: 0, r: 3.5}, [{...body, r: 40}]), rate(50));
  assert.equal(proximityRate({x: 33.5, y: 0, r: 3.5}, [body, body]), rate(10));
});
test('total combines time and flying points and freezes on death', () => {
  const s = createRun(() => 0.3);
  step(s, {});
  assert.ok(s.flyingPoints > 0);
  assert.equal(s.score, s.time + s.flyingPoints);
  s.alive = false;
  const score = s.score;
  step(s, {}, 1);
  assert.equal(s.score, score);
  assert.equal(createRun().score, 0);
});
test('scoring is identical across frame rates', () => {
  const a = createRun(() => 0.3),
    b = createRun(() => 0.3);
  for (let i = 0; i < 60; i++) advance(a, {up: true}, 1 / 30);
  for (let i = 0; i < 288; i++) advance(b, {up: true}, 1 / 144);
  assert.ok(Math.abs(a.score - b.score) < 1e-8);
});

function createRun(random) {
  const s = createLandedRun(random);
  step(s, {up: true});
  return s;
}
