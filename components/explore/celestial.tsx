import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, Group, Mesh, Vector3, type PointsMaterial, type ShaderMaterial, type Texture } from "three";
import { sunlight } from "./lighting";

const earthDirection = new Vector3(0.006, 0.178, -1).normalize();
const earthDistance = 500;
const earthPosition = earthDirection.clone().multiplyScalar(earthDistance);
// A modest increase over the 1.9° mean angular diameter for the composition.
const earthRadius = Math.tan(Math.PI / 180 * 1.12) * earthDistance;
const solarDayRate = Math.PI * 2 / (24 * 60 * 60);
const sunDirection = new Vector3(...sunlight).normalize();

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Starfield() {
  const material = useRef<PointsMaterial>(null);
  const view = useMemo(() => new Vector3(), []);
  const stars = useMemo(() => {
    const random = seededRandom(42117);
    const count = 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const azimuth = random() * Math.PI * 2;
      const height = random();
      const horizontal = Math.sqrt(1 - height * height);
      positions.set([Math.cos(azimuth) * horizontal * 550, height * 550, Math.sin(azimuth) * horizontal * 550], i * 3);
      const brightness = 0.026 + random() ** 5 * 0.48;
      colors.set([brightness * 0.9, brightness * 0.94, brightness], i * 3);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return geometry;
  }, []);
  useEffect(() => () => stars.dispose(), [stars]);
  useFrame(({ camera }, delta) => {
    if (!material.current) return;
    const elevation = camera.getWorldDirection(view).y;
    const exposure = Math.max(0, Math.min(1, (elevation - 0.06) / 0.34));
    material.current.opacity += (0.18 + 0.50 * exposure - material.current.opacity) * (1 - Math.exp(-4 * delta));
  });

  return (
    <points geometry={stars} frustumCulled={false}>
      <pointsMaterial ref={material} size={1} sizeAttenuation={false} vertexColors transparent opacity={0.16} depthWrite={false} />
    </points>
  );
}

const earthVertex = `
  varying vec2 surfaceUV;
  varying vec3 worldNormal;
  varying vec3 worldPosition;

  void main() {
    surfaceUV = uv;
    worldNormal = normalize(mat3(modelMatrix) * normal);
    worldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(worldPosition, 1.0);
  }
`;

const earthFragment = `
  uniform sampler2D landMap;
  uniform sampler2D cloudMap;
  uniform float cloudDrift;
  uniform vec3 sunDirection;
  varying vec2 surfaceUV;
  varying vec3 worldNormal;
  varying vec3 worldPosition;

  void main() {
    vec3 n = normalize(worldNormal);
    vec3 v = normalize(cameraPosition - worldPosition);
    float daylight = dot(n, sunDirection);
    float lit = smoothstep(-0.022, 0.082, daylight);
    float sun = max(daylight, 0.0);
    float limb = pow(1.0 - max(0.0, dot(n, v)), 4.1);
    vec3 terrain = texture2D(landMap, surfaceUV).rgb;
    float cloud = texture2D(cloudMap, surfaceUV + vec2(cloudDrift, 0.0)).g;
    float cover = smoothstep(0.115, 0.79, cloud);
    float cloudShade = texture2D(cloudMap, surfaceUV + vec2(cloudDrift - 0.0025, 0.0011)).g;
    terrain *= 1.0 - 0.22 * cloudShade * lit;
    float ocean = smoothstep(0.028, 0.11, terrain.b - max(terrain.r, terrain.g * 1.22));
    terrain += vec3(0.005, 0.023, 0.089) * ocean;
    vec3 halfVector = normalize(v + sunDirection);
    float oceanGlint = pow(max(0.0, dot(n, halfVector)), 41.0) * ocean * sun;
    vec3 ground = terrain * (0.006 + lit * (0.51 + pow(sun, 0.69) * 1.26));
    ground += vec3(0.40, 0.54, 0.72) * oceanGlint * 0.32;
    float cloudRelief = clamp(0.90 + (cloud - cloudShade) * 0.63, 0.70, 1.13);
    vec3 clouds = vec3(0.95, 0.98, 1.0) * lit * (0.21 + 1.13 * pow(sun, 0.55)) * cloudRelief;
    vec3 result = mix(ground, clouds, cover * lit * 0.94);
    result += vec3(0.10, 0.30, 0.65) * limb * smoothstep(-0.036, 0.42, daylight) * 0.63;
    gl_FragColor = vec4(result, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function CelestialField({ albedo, clouds }: { albedo: Texture; clouds: Texture }) {
  const sky = useRef<Group>(null);
  const earth = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    landMap: { value: albedo },
    cloudMap: { value: clouds },
    sunDirection: { value: sunDirection },
    cloudDrift: { value: 0 },
  }), [albedo, clouds]);

  useFrame(({ camera }, delta) => {
    if (sky.current) sky.current.position.copy(camera.position);
    if (!earth.current) return;
    const drift = Math.min(delta, 0.1) * solarDayRate;
    earth.current.rotation.y += drift;
    const cloudDrift = material.current?.uniforms.cloudDrift;
    if (cloudDrift) cloudDrift.value = (cloudDrift.value + drift * 0.14 / (2 * Math.PI)) % 1;
  });

  return (
    <group ref={sky}>
      <Starfield />
      <mesh ref={earth} position={earthPosition} scale={earthRadius} rotation={[0.08, -0.72, -0.19]}>
        <sphereGeometry args={[1, 48, 28]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={earthVertex} fragmentShader={earthFragment} />
      </mesh>
    </group>
  );
}
