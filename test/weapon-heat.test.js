import test from 'node:test';
import assert from 'node:assert/strict';
import {createRun, sweptHit} from '../src/physics.js';
import {updateProjectiles} from '../src/projectiles.js';
function setup() {
  const s = createRun();
  s.phase = 'flying';
  s.bodies = [];
  return s;
}
function tick(s, shoot) {
  updateProjectiles(s, {shoot}, 1 / 120, [], sweptHit);
}
test('continuous firing overheats around three seconds and locks until fully cooled', () => {
  const s = setup();
  let elapsed = 0;
  while (!s.overheated && elapsed < 4) {
    tick(s, true);
    elapsed += 1 / 120;
  }
  assert.ok(elapsed >= 2.7 && elapsed <= 3.3);
  assert.equal(s.weaponHeat, 100);
  const shots = s.projectileId;
  for (let i = 0; i < 360; i++) tick(s, true);
  assert.equal(s.projectileId, shots);
  assert.ok(s.overheated);
  assert.ok(s.weaponHeat < 100);
  for (let i = 0; i < 130; i++) tick(s, false);
  assert.equal(s.overheated, false);
  assert.equal(s.weaponHeat, 0);
  tick(s, true);
  assert.equal(s.projectileId, shots + 1);
});
test('shots add heat, pauses cool, and new runs reset weapon state', () => {
  const s = setup();
  tick(s, true);
  assert.ok(s.weaponHeat > 0);
  const heat = s.weaponHeat;
  for (let i = 0; i < 30; i++) tick(s, false);
  assert.ok(s.weaponHeat < heat);
  const fresh = createRun();
  assert.equal(fresh.weaponHeat, 0);
  assert.equal(fresh.overheated, false);
});
