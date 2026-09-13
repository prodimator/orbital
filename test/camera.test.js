import test from 'node:test';
import assert from 'node:assert/strict';
import {frame, BASE_EXTENT} from '../src/camera.js';
const near = (a, b, tolerance = 1e-6) => assert.ok(Math.abs(a - b) < tolerance, `${a} !== ${b}`);
const BOUND = 960;

test('explicit overview zoom frames landscape and portrait windows', () => {
  const wide = frame({
    shipX: 0,
    shipY: 0,
    width: 1600,
    height: 900,
    zoom: 1,
    hudPx: 0,
    bound: BOUND,
  });
  near(wide.halfH, BASE_EXTENT);
  near(wide.halfW, (BASE_EXTENT * 1600) / 900);
  near(wide.cx, 0);
  near(wide.cy, 0);
  // A window taller than it is wide widens the view, as the current view.js does.
  const tall = frame({
    shipX: 0,
    shipY: 0,
    width: 600,
    height: 900,
    zoom: 1,
    hudPx: 0,
    bound: BOUND,
  });
  near(tall.halfH, BASE_EXTENT / (600 / 900));
  near(tall.halfW, BASE_EXTENT);
});

test('default desktop camera zooms in and tracks ship movement on both axes', () => {
  const options = {width: 1600, height: 900, bound: BOUND};
  const start = frame({...options, shipX: 0, shipY: 0});
  const moved = frame({...options, shipX: 100, shipY: -200});
  near(start.halfH, BASE_EXTENT / 2.2);
  near(moved.cx - start.cx, 100);
  near(moved.cy - start.cy, -200);
});

test('zoom shrinks both half extents proportionally', () => {
  const f = frame({shipX: 0, shipY: 0, width: 844, height: 390, zoom: 2.2, hudPx: 0, bound: BOUND});
  near(f.halfH, BASE_EXTENT / 2.2);
  near(f.halfW, (BASE_EXTENT / 2.2) * (844 / 390));
});

test('camera follows the ship while the view fits inside the bound', () => {
  const f = frame({
    shipX: 100,
    shipY: -200,
    width: 400,
    height: 400,
    zoom: 2.2,
    hudPx: 0,
    bound: BOUND,
  });
  near(f.cx, 100);
  near(f.cy, -200);
});

test('camera clamps so the view never shows past the bound', () => {
  const half = BASE_EXTENT / 2.2;
  const f = frame({
    shipX: 5000,
    shipY: -5000,
    width: 400,
    height: 400,
    zoom: 2.2,
    hudPx: 0,
    bound: BOUND,
  });
  near(f.cx, BOUND - half);
  near(f.cy, -(BOUND - half));
  near(f.cx + f.halfW, BOUND);
});

test('an axis wider than the bound locks to zero instead of panning', () => {
  // 844x390 at 2.2 gives halfW > 960, so horizontal follow must not engage.
  const a = frame({
    shipX: -900,
    shipY: 0,
    width: 844,
    height: 390,
    zoom: 2.2,
    hudPx: 0,
    bound: BOUND,
  });
  const b = frame({
    shipX: 900,
    shipY: 0,
    width: 844,
    height: 390,
    zoom: 2.2,
    hudPx: 0,
    bound: BOUND,
  });
  assert.ok(a.halfW > BOUND);
  near(a.cx, 0);
  near(b.cx, 0);
});

test('a panel shifts a centred frame right by half the panel width without resizing it', () => {
  const bare = frame({
    shipX: 0,
    shipY: 0,
    width: 844,
    height: 390,
    zoom: 2.2,
    hudPx: 0,
    bound: BOUND,
  });
  const panel = frame({
    shipX: 0,
    shipY: 0,
    width: 844,
    height: 390,
    zoom: 2.2,
    hudPx: 116,
    bound: BOUND,
  });
  near(panel.halfW, bare.halfW);
  const unitsPerPx = (2 * panel.halfH) / 390;
  near(panel.cx, -(116 / 2) * unitsPerPx);
  assert.ok(panel.cx < 0, 'the world shifts right, away from the panel');
});

test('with a panel, the ship at the perimeter lands the frustum edge on the bound', () => {
  const f = frame({
    shipX: 900,
    shipY: 0,
    width: 844,
    height: 390,
    zoom: 2.2,
    hudPx: 116,
    bound: BOUND,
  });
  near(f.cx + f.halfW, BOUND);
});
