export const BASE_EXTENT = 1020;
export const DEFAULT_ZOOM = 2.2;
// The followed point is clamped against the USABLE viewport (the part not covered by the HUD),
// then shifted left by half the panel. Clamping the whole frustum first would discard the shift
// on any axis wide enough to lock, which is exactly the phone case.
function clampAxis(value, half, bound) {
  const range = bound - half;
  return range > 0 ? Math.max(-range, Math.min(range, value)) : 0;
}
export function frame({
  shipX = 0,
  shipY = 0,
  width,
  height,
  zoom = DEFAULT_ZOOM,
  hudPx = 0,
  bound = Infinity,
}) {
  const aspect = width / height;
  const halfH = BASE_EXTENT / Math.min(1, aspect) / zoom;
  const halfW = halfH * aspect;
  const offset = (hudPx * halfH) / height;
  return {
    halfW,
    halfH,
    cx: clampAxis(shipX, halfW - offset, bound) - offset,
    cy: clampAxis(shipY, halfH, bound),
  };
}
