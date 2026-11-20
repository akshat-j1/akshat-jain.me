import { useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";

// One quiet crossing after arrival, followed by a long interval of open sky.
export function SkyCourier({ paused }: { paused: RefObject<boolean> }) {
  const ship = useRef<Group>(null);
  const time = useRef(0);
  useFrame(({ invalidate }, delta) => {
    if (!ship.current || document.hidden || paused.current) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    time.current += Math.min(delta, 0.12);
    const t = (time.current - 18) % 190;
    const visible = !reduced && time.current > 18 && t >= 0 && t < 18;
    ship.current.visible = visible;
    if (visible) {
      const p = t / 18;
      ship.current.position.set(
        -100 + p * 220,
        34 + Math.sin(p * Math.PI) * 7,
        -160,
      );
      ship.current.rotation.set(0, 0, -0.05 + Math.cos(p * Math.PI) * 0.05);
      invalidate();
    }
  });
  return (
    <group ref={ship} visible={false} scale={0.85}>
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.7, 5, 5]} />
        <meshStandardMaterial color="#a5abb3" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-2.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.3, 3, 12]} />
        <meshBasicMaterial color="#d9a46d" transparent opacity={0.36} />
      </mesh>
      <mesh position={[-1.5, 0, 0]}>
        <sphereGeometry args={[0.24, 8, 6]} />
        <meshBasicMaterial color="#ffe1ae" />
      </mesh>
    </group>
  );
}
