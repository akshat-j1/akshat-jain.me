export const relay = { x: 1.7, z: -10, radius: 2.05, reach: 4.65 };
export const spawn = { x: 0, z: 2.5 };
export const boulders = [
  { x: -3.15, z: 2.0, radius: 1.33 },
  { x: 3.95, z: -3.1, radius: 1.02 },
  { x: -4.6, z: -10.5, radius: 1.11 },
  { x: 6.3, z: -17.2, radius: 1.42 },
  { x: -8.3, z: 3.0, radius: 1.22 },
] as const;

type Crater = { x: number; z: number; radius: number; depth: number; breach?: number };

export const craters: readonly Crater[] = [
  { x: -5.85, z: -7.95, radius: 4.6, depth: 1.38, breach: 0.65 },
  { x: 6.1, z: -5.8, radius: 3.5, depth: 0.83, breach: -1.15 },
  { x: 3.7, z: 3.4, radius: 1.45, depth: 0.23 },
  { x: -15.6, z: -16.5, radius: 6.4, depth: 1.33 },
  { x: 9.9, z: -16.1, radius: 6.1, depth: 1.2, breach: 2.25 },
  { x: -21, z: 3, radius: 10, depth: 1.9 },
  { x: 12, z: -29, radius: 9, depth: 2.28 },
  { x: -12, z: 13, radius: 8, depth: 1.9 },
  { x: -2.9, z: -3.7, radius: 0.63, depth: 0.14 },
  { x: -5.05, z: 3.42, radius: 0.97, depth: 0.21 },
  { x: 3.35, z: -12.95, radius: 0.92, depth: 0.15 },
];

type ElevationGrid = { width: number; height: number; values: Uint8Array | Uint16Array; mask?: Uint8Array };
let trailGrid: ElevationGrid | undefined;
let elevationGrid: ElevationGrid | undefined;
let regionalGrid: ElevationGrid | undefined;
let basinGrid: ElevationGrid | undefined;

/** Installs the NASA LOLA patch used by terrain rendering and walking contact. */
export function installElevationGrid(grid: ElevationGrid) {
  elevationGrid = grid;
}

export function installRegionalGrid(grid: ElevationGrid) {
  regionalGrid = grid;
}

export function installBasinGrid(grid: ElevationGrid) {
  basinGrid = grid;
}

export function installTrailGrid(grid: ElevationGrid) {
  trailGrid = grid;
}

export function clearElevationGrid() {
  trailGrid = undefined;
  elevationGrid = undefined;
  regionalGrid = undefined;
  basinGrid = undefined;
}

function sampleGrid(grid: ElevationGrid, a: number, b: number, values = grid.values) {
  const { width, height } = grid;
  const u = Math.max(0, Math.min(1, a)) * (width - 1);
  const v = Math.max(0, Math.min(1, b)) * (height - 1);
  const x0 = Math.floor(u);
  const y0 = Math.floor(v);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const dx = u - x0;
  const dy = v - y0;
  const top = values[y0 * width + x0] * (1 - dx) + values[y0 * width + x1] * dx;
  const bottom = values[y1 * width + x0] * (1 - dx) + values[y1 * width + x1] * dx;
  return top * (1 - dy) + bottom * dy;
}

export function basinRockExposure(x: number, z: number) {
  if (!basinGrid?.mask) return 0.48;
  return sampleGrid(basinGrid, 0.5 + x / 600, 0.5 + z / 600, basinGrid.mask) / 255;
}

