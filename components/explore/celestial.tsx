import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BackSide, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, Vector3, type ShaderMaterial, type Texture } from "three";
import { sunlight } from "./lighting";

const earthDirection = new Vector3(0.08, 0.18, -1).normalize();
const earthDistance = 500;
const earthPosition = earthDirection.clone().multiplyScalar(earthDistance);
// Art-directed angular size keeps the illuminated hemisphere legible from the trail.
const earthRadius = Math.tan(Math.PI / 180 * 2.8) * earthDistance;
const solarDayRate = Math.PI * 2 / (24 * 60 * 60);
const sunDirection = new Vector3(...sunlight).normalize();

function Starfield({ catalog }: { catalog: ArrayBuffer | null }) {
  const stars = useMemo(() => {
    const bytes = new DataView(catalog ?? new ArrayBuffer(0));
    const count = Math.floor(bytes.byteLength / 8);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const light = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const offset = i * 8;
      const lon = (bytes.getUint16(offset, true) + 0.5) / 4096 * Math.PI * 2;
      const polar = (bytes.getUint16(offset + 2, true) + 0.5) / 2048 * Math.PI;
      const radius = 545 * Math.sin(polar);
      positions.set([-Math.cos(lon) * radius, 545 * Math.cos(polar), Math.sin(lon) * radius], i * 3);
      for (let channel = 0; channel < 3; channel++) colors[i * 3 + channel] = bytes.getUint8(offset + 4 + channel) / 255;
      light[i] = bytes.getUint8(offset + 7) / 255;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("magnitude", new BufferAttribute(light, 1));
    return geometry;
  }, [catalog]);
  useEffect(() => () => stars.dispose(), [stars]);
  return (
    <points geometry={stars} frustumCulled={false} rotation={[0.25, 1.78, -0.36, "ZXY"]}>
      <shaderMaterial transparent depthWrite={false} vertexColors
        vertexShader={`
          attribute float magnitude;
          varying vec3 tint;
          void main() {
            tint = color * (0.20 + magnitude * 0.66);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 1.35 + magnitude * 2.0;
          }`}
        fragmentShader={`
          varying vec3 tint;
          void main() {
            vec2 p = 2.0 * gl_PointCoord - 1.0;
            gl_FragColor = vec4(tint, exp(-3.4 * dot(p,p)));
          }`} />
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
    vec3 result = mix(ground, clouds, cover * lit * 0.94) + vec3(0.0012, 0.0024, 0.0045) * (1.0 - lit);
    result += vec3(0.10, 0.30, 0.65) * limb * smoothstep(-0.036, 0.42, daylight) * 0.63;
    gl_FragColor = vec4(result, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const skyVertex = `
  varying vec2 skyUv;
  varying vec3 direction;
  void main() {
    skyUv = uv;
    direction = mat3(modelMatrix) * position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = `
  varying vec2 skyUv;
  varying vec3 direction;
  uniform sampler2D starMap;
  uniform vec3 sun;
  void main() {
    vec3 ray = normalize(direction);
    vec3 catalog = texture2D(starMap, skyUv).rgb;
    float angle = length(ray - sun);
    float disk = 1.0 - smoothstep(0.004, 0.006, angle);
    float glare = 0.13 * exp(-angle * 33.0) + 0.29 * exp(-angle * 153.0);
    // Display-referred exposure of the catalog, separate from terrestrial PBR.
    float horizon = pow(1.0 - abs(ray.y), 5.0);
    float nebula = pow(max(0., sin(ray.x*3.3 + ray.z*2.1 + ray.y*4.6)), 5.);
    vec3 sky = mix(vec3(.013,.025,.059),vec3(.07,.125,.19),horizon*.65);
    sky += vec3(.026,.017,.047) * nebula;
    sky += pow(catalog, vec3(1.25)) * vec3(.26,.36,.56);
    gl_FragColor = vec4(sky + vec3(1.0, 0.91, 0.77) * (disk + glare), 1.0);
  }
`;

export function CelestialField({ albedo, clouds, galaxy, brightStars }: { brightStars: ArrayBuffer | null; albedo: Texture; clouds: Texture; galaxy: Texture | null }) {
  const sky = useRef<Group>(null);
  const earth = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const skyUniforms = useMemo(() => ({
    starMap: { value: galaxy }, sun: { value: sunDirection },
  }), [galaxy]);
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
      {galaxy && <mesh renderOrder={-10} rotation={[0.25, 1.78, -0.36, "ZXY"]}>
        <sphereGeometry args={[610, 60, 32]} />
        <shaderMaterial uniforms={skyUniforms} side={BackSide} depthWrite={false}
          vertexShader={skyVertex} fragmentShader={skyFragment} />
      </mesh>}
      <Starfield catalog={brightStars} />
      <group position={[-310,95,390]} rotation={[.32,0,.4]}>
        <mesh>
          <sphereGeometry args={[20,40,24]}/>
          <shaderMaterial uniforms={{ light: { value: sunDirection } }} vertexShader={earthVertex} fragmentShader={`
            uniform vec3 light;
            varying vec2 surfaceUV;
            varying vec3 worldNormal;
            varying vec3 worldPosition;
            void main(){
              float band=sin(surfaceUV.y*55.+sin(surfaceUV.x*13.)*.55)*.5+.5;
              vec3 tint=mix(vec3(.30,.30,.37),vec3(.64,.51,.39),band*.6+surfaceUV.y*.2);
              float sun=max(0.,dot(normalize(worldNormal),light));
              float limb=pow(1.-max(0.,dot(normalize(worldNormal),normalize(cameraPosition-worldPosition))),3.);
              gl_FragColor=vec4(tint*(.11+sun*.95)+vec3(.07,.11,.19)*limb,1.);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`}/>
        </mesh>
        <mesh rotation={[-Math.PI/2+.16,0,0]}>
          <ringGeometry args={[28,43,96]}/>
          <shaderMaterial transparent side={DoubleSide} depthWrite={false}
            vertexShader={`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
            fragmentShader={`varying vec3 p;void main(){float r=length(p.xy);float bands=.42+.12*sin(r*1.5)+.05*sin(r*4.);float edge=smoothstep(28.,29.,r)*(1.-smoothstep(41.,43.,r));gl_FragColor=vec4(vec3(.63,.59,.54),edge*bands*.48);}`}/>
        </mesh>
      </group>
      <mesh ref={earth} position={earthPosition} scale={earthRadius} rotation={[0.08, -0.72, -0.19]}>
        <sphereGeometry args={[1, 48, 28]} />
        <shaderMaterial ref={material} uniforms={uniforms} vertexShader={earthVertex} fragmentShader={earthFragment} />
      </mesh>
    </group>
  );
}
