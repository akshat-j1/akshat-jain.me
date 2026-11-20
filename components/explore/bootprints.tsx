import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Vector3 } from "three";
import { groundHeight, type Walker } from "./simulation";

const capacity = 48;
const up = new Vector3(0, 1, 0);

export function Bootprints({ walker }: { walker: { current: Walker } }) {
  const mesh = useRef<InstancedMesh>(null);
  const travel = useRef(0);
  const steps = useRef(0);
  const pose = useMemo(() => new Object3D(), []);
  const normal = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    const player = walker.current;
    if (!player.grounded || !mesh.current || player.speed < 0.35) return;
    travel.current += player.speed * Math.min(delta, 0.08);
    if (travel.current < 0.67) return;
    travel.current -= 0.67;
    const side = steps.current % 2 === 0 ? -0.105 : 0.105;
    const s = Math.sin(player.heading), c = Math.cos(player.heading);
    const x = player.x - s * 0.15 + c * side;
    const z = player.z - c * 0.15 - s * side;
    normal.set(groundHeight(x - 0.10, z) - groundHeight(x + 0.10, z), 0.20,
      groundHeight(x, z - 0.10) - groundHeight(x, z + 0.10)).normalize();
    pose.position.set(x, groundHeight(x, z) + 0.012, z);
    pose.quaternion.setFromUnitVectors(up, normal);
    pose.rotateY(player.heading);
    pose.rotateX(-Math.PI / 2);
    pose.updateMatrix();
    mesh.current.setMatrixAt(steps.current % capacity, pose.matrix);
    mesh.current.count = Math.min(++steps.current, capacity);
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.visible = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, capacity]} visible={false} frustumCulled={false}>
    <planeGeometry args={[0.18, 0.32]} />
    <shaderMaterial transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1}
      vertexShader={`
        varying vec2 sole;
        void main() {
          sole = uv * 2.0 - 1.0;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position,1.0);
        }`}
      fragmentShader={`
        varying vec2 sole;
        void main() {
          float toe = length(vec2(sole.x, max(abs(sole.y)*1.55-0.78,0.0)));
          float edge = 1.0 - smoothstep(0.69, 1.0, toe);
          float tread = smoothstep(-0.15,0.55,cos(sole.y*26.0 + abs(sole.x)*1.7));
          gl_FragColor = vec4(vec3(0.16,0.16,0.17), edge*(0.12+0.44*tread));
        }`} />
  </instancedMesh>;
}
