import { useEffect, useMemo } from "react";
import {
  BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, CylinderGeometry,
  DoubleSide, ExtrudeGeometry, LatheGeometry, Shape, Quaternion, SRGBColorSpace, Vector2, Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ferrySite, footPads, sitePoint } from "../../content/ferry-site";
import { groundHeight } from "./simulation";

type Point = [number, number, number];

// Four enamel panel finishes share a small atlas. The seams, captive screws,
// service covers and stencil stay legible at the hatch without extra meshes.
function hullFinish() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  for (let tile = 0; tile < 4; tile++) {
    ctx.save();
    ctx.translate(tile % 2 * 512, Math.floor(tile / 2) * 256);
    ctx.fillStyle = ["#cac4b4", "#d7d2c3", "#d5d1c6", "#b8b4a9"][tile];
    ctx.fillRect(0, 0, 512, 256);
    const wash = ctx.createLinearGradient(0, 0, 64, 256);
    wash.addColorStop(0, "rgba(255,255,255,.18)");
    wash.addColorStop(.8, "rgba(142,133,113,.04)");
    wash.addColorStop(1, "rgba(63,52,45,.19)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "#716e65";
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 510, 254);
    for (const x of [14, 256, 498]) for (const y of [13, 243]) {
      ctx.fillStyle = "#817d71";
      ctx.fillRect(x, y, 4, 3);
    }
    if (tile === 2) {
      ctx.fillStyle = "#423f3a";
      ctx.font = "600 40px sans-serif";
      ctx.fillText("01", 38, 159);
      ctx.font = "15px sans-serif";
      ctx.fillText("LUNAR  /  SURVEY", 39, 183);
      ctx.fillStyle = "#ac7046";
      ctx.fillRect(38, 100, 67, 5);
    }
    if (tile === 3) {
      ctx.strokeRect(325, 75, 130, 78);
      ctx.fillStyle = "#757167";
      for (let i = 0; i < 6; i++) ctx.fillRect(345, 89 + i * 9, 90, 3);
    }
    ctx.restore();
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Cross sections share the same chines. Narrowing and shifting the upper
// stations aft gives the ferry a raked windscreen and a broad heat shield.
const chines = [
  [-.70, -1], [.70, -1], [1, -.73], [1, -.22], [1, .23], [.87, .65],
  [.50, .93], [0, 1], [-.50, .93], [-.87, .65], [-1, .23], [-1, -.22], [-1, -.73],
];
const stations = [
  [1.02, 1.60, 3.54, -.12], [1.37, 2.05, 4.12, 0], [1.66, 2.36, 4.52, 0],
  [2.45, 2.46, 4.54, -.06], [2.54, 2.43, 4.46, -.09], [3.24, 2.13, 3.65, -.34],
  [3.38, 2.07, 3.49, -.39], [3.94, 1.51, 2.70, -.57], [4.02, 1.30, 2.44, -.59],
];
function buildFerry() {
  const skin: number[] = [], glass: number[] = [], glassUV: number[] = [], uv: number[] = [], metal: BufferGeometry[] = [];
  function colored(geometry: BufferGeometry, shade: string) {
    const mesh = geometry.index ? geometry.toNonIndexed() : geometry;
    if (mesh !== geometry) geometry.dispose();
    mesh.deleteAttribute("uv");
    const color = new Color(shade);
    const colors = new Float32Array(mesh.attributes.position.count * 3);
    for (let i = 0; i < colors.length; i += 3) color.toArray(colors, i);
    mesh.setAttribute("color", new BufferAttribute(colors, 3));
    metal.push(mesh);
  }
  function box(position: Point, size: Point, shade: string) {
    colored(new BoxGeometry(...size).translate(...position), shade);
  }
  function tube(a: Point, b: Point, radius: number, shade: string, radiusAtEnd = radius) {
    const start = new Vector3(...a), end = new Vector3(...b);
    const axis = end.clone().sub(start);
    const part = new CylinderGeometry(radiusAtEnd, radius, axis.length(), 10);
    part.applyQuaternion(new Quaternion().setFromUnitVectors(up, axis.normalize()));
    part.translate(...start.lerp(end, 0.5).toArray());
    colored(part, shade);
  }
  function face(corners: Point[], tile: number, shade?: string) {
    const order = [0, 1, 2, 0, 2, 3];
    const coords = order.flatMap(i => corners[i]);
    if (shade) {
      const face = new BufferGeometry();
      face.setAttribute("position", new BufferAttribute(new Float32Array(coords), 3));
      face.computeVertexNormals();
      colored(face, shade);
    } else {
      skin.push(...coords);
      const left = tile % 2 * .5, top = 1 - Math.floor(tile / 2) * .5;
      const pixels = [[left+.5, top-.5], [left+.5, top], [left, top], [left, top-.5]];
      for (const i of order) uv.push(...pixels[i]);
    }
  }
  const rings = stations.map(([y, width, length, offset]) =>
    chines.map(([x, z]): Point => [x * width, y, z * length + offset]));
  for (let level = 0; level < rings.length - 1; level++) {
    for (let i = 0; i < chines.length; i++) {
      const next = (i + 1) % chines.length;
      const corners = [rings[level][i], rings[level+1][i], rings[level+1][next], rings[level][next]];
      const window = level === 4 && i >= 3 && i <= 10;
      let shade: string | undefined;
      if (level <= 1) shade = level === 0 ? "#3e3c39" : "#807768";
      else if (level === 3) shade = "#5b5148";
      const tile = level === 2 && (i === 9 || i === 3) ? 2 : level === 2 && i === 12 ? 3 : (i + level) % 2;
      if (window) {
        for (const index of [0, 1, 2, 0, 2, 3]) {
          glass.push(...corners[index]);
          glassUV.push(index >= 2 ? 1 : 0, index === 1 || index === 2 ? 1 : 0);
        }
        tube(corners[0], corners[1], .034, "#aca99e");
      } else face(corners, tile, shade);
    }
  }
  const roof = rings[rings.length-1];
  for (let i = 0; i < roof.length; i++) {
    const j = (i+1)%roof.length;
    for (const [vertices, tint] of [
      [[roof[i], [0,4.05,-.62], roof[j]], "#c9c5b9"],
      [[rings[0][j], [0,.92,-.12], rings[0][i]], "#494744"],
    ] as const) {
      const panel = new BufferGeometry();
      panel.setAttribute("position", new BufferAttribute(new Float32Array(vertices.flat()),3));
      panel.computeVertexNormals();
      colored(panel,tint);
    }
  }

  const padHeights = footPads.map(p => {
    const world = sitePoint(p.x, p.z);
    return groundHeight(world.x, world.z);
  });
  const base = Math.max(...padHeights) - .05;
  footPads.forEach((p, i) => {
    const y = padHeights[i] - base;
    const sx = Math.sign(p.x), sz = Math.sign(p.z);
    const foot: Point = [p.x, y + .13, p.z];
    const knee: Point = [p.x - sx * .23, y + .53, p.z - sz * .17];
    tube([p.x,y-.06,p.z], foot, .48, "#534d43", .37);
    tube(foot, knee, .093, "#b8b8ae");
    tube(knee, [sx*1.87,1.55,sz*2.30], .155, "#af7752", .22);
    tube(foot, [sx*1.18,1.11,sz*1.69], .079, "#777368");
    tube(foot, [sx*1.55,1.18,sz*3.36], .068, "#655e54");
  });
  // Two aft engine bells, their throat rings, and a louvered heat exchanger.
  for (const x of [-.76, .76]) {
    tube([x,1.73,-3.76],[x,1.70,-4.17],.38,"#77766e",.32);
    const bell = new LatheGeometry([
      new Vector2(.26,0), new Vector2(.31,.13), new Vector2(.49,.43),
      new Vector2(.50,.46), new Vector2(.45,.46), new Vector2(.23,.10),
    ], 24);
    colored(bell.rotateX(-Math.PI/2).translate(x,1.70,-4.17), "#696159");
  }
  box([0,4.06,-1.35],[1.44,.08,1.43],"#706e64");
  for (let i=0; i<12; i++) box([0,4.12,-1.95+i*.11],[1.35,.052,.062],"#a7a599");
  // Extruded octagonal frames follow the shadow line around the pressure seal.
  function hatchPlate(x: number, y: number, width: number, height: number, cut: number, shade: string) {
    const w=width/2, h=height/2;
    const outline = new Shape();
    outline.moveTo(-w+cut,-h);
    for (const [u,v] of [[w-cut,-h],[w,-h+cut],[w,h-cut],[w-cut,h],[-w+cut,h],[-w,h-cut],[-w,-h+cut]]) {
      outline.lineTo(u,v);
    }
    outline.closePath();
    const part = new ExtrudeGeometry(outline, {depth:.028, bevelEnabled:true, bevelSegments:1,
      steps:1, bevelSize:.018, bevelThickness:.012});
    colored(part.rotateY(-Math.PI/2).translate(x,y,-.10), shade);
  }
  hatchPlate(-2.45,2.23,1.32,1.85,.20,"#a79d88");
  hatchPlate(-2.51,2.23,1.20,1.75,.18,"#393b38");
  hatchPlate(-2.56,2.23,1.07,1.60,.16,"#b5b1a3");
  hatchPlate(-2.61,2.58,.73,.52,.10,"#5d5e57");
  hatchPlate(-2.66,2.58,.63,.42,.08,"#243845");
  for (const y of [1.69,2.80]) box([-2.63,y,-.59],[.095,.18,.10],"#706b62");
  box([-2.64,2.06,.19],[.09,.048,.26],"#6b6255");
  for(const sign of [-1,1]) {
    tube([sign*1.67,1.53,-2.28],[sign*2.11,1.00,-2.57],.19,"#655d53",.156);
  }
  const landing = sitePoint(-3.73,-.10);
  const low = groundHeight(landing.x,landing.z) - base + .10;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    box([-3.73 + t*1.17, low + t*(1.35-low), -.10], [.30,.073,1.05], "#7b7467");
  }
  for (const z of [-.67,.47]) {
    tube([-3.75,low,z],[-2.54,1.34,z],.062,"#574e42");
    tube([-3.62,low+.12,z],[-3.62,low+.78,z],.032,"#b48155");
    tube([-3.62,low+.78,z],[-2.56,2.21,z],.036,"#c08b59");
  }
  const plating = new BufferGeometry();
  plating.setAttribute("position", new BufferAttribute(new Float32Array(skin),3));
  plating.setAttribute("uv", new BufferAttribute(new Float32Array(uv),2));
  plating.computeVertexNormals();
  const canopy = new BufferGeometry();
  canopy.setAttribute("position", new BufferAttribute(new Float32Array(glass),3));
  canopy.setAttribute("uv", new BufferAttribute(new Float32Array(glassUV),2));
  canopy.computeVertexNormals();
  const hardware = mergeGeometries(metal)!;
  metal.forEach(piece => piece.dispose());
  return { plating, canopy, hardware, base, texture: hullFinish() };
}

