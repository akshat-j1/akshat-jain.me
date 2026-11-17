export type OrbitPoint = { x: number; y: number; z: number };
export type CameraObstacle = { x: number; z: number; radius: number; height: number };
type GroundAt = (x: number, z: number) => number;

export function clearEyeHeight(pivot: OrbitPoint, eye: OrbitPoint, groundAt: GroundAt) {
  let height = eye.y;
  for (let sample = 1; sample <= 7; sample++) {
    const t = sample / 7;
    const x = pivot.x + (eye.x - pivot.x) * t;
    const z = pivot.z + (eye.z - pivot.z) * t;
    const clearance = groundAt(x, z) + (sample === 7 ? 0.82 : 0.26);
    height = Math.max(height, pivot.y + (clearance - pivot.y) / t);
  }
  return height;
}

export function clearBoomFraction(pivot: OrbitPoint, eye: OrbitPoint, obstacles: readonly CameraObstacle[], groundAt: GroundAt) {
  const dx = eye.x - pivot.x;
  const dz = eye.z - pivot.z;
  const dy = eye.y - pivot.y;
  const length = Math.hypot(dx, dz);
  if (length < 1e-4) return 1;

  let clear = 1;
  for (const obstacle of obstacles) {
    const x = obstacle.x - pivot.x;
    const z = obstacle.z - pivot.z;
    const projection = (x * dx + z * dz) / length;
    const side = (x * dz - z * dx) / length;
    const radius = obstacle.radius + 0.20;
    if (Math.abs(side) >= radius) continue;
    const halfChord = Math.sqrt(radius * radius - side * side);
    const enter = Math.max(0, (projection - halfChord) / length);
    const leave = Math.min(clear, (projection + halfChord) / length);
    if (enter >= leave) continue;

    const top = groundAt(obstacle.x, obstacle.z) + obstacle.height + 0.22;
    const entersAbove = pivot.y + dy * enter > top;
    if (entersAbove && pivot.y + dy * leave > top) continue;
    const crossing = entersAbove && dy < 0 ? (top - pivot.y) / dy : enter;
    clear = Math.max(0, crossing - 0.14 / length);
  }
  return clear;
}
