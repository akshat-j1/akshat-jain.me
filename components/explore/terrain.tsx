import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BufferAttribute, Color, IcosahedronGeometry, InstancedMesh, Object3D, Vector2, type Texture } from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { sunlight } from "./lighting";
import { createRegolithMaterial } from "./regolith-material";
import { basinRockExposure, boulders, craters, geologyNoise, groundHeight, relay, smoothRange } from "./simulation";
import { qualityTiers, type Quality } from "./quality";
import { createTerrainGrid } from "./terrain-grid";

function noise(x: number, z: number) {
  const raw = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

const horizontalSun = Math.hypot(sunlight[0], sunlight[2]);
const horizonSteps = [1.4, 2.8, 4.6, 7.5, 12, 18, 27, 42, 60, 82, 106, 142];

function sunVisibility(x: number, z: number, y: number) {
  let visible = 1;
  for (const step of horizonSteps) {
    const t = step / horizontalSun;
    const sample = groundHeight(x + sunlight[0] * t, z + sunlight[2] * t);
    const clearance = y + 0.065 + sunlight[1] * t - sample;
    const penumbra = 0.035 + step * 0.0047;
    visible = Math.min(visible, smoothRange(-penumbra, penumbra, clearance));
    if (visible === 0) return 0.06;
  }
  return 0.06 + 0.94 * visible;
}

function ejectaCoverage(x: number, z: number) {
  let fragments = 0;
  for (const crater of craters) {
    const dx = x - crater.x;
    const dz = z - crater.z;
    const radius = Math.hypot(dx, dz) / crater.radius;
    if (radius < 0.72 || radius > 2.3) continue;
    const angle = Math.atan2(dz, dx);
    const rays = Math.max(0, Math.cos(angle * 8 + crater.z + Math.sin(angle * 5) * 1.8)) ** 2;
    const fan = (0.3 + rays * 0.65) * smoothRange(0.72, 0.95, radius) * (1 - smoothRange(1.08, 2.3, radius));
    fragments = Math.max(fragments, fan);
  }
  return fragments;
}

function contactOcclusion(x: number, z: number) {
  let contact = 0;
  for (const rock of boulders) {
    const range = Math.hypot(x - rock.x, z - rock.z) / rock.radius;
    contact = Math.max(contact, (1 - smoothRange(0.54, 1.32, range)) * 0.64);
  }
  const pad = Math.hypot((x - relay.x) * 0.73, (z - relay.z) * 1.18);
  return 1 - Math.max(contact, (1 - smoothRange(0.3, 1.93, pad)) * 0.42);
}

// Keep the previous grid at walking scale and spend the outer mesh on radial slopes.
function terrainGeometry(quality: Quality) {
  const rings = quality === "lite" ? 36 : quality === "high" ? 54 : 52;
  const geometry = createTerrainGrid(qualityTiers[quality].subdivisions, rings);
  const positions = geometry.attributes.position;
  const uv = new Float32Array(positions.count * 2);
  const colors = new Float32Array(positions.count * 3);
  const surface = new Float32Array(positions.count * 4);

  for (let index = 0; index < positions.count; index++) {
    const x = positions.getX(index);
    const z = positions.getZ(index);
    const y = groundHeight(x, z);
    positions.setY(index, y);
    uv.set([(x + y * 0.3) * 1.29, (z - y * 0.37) * 1.29], index * 2);
    const mottle = geologyNoise(x * 0.16 + 8, z * 0.13 - 2);
    const broken = geologyNoise(x * 0.72 + mottle, z * 0.65 - mottle);
    const apron = ejectaCoverage(x, z);
    const pad = (1 - smoothRange(0.65, 2.1, Math.hypot((x - relay.x) * 0.83, z - relay.z))) * (0.65 + broken * 0.35);
    const fragments = Math.min(1, 0.15 + mottle * 0.25 + broken * 0.21 + apron * 0.81) * (1 - pad * 0.49);
    const broad = geologyNoise(x * 0.048 + 3, z * 0.045);
    const foreground = (0.70 + broad * 0.26 + 0.25 * mottle + 0.14 * broken + 0.13 * apron) * (1 - 0.18 * pad);
    const distance = smoothRange(35, 79, Math.hypot(x, z));
    const strata = geologyNoise(x * 0.13 + y * 0.39, z * 0.075 - y * 0.20);
    const exposed = basinRockExposure(x, z);
    const hillside = 0.59 + exposed * 0.66 + broad * 0.18 + strata * 0.15;
    const value = foreground * (1 - distance) + hillside * distance;
    colors.set([value, value * (0.994 + distance * 0.013), value * (0.984 + distance * 0.052)], index * 3);
    surface.set([fragments, apron * 0.26 + distance * exposed * 0.30, sunVisibility(x, z, y), contactOcclusion(x, z)], index * 4);
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  for (let i = 0; i < normals.count; i++) {
    const strata = smoothRange(0.04, 0.30, 1 - normals.getY(i));
    surface[i * 4 + 1] += strata * 0.87;
    surface[i * 4] = Math.min(1, surface[i * 4] + strata * 0.26);
  }
  geometry.setAttribute("groundSurface", new BufferAttribute(surface, 4));
  return geometry;
}

type RockClass = "chips" | "cobbles" | "blocks" | "slabs";

function rockGeometry(kind: RockClass) {
  const isLarge = kind === "blocks" || kind === "slabs";
  const geometry = new IcosahedronGeometry(1, isLarge ? 3 : kind === "cobbles" ? 1 : 0);
  const p = geometry.attributes.position;
  const variation = new Float32Array(p.count * 3);
  const slab = kind === "slabs";
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const distortion = isLarge ? geologyNoise(x * 2.15 + y * 0.53, z * 2.56 - y * 0.36) : noise(Math.round(x * 71 + y * 103), Math.round(z * 53));
    const radius = 0.81 + 0.32 * distortion;
    const rockX = slab ? Math.min(x * radius + y * 0.12, 0.44 + y * 0.33 + z * 0.07) : x * radius - y * 0.15;
    const cap = slab ? 0.65 + z * 0.26 - x * 0.15 : 0.77 - x * 0.26 + z * 0.10;
    p.setXYZ(i, rockX, Math.min(cap, y * radius), z * radius + 0.15 * y * x);
    const seam = Math.abs(y + z * 0.18 - x * 0.28);
    const tone = 0.82 + noise(Math.round(x * 9), Math.round(z * 7)) * 0.18 + (1 - smoothRange(0.02, 0.21, seam)) * 0.14;
    variation.set([tone, tone * 0.977, tone * 0.952], i * 3);
  }
  geometry.setAttribute("color", new BufferAttribute(variation, 3));
  if (isLarge) toCreasedNormals(geometry, 0.76);
  else geometry.computeVertexNormals();
  return geometry;
}

const fragments = [
  { x: -2.29, z: 2.23, radius: 0.59 },
  { x: -3.57, z: 3.01, radius: 0.42 },
  { x: -4.03, z: 1.81, radius: 0.38 },
  { x: 4.63, z: -2.68, radius: 0.43 },
  { x: -5.31, z: -10.2, radius: 0.37 },
  { x: 6.86, z: -16.8, radius: 0.57 },
  { x: -20.6, z: -29.2, radius: 1.12 },
  { x: -21.8, z: -28.6, radius: 0.52 },
  { x: -19.0, z: -31.1, radius: 0.72 },
  { x: 21.4, z: -25.5, radius: 1.25 },
  { x: 21.8, z: -24.3, radius: 0.49 },
];

function Rocks({ count, kind, shadows, soil, normal }: {
  count: number; kind: RockClass; shadows: boolean; soil: Texture; normal: Texture;
}) {
  const geometry = useMemo(() => rockGeometry(kind), [kind]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const instances = useRef<InstancedMesh>(null);
  const normalScale = useMemo(() => new Vector2(0.28, 0.28), []);

  useLayoutEffect(() => {
    const mesh = instances.current!;
    const dummy = new Object3D();
    const color = new Color();
    const local = kind === "chips" || kind === "cobbles";
    const salt = { chips: 0, cobbles: 3100, blocks: 6100, slabs: 9100 }[kind];
    for (let i = 0; i < count; i++) {
      const seed = i + salt;
      const placed = kind === "slabs" ? boulders[i] : kind === "blocks" ? fragments[i] : undefined;
      const impact = craters[i % 8];
      const angle = noise(seed, 82) * Math.PI * 2;
      const distance = impact.radius * (0.83 + noise(seed, 43) * 1.0);
      const field = i % 5 < 2;
      const range = local ? 39 : 65;
      const x = placed?.x ?? (field ? (noise(seed, 5) - 0.5) * range : impact.x + Math.cos(angle) * distance);
      const z = placed?.z ?? (field ? (noise(seed, 12) - 0.58) * range : impact.z + Math.sin(angle) * distance);
      const clearTrail = Math.abs(x - 0.5) < 1.63 && z > -13 && z < 7;
      const atRelay = Math.hypot(x - relay.x, z - relay.z) < 2.15;
      const radius = placed?.radius ?? (kind === "chips" ? 0.022 + noise(seed, 29) ** 2 * 0.067
        : kind === "cobbles" ? 0.05 + noise(seed, 29) ** 2 * 0.16 : 0.19 + noise(seed, 29) ** 2 * 0.30);
      const size = !placed && (atRelay || clearTrail) ? (local ? radius * 0.52 : 0.002) : radius;
      const y = groundHeight(x, z);
      dummy.position.set(x, y - size * 0.10 + (placed && kind === "slabs" ? size * 0.06 : 0), z);
      const height = placed && kind === "slabs" ? (i === 0 ? 1.06 : 0.65) : 0.45 + 0.46 * noise(seed, 88);
      dummy.scale.set(size, size * height, size * (0.66 + noise(seed, 77) * 0.40));
      const turn = placed && kind === "slabs" && i === 0 ? 0.35 : angle;
      dummy.rotation.set((noise(seed, 49) - 0.5) * 0.28, turn, (noise(seed, 2) - 0.5) * 0.39);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const visibility = 0.28 + 0.72 * sunVisibility(x, z, y + size * 0.25);
      const tint = (0.56 + noise(seed, 23) * 0.49) * visibility;
      mesh.setColorAt(i, color.setRGB(tint, tint * 0.99, tint * 0.97));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [count, kind]);

  return (
    <instancedMesh key={count} ref={instances} args={[geometry, undefined, count]} castShadow={shadows} receiveShadow>
      <meshStandardMaterial roughness={0.92} flatShading={kind === "chips" || kind === "cobbles"} vertexColors color="#dedbd3" map={soil}
        normalMap={kind === "blocks" || kind === "slabs" ? normal : null} normalScale={normalScale} />
    </instancedMesh>
  );
}

export function Terrain({ soil, normal, detail, quality }: {
  soil: Texture; normal: Texture; detail: Texture | null; quality: Quality;
}) {
  const geometry = useMemo(() => terrainGeometry(quality), [quality]);
  const detailed = quality !== "lite";
  const material = useMemo(() => createRegolithMaterial(soil, normal, detailed ? detail : null), [soil, normal, detail, detailed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <>
      <mesh geometry={geometry} material={material} receiveShadow />
      <Rocks count={Math.round(qualityTiers[quality].rocks * 1.38)} kind="chips" shadows={false} soil={soil} normal={normal} />
      <Rocks count={Math.round(qualityTiers[quality].rocks * 0.52)} kind="cobbles" shadows={false} soil={soil} normal={normal} />
      <Rocks count={quality === "lite" ? 22 : 48} kind="blocks" shadows={detailed} soil={soil} normal={normal} />
      <Rocks count={boulders.length} kind="slabs" shadows={detailed} soil={soil} normal={normal} />
    </>
  );
}
