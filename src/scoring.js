export const PROXIMITY_RANGE = 100;
export const MAX_FLYING_RATE = 20;

// Reward the closest surface, without stacking overlapping reward zones.
export function proximityRate(ship, bodies) {
  let closest = Infinity;
  for (const body of bodies)
    closest = Math.min(closest, Math.hypot(ship.x - body.x, ship.y - body.y) - body.r - ship.r);
  const proximity = Math.max(0, 1 - Math.max(0, closest) / PROXIMITY_RANGE);
  return MAX_FLYING_RATE * proximity * proximity;
}
