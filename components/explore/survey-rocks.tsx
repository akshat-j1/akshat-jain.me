import { useLayoutEffect, useMemo, useRef } from "react";
import { Box3, Color, InstancedMesh, Mesh, Object3D, Vector3 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { boulders, groundHeight } from "./simulation";
import type { Quality } from "./quality";

// Bedrock exposures around the walkable valley. Fragments run down the same
// strike as their parent ledge, with smaller blocks spreading onto its apron.
const ledges = [
  [-19, -22, 0.67, 2.1], [24, -23, -0.72, 2.2], [-25, -10, 1.15, 2.8],
  [33, -1, -0.33, 2.0], [-25, 17, -0.96, 2.2], [15, 25, 0.29, 2.1],
  [-6, -25, 0.28, 1.9], [28, 18, 0.90, 2.1], [-14, 24, -0.58, 1.8],
] as const;

function fraction(seed: number, stream: number) {
  const value = Math.sin(seed * 15.713 + stream * 45.19) * 43758.5453;
  return value - Math.floor(value);
}

export function SurveyRocks({ asset, variant, quality }: { asset: GLTF; variant: number; quality: Quality }) {
  const ref = useRef<InstancedMesh>(null);
  const mesh = useMemo(() => asset.scene.getObjectByProperty("type", "Mesh") as Mesh, [asset]);
  const anchors = boulders.filter((_, i) => i % 2 === variant);
  const perLedge = quality === "lite" ? 3 : quality === "high" ? 8 : 5;
  const count = anchors.length + ledges.length * perLedge;
  useLayoutEffect(() => {
    const instances = ref.current!;
    const object = new Object3D();
    const color = new Color();
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox!;
    const extent = bounds.getSize(new Vector3());
    const halfWidth = Math.max(extent.x, extent.z) * 0.5;
    const anchors = boulders.filter((_, i) => i % 2 === variant);
    for (let i = 0; i < count; i++) {
      const seed = i + variant * 73;
      const anchor = anchors[i];
      const index = Math.max(0, i - anchors.length);
      const [cx, cz, strike, magnitude] = ledges[Math.floor(index / perLedge)];
      const rank = index % perLedge;
      const along = (rank + variant * 0.65 - 1.6) * magnitude * (0.35 + fraction(seed, 1) * 1.22);
      const across = (fraction(seed, 2) - 0.5) * magnitude * (rank ? 2.8 : 1.4);
      const x = anchor?.x ?? cx + along * Math.cos(strike) - across * Math.sin(strike);
      const z = anchor?.z ?? cz + along * Math.sin(strike) + across * Math.cos(strike);
      const radius = anchor?.radius ?? magnitude * (0.73 + fraction(seed, 3) * 0.37) / (1 + rank * 0.83);
      const scale = radius / halfWidth;
      object.scale.set(scale * (anchor ? 0.94 : 1.36), radius / extent.y * (anchor ? 0.94 : 1.08), scale * 0.83);
      object.rotation.set((fraction(seed, 4)-0.5)*0.48, strike + fraction(seed, 5) * 1.8, (fraction(seed, 6)-0.5)*0.4);
      object.position.set(0, 0, 0);
      object.updateMatrix();
      const rotated = new Box3().copy(bounds).applyMatrix4(object.matrix);
      const contact = Math.min(groundHeight(x,z),
        groundHeight(x+radius*.55,z), groundHeight(x-radius*.55,z),
        groundHeight(x,z+radius*.55), groundHeight(x,z-radius*.55));
      object.position.set(x, contact - rotated.min.y - radius * .23, z);
      object.updateMatrix();
      instances.setMatrixAt(i, object.matrix);
      const tone = 0.82 + fraction(seed, 7) * 0.29;
      instances.setColorAt(i, color.setRGB(tone, tone * 0.985, tone * 0.967));
    }
    instances.instanceMatrix.needsUpdate = true;
    instances.computeBoundingSphere();
  }, [mesh, count, variant, perLedge]);
  return <instancedMesh ref={ref} args={[mesh.geometry, mesh.material, count]} castShadow={quality !== "lite"} receiveShadow dispose={null} />;
}