const up = new Vector3(0,1,0);

export function SurveyFerry({ onInspect }: { onInspect?: () => void }) {
  const model = useMemo(() => buildFerry(), []);
  useEffect(() => () => {
    model.plating.dispose();
    model.hardware.dispose();
    model.canopy.dispose();
    model.texture.dispose();
  }, [model]);
  return <group onClick={onInspect ? event => { if (event.delta <= 5) onInspect(); } : undefined} position={[ferrySite.x, model.base, ferrySite.z]} rotation={[0,ferrySite.yaw,0]}>
    <mesh geometry={model.plating} castShadow receiveShadow>
      <meshStandardMaterial map={model.texture} side={DoubleSide} roughness={.61} metalness={.14} />
    </mesh>
    <mesh geometry={model.canopy}>
      <shaderMaterial side={DoubleSide}
        vertexShader={`
          varying vec3 surface;
          varying vec3 faceNormal;
          varying vec2 pane;
          void main() {
            pane = uv;
            surface = (modelMatrix * vec4(position, 1.)).xyz;
            faceNormal = mat3(modelMatrix) * normal;
            gl_Position = projectionMatrix * viewMatrix * vec4(surface,1.);
          }`}
        fragmentShader={`
          varying vec3 surface;
          varying vec3 faceNormal;
          varying vec2 pane;
          void main() {
            vec3 n = normalize(faceNormal + vec3(0.,(pane.y-.5)*.57,0.));
            vec3 eye = normalize(cameraPosition - surface);
            vec3 ray = reflect(-eye,n);
            float ridge = .11 + .045*sin(ray.x*13. + ray.z*8.) + .023*cos(ray.z*29.);
            float land = 1. - smoothstep(ridge-.02, ridge+.025, ray.y);
            float fresnel = pow(1.-abs(dot(eye,n)),2.);
            vec3 sky = mix(vec3(.065,.10,.14),vec3(.009,.019,.034),smoothstep(.04,.70,ray.y));
            vec3 soil = mix(vec3(.10,.09,.074),vec3(.22,.20,.17),smoothstep(-.65,.12,ray.y));
            vec3 reflection = mix(sky,soil,land);
            reflection += vec3(.11,.16,.17)*exp(-4.*abs(ray.y-ridge)) + vec3(.13,.095,.056)*pow(max(0.,dot(ray,normalize(vec3(-45.,12.,24.)))),12.);
            float rim = min(min(pane.x,1.-pane.x),min(pane.y,1.-pane.y));
            float gasket = smoothstep(.008,.026,rim);
            float glint = exp(-95.*abs(rim-.032));
            vec3 tint = mix(vec3(.009,.016,.019),reflection,.52+.46*fresnel);
            tint += vec3(.04,.063,.068)*pow(1.-pane.y,4.);
            gl_FragColor = vec4(mix(vec3(.017),tint,gasket)+vec3(.11,.12,.12)*glint,1.);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`} />
    </mesh>
    <mesh geometry={model.hardware} castShadow receiveShadow>
      <meshStandardMaterial vertexColors side={DoubleSide} roughness={.46} metalness={.31} />
    </mesh>
  </group>;
}
