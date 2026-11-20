import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BoxGeometry,
  CylinderGeometry,
  Group,
  TorusGeometry,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { moon, artifactSites } from "../../content/worlds";
import { groundHeight, type Walker } from "./simulation";
import type { RefObject } from "react";

function baseGeometry(kind: "orrery" | "archive") {
  const parts: BufferGeometry[] = [];
  const pedestal = new CylinderGeometry(1.15, 1.45, 0.35, 12);
  pedestal.translate(0, 0.18, 0);
  parts.push(pedestal);
  if (kind === "orrery") {
    const stem = new CylinderGeometry(0.3, 0.5, 1.6, 8);
    stem.translate(0, 1.1, 0);
    parts.push(stem);
    const bowl = new TorusGeometry(0.9, 0.08, 6, 40);
    bowl.rotateX(Math.PI / 2);
    bowl.translate(0, 1, 0);
    parts.push(bowl);
  } else {
    for (let i = 0; i < 5; i++) {
      const fin = new BoxGeometry(0.16, 2.3 + Math.sin(i) * 0.3, 0.85);
      fin.rotateZ((i - 2) * 0.09);
      fin.translate((i - 2) * 0.42, 1.45, 0);
      parts.push(fin);
    }
  }
  const geometry = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return geometry;
}

function GroundLight({ radius = 2.5 }: { radius?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
      <planeGeometry args={[radius * 2, radius * 2]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        vertexShader={`varying vec2 p;void main(){p=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 p;void main(){float a=pow(max(0.,1.-length(p)),2.4);gl_FragColor=vec4(.93,.47,.19,a*.28);}`}
      />
    </mesh>
  );
}

export function Installations({ paused }: { paused: RefObject<boolean> }) {
  const orbits = useRef<Group>(null);
  const bodies = useMemo(
    () => ({
      orrery: baseGeometry("orrery"),
      archive: baseGeometry("archive"),
    }),
    [],
  );
  useEffect(
    () => () => {
      bodies.orrery.dispose();
      bodies.archive.dispose();
    },
    [bodies],
  );
  useFrame((_, delta) => {
    if (
      orbits.current &&
      !paused.current &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      orbits.current.rotation.y += Math.min(delta, 0.1) * 0.13;
  });
  return (
    <>
      {artifactSites.map((site) => (
        <group
          key={site.id}
          position={[site.x, groundHeight(site.x, site.z), site.z]}
        >
          <mesh geometry={bodies[site.id]} castShadow receiveShadow>
            <meshStandardMaterial
              color="#687585"
              roughness={0.67}
              metalness={0.34}
            />
          </mesh>
          <GroundLight />
          <pointLight
            position={[0, 2.3, 0]}
            color="#f5b477"
            intensity={3}
            distance={5}
            decay={2}
          />
          {site.id === "orrery" ? (
            <group position={[0, 2.35, 0]} ref={orbits}>
              {[0, 1, 2].map((i) => (
                <mesh
                  key={i}
                  rotation={[0.4 + i * 0.63, 0, i * 0.85]}
                  castShadow
                >
                  <torusGeometry args={[1.0 + i * 0.16, 0.04, 6, 64]} />
                  <meshStandardMaterial
                    color="#bc8759"
                    metalness={0.8}
                    roughness={0.31}
                    emissive="#ae6330"
                    emissiveIntensity={0.15}
                  />
                </mesh>
              ))}
              <mesh>
                <sphereGeometry args={[0.28, 20, 12]} />
                <meshStandardMaterial
                  color="#eddbc0"
                  emissive="#f6bb7c"
                  emissiveIntensity={2}
                />
              </mesh>
              <mesh position={[1.16, 0, 0]}>
                <sphereGeometry args={[0.105, 12, 8]} />
                <meshStandardMaterial
                  color="#7cb2c0"
                  emissive="#427c99"
                  emissiveIntensity={0.5}
                />
              </mesh>
            </group>
          ) : (
            <group>
              {[-1, 1].flatMap((side) =>
                [0, 1, 2, 3, 4].map((i) => (
                  <mesh
                    key={side + "," + i}
                    position={[(i - 2) * 0.42, 1.7, side * 0.44]}
                    rotation={[0, 0, (i - 2) * 0.09]}
                  >
                    <boxGeometry args={[0.045, 1.25, 0.035]} />
                    <meshBasicMaterial
                      color={i === 2 ? "#e6dbac" : "#b48762"}
                    />
                  </mesh>
                )),
              )}
              <mesh position={[0, 0.43, 0]}>
                <cylinderGeometry args={[1.12, 1.13, 0.06, 48]} />
                <meshStandardMaterial
                  color="#aa7e55"
                  metalness={0.55}
                  roughness={0.55}
                />
              </mesh>
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, 0]}>
                <torusGeometry args={[0.24, 0.025, 5, 24]} />
                <meshBasicMaterial color="#e2aa75" />
              </mesh>
            </group>
          )}
        </group>
      ))}
      <RouteLights />
    </>
  );
}

const route = [
  [-1, -5],
  [3, -14],
  [7, -10],
  [16, -12],
  [20, -14],
  [-7, -14],
  [7, 4],
];
function RouteLights() {
  const models = useMemo(() => {
    const stems: BufferGeometry[] = [],
      lamps: BufferGeometry[] = [];
    for (const [x, z] of route) {
      const ground = groundHeight(x, z);
      stems.push(
        new CylinderGeometry(0.035, 0.065, 0.55, 6).translate(
          x,
          ground + 0.25,
          z,
        ),
      );
      lamps.push(
        new CylinderGeometry(0.07, 0.07, 0.09, 8).translate(
          x,
          ground + 0.55,
          z,
        ),
      );
    }
    const body = mergeGeometries(stems),
      light = mergeGeometries(lamps);
    [...stems, ...lamps].forEach((part) => part.dispose());
    return { body, light };
  }, []);
  useEffect(
    () => () => {
      models.body.dispose();
      models.light.dispose();
    },
    [models],
  );
  return (
    <>
      <mesh geometry={models.body}>
        <meshStandardMaterial color="#505363" roughness={0.6} />
      </mesh>
      <mesh geometry={models.light}>
        <meshBasicMaterial color="#f3c58b" />
      </mesh>
    </>
  );
}

export function TravellerMarker({
  player,
  visible,
}: {
  player: RefObject<Walker>;
  visible: boolean;
}) {
  const marker = useRef<Group>(null);
  useFrame(() => {
    if (marker.current) {
      const p = player.current;
      marker.current.position.set(p.x, p.y + 0.08, p.z);
      marker.current.rotation.y = p.heading;
    }
  });
  return (
    <>
      {visible &&
        [moon.arrival, ...moon.installations].map((site) => (
          <mesh
            key={site.id}
            position={[site.x, groundHeight(site.x, site.z) + 0.12, site.z]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[1.4, 1.48, 40]} />
            <meshBasicMaterial
              color="#e9b486"
              transparent
              opacity={0.6}
              depthTest={false}
            />
          </mesh>
        ))}
      <group ref={marker} visible={visible}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.68, 0.77, 40]} />
          <meshBasicMaterial
            color="#d8c39b"
            transparent
            opacity={0.8}
            depthTest={false}
          />
        </mesh>
        <mesh position={[0, 0.03, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.22, 3]} />
          <meshBasicMaterial color="#e7e5d1" depthTest={false} />
        </mesh>
      </group>
    </>
  );
}
