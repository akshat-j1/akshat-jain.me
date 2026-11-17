export const relay = { x: 1.7, z: -10, radius: 2.05, reach: 4.65 };
export const spawn = { x: 0, z: 2.5 };
export const boulders = [
  { x: -3.2, z: -1, radius: 0.72 },
  { x: 4.2, z: -3.6, radius: 0.78 },
  { x: -5.6, z: -9.5, radius: 0.94 },
  { x: 5.5, z: -15.8, radius: 1.18 },
  { x: -8.3, z: 3, radius: 1.2 },
] as const;

export const craters = [
  { x: 6.4, z: -5.7, radius: 3.25, depth: 0.74 },
  { x: -4.7, z: -6.1, radius: 2.1, depth: 0.44 },
  { x: 3.7, z: 3.4, radius: 1.45, depth: 0.23 },
  { x: -8, z: -14, radius: 6.8, depth: 1.25 },
  { x: 11, z: -7, radius: 5.7, depth: 1.2 },
  { x: -21, z: 3, radius: 10, depth: 2.1 },
  { x: 12, z: -29, radius: 9, depth: 2.1 },
  { x: -12, z: 13, radius: 8, depth: 2.2 },
];

type ElevationGrid = { width: number; height: number; values: Uint8Array | Uint16Array };
let elevationGrid: ElevationGrid | undefined;
let regionalGrid: ElevationGrid | undefined;

/** Installs the NASA LOLA patch used by terrain rendering and walking contact. */
export function installElevationGrid(grid: ElevationGrid) {
  elevationGrid = grid;
}

export function installRegionalGrid(grid: ElevationGrid) {
  regionalGrid = grid;
}

export function clearElevationGrid() {
  elevationGrid = undefined;
  regionalGrid = undefined;
}

function sampleGrid({ width, height, values }: ElevationGrid, a: number, b: number) {
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
  const blend = smoothRange(22, 57, distance);
  if (blend === 0) return local;
  // The measured rim sets the relief. Break up high scarps below the DEM's
  // sampling scale with stretched, irregular ribs and smaller block faces.
  const scarp = smoothRange(1.9, 8.5, regional);
  const shear = geologyNoise(x * 0.073 + 4, z * 0.057) * 2.6;
  const rib = 1 - Math.abs(2 * geologyNoise((x + z * 0.31) * 0.29 + shear, z * 0.105) - 1);
  const breccia = geologyNoise(x * 0.43, z * 0.46);
  const relief = scarp * ((rib * rib - 0.44) * 2.1 + (breccia - 0.5) * 0.68);
  return local * (1 - blend) + (regional + relief) * blend;
}

export function groundHeight(x: number, z: number) {
  const distance = Math.hypot(x, z);
  const localDetail = 1 - smoothRange(27, 64, distance);
  let height = elevationHeight(x, z, distance) + localDetail * (
    (geologyNoise(x * 0.16, z * 0.18) - 0.5) * 0.31
    + (geologyNoise(x * 0.56 + 16, z * 0.47) - 0.5) * 0.12);
  for (const crater of craters) {
    const dx = x - crater.x;
    const dz = z - crater.z;
    if (dx * dx + dz * dz > (crater.radius * 1.64) ** 2) continue;
    const angle = Math.atan2(dz, dx);
    const rimRadius = 1 + 0.065 * Math.sin(angle * 3 + crater.x) + 0.025 * Math.cos(angle * 7 - crater.z);
    const r = Math.hypot(dx, dz) / (crater.radius * rimRadius);
    const bowl = 1 - smoothRange(0.23, 0.98, r);
    const crest = Math.exp(-(((r - 1) / (r < 1 ? 0.11 : 0.19)) ** 2));
    const apron = 0.055 * (1 - smoothRange(1.05, 1.52, r)) * smoothRange(0.9, 1.05, r);
    height += crater.depth * ((0.24 + 0.047 * Math.sin(angle * 5 + crater.z)) * crest + apron - bowl);
  }
  return height;
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
    const angle = Math.atan2(horizontal, vertical) - player.heading;
    player.heading += Math.atan2(Math.sin(angle), Math.cos(angle)) * (1 - Math.exp(-13 * delta));
  }
}

export function nearRelay({ x, z }: Walker) {
  return (x - relay.x) ** 2 + (z - relay.z) ** 2 < relay.reach ** 2;
}
