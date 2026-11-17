import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  Object3D,
  Quaternion,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { groundHeight, relay } from "./simulation";

const up = new Vector3(0, 1, 0);

function Strut({ from, to, radius = 0.035, color = "#aaa79d" }: { from: Vector3; to: Vector3; radius?: number; color?: string }) {
  const axis = to.clone().sub(from);
  const length = axis.length();
  const position = from.clone().lerp(to, 0.5);
  const quaternion = new Quaternion().setFromUnitVectors(up, axis.normalize());
  return (
    <mesh position={position} quaternion={quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      <meshStandardMaterial color={color} metalness={0.52} roughness={0.58} />
    </mesh>
  );
}

function reflectorDetails() {
  const positions: number[] = [];
  const rings = [0.23, 0.47, 0.72, 0.96, 1.17];
  const spokeCount = 14;
  for (let spoke = 0; spoke < spokeCount; spoke++) {
    const angle = spoke * Math.PI * 2 / spokeCount;
    for (let i = 0; i < 24; i++) {
      const start = 0.1 + i * 1.12 / 24;
      const end = 0.1 + (i + 1) * 1.12 / 24;
      positions.push(
        start * Math.cos(angle), 0.28 * start * start + 0.006, start * Math.sin(angle),
        end * Math.cos(angle), 0.28 * end * end + 0.006, end * Math.sin(angle),
      );
    }
  }
  for (const radius of rings) {
    for (let i = 0; i < 48; i++) {
      const a = i * Math.PI * 2 / 48;
      const b = (i + 1) * Math.PI * 2 / 48;
      positions.push(
        radius * Math.cos(a), 0.28 * radius * radius + 0.006, radius * Math.sin(a),
        radius * Math.cos(b), 0.28 * radius * radius + 0.006, radius * Math.sin(b),
      );
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

function arrayGrid() {
  const vertices: number[] = [];
  for (const side of [-1, 1]) {
    const angle = side * 0.08;
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const point = (x: number, z: number) => [side * 1.43 + x * c - z * s, 0.315, 0.25 + x * s + z * c] as const;
    for (let i = 1; i < 5; i++) {
      const x = -0.43 + i * 0.172;
      vertices.push(...point(x, -0.27), ...point(x, 0.27));
    }
    for (let i = 1; i < 3; i++) {
      const z = -0.27 + i * 0.18;
      vertices.push(...point(-0.43, z), ...point(0.43, z));
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(vertices), 3));
  return geometry;
}

function ServiceCable() {
  const cable = useMemo(() => new CatmullRomCurve3([
    new Vector3(0.49, 0.2, 0.4),
    new Vector3(0.62, 0.15, 0.24),
    new Vector3(0.52, 0.12, -0.02),
    new Vector3(0.42, 0.21, -0.22),
  ]), []);
  const geometry = useMemo(() => new TubeGeometry(cable, 32, 0.018, 5, false), [cable]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry}><meshStandardMaterial color="#55534d" roughness={0.82} /></mesh>;
}

export function CommunicationsRelay({ active, onInspect }: { active: boolean; onInspect: () => void }) {
  const reflector = useRef<Group>(null);
  const bolts = useRef<InstancedMesh>(null);
  const origin: [number, number, number] = [relay.x, groundHeight(relay.x, relay.z) - 0.07, relay.z];
  const dish = useMemo(() => {
    const points = Array.from({ length: 20 }, (_, i) => {
      const radius = 1.25 * i / 19;
      return new Vector2(Math.max(radius, 0.008), 0.28 * radius * radius);
    });
    return new LatheGeometry(points, 48);
  }, []);
  const details = useMemo(() => reflectorDetails(), []);
  const grid = useMemo(() => arrayGrid(), []);
  useEffect(() => () => dish.dispose(), [dish]);
  useEffect(() => () => details.dispose(), [details]);
  useEffect(() => () => grid.dispose(), [grid]);

  const mounts = useMemo(() => Array.from({ length: 3 }, (_, i) => {
    const angle = i * Math.PI * 2 / 3 + 0.19;
    return new Vector3(Math.cos(angle) * 1.02, 0.03, Math.sin(angle) * 1.02);
  }), []);

  useEffect(() => {
    if (!bolts.current) return;
    const dummy = new Object3D();
    const locations = [
      [-0.32, 0.42, 0.905], [0.62, 0.42, 0.905],
      [-0.32, 0.08, 0.905], [0.62, 0.08, 0.905],
    ] as const;
    locations.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.034);
      dummy.updateMatrix();
      bolts.current!.setMatrixAt(i, dummy.matrix);
    });
    bolts.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    if (!reflector.current) return;
    const seconds = clock.elapsedTime;
    reflector.current.rotation.y = 0.003 + Math.sin(seconds * 0.047) * 0.006;
    reflector.current.rotation.x = 0.77 + Math.sin(seconds * 0.028) * 0.003;
  });

  return (
    <group position={origin} onClick={(event) => {
      if (!active || event.delta > 5) return;
      event.stopPropagation();
      onInspect();
    }}>
      <group>
        {mounts.map((foot, index) => (
          <group key={index}>
            <Strut from={foot} to={new Vector3(0, 1.35, 0)} radius={0.055} />
            <Strut from={foot.clone().lerp(new Vector3(0, 1.35, 0), 0.38)} to={new Vector3(0, 0.54, 0)} radius={0.024} color="#c3beb2" />
            <mesh position={foot} castShadow>
              <cylinderGeometry args={[0.19, 0.23, 0.08, 10]} />
              <meshStandardMaterial color="#aaa69b" roughness={0.86} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0.68, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.42, 12]} />
        <meshStandardMaterial color="#c2bcae" metalness={0.3} roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.24, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.16, 12]} />
        <meshStandardMaterial color="#68675f" metalness={0.55} roughness={0.66} />
      </mesh>
      <group ref={reflector} position={[0, 1.48, 0]} rotation={[0.77, 0, -0.42]}>
        <mesh geometry={dish} castShadow>
          <meshStandardMaterial color="#d1cbbf" metalness={0.16} roughness={0.58} side={DoubleSide} />
        </mesh>
        <lineSegments geometry={details}>
          <lineBasicMaterial color="#7d7d76" transparent opacity={0.84} />
        </lineSegments>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4375, 0]}>
          <torusGeometry args={[1.25, 0.022, 8, 52]} />
          <meshStandardMaterial color="#e1ddd1" roughness={0.5} />
        </mesh>
        {mounts.map((foot, i) => (
          <Strut key={i} from={new Vector3(foot.x * 1.1, 0.38, foot.z * 1.1)} to={new Vector3(0, 0.92, 0)} radius={0.019} color="#d0cabc" />
        ))}
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.046, 0.27, 12]} />
          <meshStandardMaterial color="#e0d9cb" metalness={0.44} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.055, 0]}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshStandardMaterial color="#dfd8ca" metalness={0.42} roughness={0.48} />
        </mesh>
      </group>
      <mesh position={[0.36, 0.3, 0.63]} castShadow>
        <boxGeometry args={[0.78, 0.65, 0.5]} />
        <meshStandardMaterial color="#c4beb0" roughness={0.9} />
      </mesh>
      <mesh position={[0.36, 0.46, 0.888]}>
        <boxGeometry args={[0.55, 0.15, 0.009]} />
        <meshStandardMaterial color="#252729" metalness={0.34} roughness={0.65} />
      </mesh>
      <instancedMesh ref={bolts} args={[undefined, undefined, 4]}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#c1b89f" metalness={0.55} roughness={0.42} />
      </instancedMesh>
      <mesh position={[0.5, 0.47, 0.899]}>
        <sphereGeometry args={[0.027, 10, 8]} />
        <meshStandardMaterial color="#d48a52" emissive="#ac4e1c" emissiveIntensity={active ? 0.8 : 0.3} />
      </mesh>
      <ServiceCable />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.43, 0.26, 0.25]} rotation={[0, side * 0.08, 0]} castShadow>
          <boxGeometry args={[0.92, 0.065, 0.64]} />
          <meshStandardMaterial color="#37434a" metalness={0.42} roughness={0.46} />
        </mesh>
      ))}
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#89949a" transparent opacity={0.84} />
      </lineSegments>
      <mesh position={[0, 0.09, 0]} castShadow>
        <boxGeometry args={[1.12, 0.15, 0.92]} />
        <meshStandardMaterial color="#8e8a80" metalness={0.12} roughness={0.84} />
      </mesh>
    </group>
  );
}
