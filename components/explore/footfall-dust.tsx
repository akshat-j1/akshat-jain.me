import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, type InstancedMesh } from "three";
import { groundHeight, type Walker } from "./simulation";

type Particle = { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; life: number; scale: number };
const count = 30;

export function FootfallDust({ walker }: { walker: { current: Walker } }) {
  const particles = useRef<Particle[]>(Array.from({ length: count }, () => ({
    x: 0, y: -20, z: 0, vx: 0, vy: 0, vz: 0, age: 1, life: 0.48, scale: 0,
  })));
  const instances = useRef<InstancedMesh>(null);
  const clock = useRef(0);
  const seed = useRef(91);
  const dummy = useRef(new Object3D());

  useFrame((_, elapsed) => {
    const player = walker.current;
    const delta = Math.min(elapsed, 0.1);
    if (player.speed > 0.85) {
      clock.current += delta * player.speed;
      while (clock.current >= 0.78) {
        clock.current -= 0.78;
        const speed = Math.max(player.speed, 0.1);
        const backX = -player.vx / speed;
        const backZ = -player.vz / speed;
        for (let k = 0; k < 3; k++) {
          const random = () => {
            seed.current = (Math.imul(seed.current, 1664525) + 1013904223) >>> 0;
            return seed.current / 4294967296;
          };
          const particle = particles.current.find((item) => item.age >= item.life);
          if (!particle) break;
          const x = player.x + backX * (0.12 + random() * 0.08) + (random() - 0.5) * 0.18;
          const z = player.z + backZ * (0.12 + random() * 0.08) + (random() - 0.5) * 0.18;
          particle.x = x;
          particle.y = groundHeight(x, z) + 0.025;
          particle.z = z;
          particle.vx = backX * (0.06 + random() * 0.1) + (random() - 0.5) * 0.09;
          particle.vz = backZ * (0.06 + random() * 0.1) + (random() - 0.5) * 0.09;
          particle.vy = 0.38 + random() * 0.22;
          particle.age = 0;
          particle.life = 0.34 + random() * 0.15;
          particle.scale = 0.45 + random() * 0.65;
        }
      }
    }

    const mesh = instances.current;
    if (!mesh) return;
    let active = false;
    for (let i = 0; i < count; i++) {
      const particle = particles.current[i];
      if (particle.age < particle.life) {
        active = true;
        particle.age += delta;
        particle.x += particle.vx * delta;
        particle.y += particle.vy * delta;
        particle.z += particle.vz * delta;
        particle.vy -= 1.62 * delta;
        if (particle.y <= groundHeight(particle.x, particle.z) + 0.01) particle.age = particle.life;
      }
      const progress = Math.min(1, particle.age / particle.life);
      const envelope = Math.sin(Math.PI * progress);
      const size = particle.age < particle.life ? particle.scale * envelope : 0;
      dummy.current.position.set(particle.x, particle.y, particle.z);
      dummy.current.scale.setScalar(size);
      dummy.current.updateMatrix();
      mesh.setMatrixAt(i, dummy.current.matrix);
    }
    mesh.visible = active;
    if (active) mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instances} args={[undefined, undefined, count]} frustumCulled={false} visible={false}>
      <sphereGeometry args={[0.045, 6, 5]} />
      <meshBasicMaterial color="#c7c8c8" transparent opacity={0.18} depthWrite={false} />
    </instancedMesh>
  );
}