export function smoothRange(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

function geologyHash(x: number, z: number) {
  let n = Math.imul(x, 1597334677) ^ Math.imul(z, 3812015801);
  n = Math.imul(n ^ (n >>> 16), 2246822519);
  return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
}

export function geologyNoise(x: number, z: number) {
  const i = Math.floor(x);
  const j = Math.floor(z);
  const a = smoothRange(0, 1, x - i);
  const b = smoothRange(0, 1, z - j);
  return (geologyHash(i, j) * (1 - a) + geologyHash(i + 1, j) * a) * (1 - b)
    + (geologyHash(i, j + 1) * (1 - a) + geologyHash(i + 1, j + 1) * a) * b;
}

function elevationHeight(x: number, z: number, distance: number) {
  const local = elevationGrid
    ? (sampleGrid(elevationGrid, (x + 185) / 370, (z + 316) / 360) - 128) * (7000 / 127) * 0.00052
    : 0;
  if (!regionalGrid) return local;
  const regional = (sampleGrid(regionalGrid, 0.5 + x / 600, 0.5 + z / 600) - 16946) * 0.0037;
  const blend = smoothRange(22, 57, distance) * (basinGrid ? 0.23 : 1);
  if (blend === 0) return local;
  // The measured rim sets the relief. Break up high scarps below the DEM's
  // sampling scale with stretched, irregular ribs and smaller block faces.
  const scarp = smoothRange(1.9, 8.5, regional);
  const shear = geologyNoise(x * 0.073 + 4, z * 0.057) * 2.6;
  const rib = 1 - Math.abs(2 * geologyNoise((x + z * 0.31) * 0.29 + shear, z * 0.105) - 1);
  const breccia = geologyNoise(x * 0.43, z * 0.46);
  const foothill = basinGrid ? 1 - smoothRange(38, 71, distance) * 0.64 : 1;
  const relief = scarp * foothill * ((rib * rib - 0.44) * 2.45 + (breccia - 0.5) * 0.82);
  const massif = geologyNoise(x * 0.024 + 32, z * 0.017 - 18);
  return local * (1 - blend) + (regional * (0.87 + 0.4 * massif) + relief) * blend;
}

export function groundHeight(x: number, z: number) {
  const distance = Math.hypot(x, z);
  const localDetail = 1 - smoothRange(27, 64, distance);
  let height = elevationHeight(x, z, distance) + localDetail * (
    (geologyNoise(x * 0.10 + 1, z * 0.13) - 0.5) * 0.49
    + (geologyNoise(x * 0.32, z * 0.45) - 0.5) * 0.18);
  if (basinGrid && distance > 36) {
    // Blend outside the walking area; the ring walls never alter traversal or the relay pad.
    const weight = smoothRange(36, 55, distance);
    const far = (sampleGrid(basinGrid, 0.5 + x / 600, 0.5 + z / 600) - 16384) / 512;
    height += (far - height) * weight;
  }
  const surveyed = trailGrid && distance < 46
    ? height * 0.68 + (sampleGrid(trailGrid, 0.5 + x / 96, 0.5 + z / 96) - 128) / 31
    : undefined;
  if (surveyed !== undefined && distance <= 32) return surveyed;
  for (const crater of craters) {
    const dx = x - crater.x;
    const dz = z - crater.z;
    if (dx * dx + dz * dz > (crater.radius * 1.64) ** 2) continue;
    const angle = Math.atan2(dz, dx);
    const rimRadius = 1 + 0.085 * Math.sin(angle * 3 + crater.x) + 0.035 * Math.cos(angle * 7 - crater.z);
    const r = Math.hypot(dx, dz) / (crater.radius * rimRadius);
    const bowl = 1 - smoothRange(0.23, 0.98, r);
    const crest = (0.63 + 0.65 * geologyNoise(x * 0.81, z * 0.58)) * Math.exp(-(((r - 1) / (r < 1 ? 0.11 : 0.19)) ** 2));
    const breach = crater.breach === undefined ? 1 : 1 - 0.78 * Math.max(0, Math.cos(angle - crater.breach)) ** 16;
    const apron = 0.095 * (1 - smoothRange(1.02, 1.52, r)) * smoothRange(0.84, 1.02, r);
    const slumps = (geologyNoise(x * 1.26, z * 1.13) - 0.5) * crest * 0.14;
    height += crater.depth * ((0.29 + 0.095 * Math.sin(angle * 5 + crater.z)) * crest * breach + apron + slumps - bowl);
  }
  return surveyed === undefined ? height : surveyed + smoothRange(32, 46, distance) * (height - surveyed);
}

const solids = [relay, ...boulders];
const playerRadius = 0.32;

function canOccupy(x: number, z: number) {
  return Math.abs(x) <= 15 && z >= -25 && z <= 12
    && solids.every((solid) => (x - solid.x) ** 2 + (z - solid.z) ** 2 >= (solid.radius + playerRadius) ** 2);
}

export function createWalker() {
  return { x: spawn.x, z: spawn.z, vx: 0, vz: 0, heading: Math.PI, speed: 0 };
}

export type Walker = ReturnType<typeof createWalker>;

export function stepWalker(player: Walker, horizontal: number, vertical: number, elapsed: number) {
  const duration = Math.max(0, Math.min(0.1, elapsed));
  const steps = Math.max(1, Math.ceil(duration * 60));
  for (let i = 0; i < steps; i++) advance(player, horizontal, vertical, duration / steps);
}

function advance(player: Walker, horizontal: number, vertical: number, delta: number) {
  const inputLength = Math.hypot(horizontal, vertical);
  const scale = inputLength > 0 ? 2.6 / Math.max(1, inputLength) : 0;
  const weight = 1 - Math.exp(-(scale ? 12 : 20) * delta);
  player.vx += (horizontal * scale - player.vx) * weight;
  player.vz += (vertical * scale - player.vz) * weight;
  if (Math.abs(player.vx) < 0.012) player.vx = 0;
  if (Math.abs(player.vz) < 0.012) player.vz = 0;

  const x = player.x + player.vx * delta;
  const z = player.z + player.vz * delta;
  if (canOccupy(x, player.z)) player.x = x;
  else player.vx = 0;
  if (canOccupy(player.x, z)) player.z = z;
  else player.vz = 0;

  player.speed = Math.hypot(player.vx, player.vz);
  if (inputLength > 0.04) {
    const direction = player.speed > 0.09 ? Math.atan2(player.vx, player.vz) : Math.atan2(horizontal, vertical);
    const angle = direction - player.heading;
    player.heading += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-13 * delta));
  }
}

export function nearRelay({ x, z }: Walker) {
  return (x - relay.x) ** 2 + (z - relay.z) ** 2 < relay.reach ** 2;
}
