import test from 'node:test';
import assert from 'node:assert/strict';
import {stickVector, steerToward, aimInput, wrapAngle, MIN_DEFLECTION} from '../src/touch.js';
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} !== ${b}`);

test('steering turns the shorter way across the PI wrap', () => {
  // physics.js applies (left - right) * TURN * dt, so left increases the angle.
  assert.deepEqual(steerToward(0, 1), {left: true, right: false});
  assert.deepEqual(steerToward(0, -1), {left: false, right: true});
  // The trap: a naive target-minus-current would turn left the long way round here.
  assert.deepEqual(steerToward(-3, 3), {left: false, right: true});
  assert.deepEqual(steerToward(3, -3), {left: true, right: false});
});

test('steering inside the deadzone holds still', () => {
  assert.deepEqual(steerToward(1, 1), {left: false, right: false});
  assert.deepEqual(steerToward(1, 1.01), {left: false, right: false});
  assert.deepEqual(steerToward(1, 1.5), {left: true, right: false});
});

test('wrapAngle folds any angle into plus or minus PI', () => {
  near(wrapAngle(0), 0);
  near(wrapAngle(Math.PI * 2), 0);
  near(wrapAngle(Math.PI * 3), Math.PI);
  assert.ok(wrapAngle(6) < 0, '6 radians is a small negative angle once wrapped');
});

test('the stick reads screen coordinates as a world direction', () => {
  const origin = {x: 100, y: 100};
  near(stickVector(origin, {x: 150, y: 100}, 50).angle, 0);
  // Screen Y grows downward and world Y grows up, so dragging down aims down.
  near(stickVector(origin, {x: 100, y: 150}, 50).angle, -Math.PI / 2);
  near(stickVector(origin, {x: 100, y: 50}, 50).angle, Math.PI / 2);
});

test('deflection is normalised to the radius and clamped at one', () => {
  const origin = {x: 0, y: 0};
  near(stickVector(origin, {x: 25, y: 0}, 50).deflection, 0.5);
  near(stickVector(origin, {x: 500, y: 0}, 50).deflection, 1);
  assert.equal(stickVector(origin, {x: 0, y: 0}, 50).deflection, 0);
});

test('a centred or absent stick produces no steering', () => {
  assert.deepEqual(aimInput(null, 0), {left: false, right: false});
  const small = {angle: Math.PI / 2, deflection: MIN_DEFLECTION - 0.01};
  assert.deepEqual(aimInput(small, 0), {left: false, right: false});
  const pushed = {angle: Math.PI / 2, deflection: MIN_DEFLECTION + 0.01};
  assert.deepEqual(aimInput(pushed, 0), {left: true, right: false});
});
