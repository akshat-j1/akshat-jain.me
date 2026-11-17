import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BufferAttribute, Color, IcosahedronGeometry, InstancedMesh, Object3D, PlaneGeometry, type Texture } from "three";
import { sunlight } from "./lighting";
import { createRegolithMaterial } from "./regolith-material";
import { boulders, craters, geologyNoise, groundHeight, relay, smoothRange } from "./simulation";
import { qualityTiers, type Quality } from "./quality";

function noise(x: number, z: number) {
  const raw = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

const horizontalSun = Math.hypot(sunlight[0], sunlight[2]);
const horizonSteps = [2, 4, 7, 11, 16, 24, 36, 52, 76, 112];

function sunVisibility(x: number, z: number, y: number) {
  let clearance = 0.2;
  for (const step of horizonSteps) {
    const t = step / horizontalSun;
    const sample = groundHeight(x + sunlight[0] * t, z + sunlight[2] * t);
    clearance = Math.min(clearance, y + 0.05 + sunlight[1] * t - sample);
    if (clearance < -0.22) return 0.32;
  }
  return 0.32 + 0.68 * smoothRange(-0.22, 0.11, clearance);
}

function ejecta(x: number, z: number) {
  let fragments = 0;
  for (const crater of craters) {
    const dx = x - crater.x;
    const dz = z - crater.z;
    const radius = Math.hypot(dx, dz) / crater.radius;
    if (radius < 0.76 || radius > 2.7) continue;
    const angle = Math.atan2(dz, dx);
    const rays = Math.max(0, Math.cos(angle * 11 + crater.z + Math.sin(angle * 7) * 1.8)) ** 3;
    fragments += (0.047 + rays * 0.25) * smoothRange(0.76, 1.02, radius) * (1 - smoothRange(1.12, 2.7, radius));
  }
  return fragments;
}

// A single continuous mesh puts most vertices where the walker can reach.
// Vertex spacing grows outside this range without a seam or overlapping planes.
function terrainGeometry(quality: Quality) {
  const core = qualityTiers[quality].subdivisions;
  const outer = quality === "lite" ? 38 : 46;
  const divisions = core + outer * 2;
  const geometry = new PlaneGeometry(2, 2, divisions, divisions);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const colors = new Float32Array(positions.count * 3);
  const spacing = Array.from({ length: divisions + 1 }, (_, index) => {
    const k = index - divisions / 2;
    const d = Math.abs(k);
    if (d <= core / 2) return k * 72 / core;
    const t = (d - core / 2) / outer;
    const firstStep = outer * 72 / core * t;
    return Math.sign(k) * (36 + firstStep + (264 - outer * 72 / core) * t ** 2.35);
  });
  for (let j = 0; j <= divisions; j++) {
    for (let i = 0; i <= divisions; i++) {
      const index = j * (divisions + 1) + i;
      const x = spacing[i];
      const z = spacing[j];
      const y = groundHeight(x, z);
      positions.setXYZ(index, x, y, z);
      uv.setXY(index, (x + y * 0.28) * 1.12, (z - y * 0.33) * 1.12);
      const tone = 0.77 + geologyNoise(x * 0.054 + 12, z * 0.06 - 7) * 0.23
        + geologyNoise(x * 0.22, z * 0.21) * 0.26 + geologyNoise(x * 0.81, z * 0.76) * 0.13 + ejecta(x, z);
      const value = tone * sunVisibility(x, z, y);
      colors.set([value, value * 0.993, value * 0.975], index * 3);
    }
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function rockGeometry(isBoulder: boolean) {
  const geometry = new IcosahedronGeometry(1, isBoulder ? 2 : 1);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const radius = 0.81 + 0.26 * noise(Math.round(x * 167) + Math.round(y * 93), Math.round(z * 167));
    // Duplicate points receive identical deformation, so adjoining facets stay joined.
    p.setXYZ(i, x * radius + 0.16 * y, Math.min(0.73, y * radius) * (0.84 + 0.24 * z), z * radius + 0.17 * y * x);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function Rocks({ count, boulderBatch, shadows, soil }: { count: number; boulderBatch: boolean; shadows: boolean; soil: Texture }) {
  const geometry = useMemo(() => rockGeometry(boulderBatch), [boulderBatch]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const instances = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = instances.current!;
    const dummy = new Object3D();
    const color = new Color();
    for (let i = 0; i < count; i++) {
      const seed = i + (boulderBatch ? 1700 : 0);
      const placed = boulderBatch ? boulders[i] : undefined;
      const impact = craters[i % craters.length];
      const radial = noise(seed, 82) * Math.PI * 2;
      const distance = impact.radius * (0.92 + noise(seed, 43) * 1.45);
      const field = i % 5 < 2;
      const range = boulderBatch ? 75 : 53;
      const x = placed?.x ?? (field ? (noise(seed, 5) - 0.5) * range : impact.x + Math.cos(radial) * distance);
      const z = placed?.z ?? (field ? (noise(seed, 12) - 0.58) * range : impact.z + Math.sin(radial) * distance);
      const clearTrail = Math.abs(x - 0.7) < 1.95 && z > -13 && z < 6.5;
      const atRelay = Math.hypot(x - relay.x, z - relay.z) < 2.25;
      const radius = placed?.radius ?? (boulderBatch ? 0.19 + noise(seed, 29) ** 2 * 0.33 : 0.024 + noise(seed, 29) ** 2.5 * 0.16);
      const size = atRelay || (clearTrail && boulderBatch) ? 0.003 : radius;
      dummy.position.set(x, groundHeight(x, z) - size * 0.08, z);
      dummy.scale.set(size, size * (0.43 + 0.49 * noise(seed, 88)), size * (0.65 + noise(seed, 77) * 0.38));
      dummy.rotation.set((noise(seed, 49) - 0.5) * 0.48, radial, (noise(seed, 2) - 0.5) * 0.48);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const tint = (0.55 + noise(seed, 23) ** 1.5 * 0.42) * sunVisibility(x, z, dummy.position.y);
      mesh.setColorAt(i, color.setRGB(tint, tint * 0.985, tint * 0.965));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [boulderBatch, count]);

  return (
    <instancedMesh key={count} ref={instances} args={[geometry, undefined, count]} castShadow={shadows} receiveShadow>
      <meshStandardMaterial roughness={0.96} flatShading color="#c7c5bf" map={soil} />
    </instancedMesh>
  );
}

export function Terrain({ soil, normal, quality }: { soil: Texture; normal: Texture; quality: Quality }) {
  const geometry = useMemo(() => terrainGeometry(quality), [quality]);
  const detailed = quality !== "lite";
  const material = useMemo(() => createRegolithMaterial(soil, normal, detailed), [soil, normal, detailed]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  return (
    <>
      <mesh geometry={geometry} material={material} receiveShadow />
      <Rocks count={qualityTiers[quality].rocks} boulderBatch={false} shadows={false} soil={soil} />
      <Rocks count={quality === "lite" ? 28 : 55} boulderBatch shadows={detailed} soil={soil} />
    </>
  );
}
