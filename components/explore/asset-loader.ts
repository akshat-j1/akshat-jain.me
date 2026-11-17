import { Mesh, MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { lunarAssets } from "./assets";
import { clearElevationGrid, installBasinGrid, installElevationGrid, installRegionalGrid, installTrailGrid } from "./simulation";

export type SurfaceAssets = {
  astronaut: GLTF;
  rocks: (GLTF | null)[];
  faultRock: Texture | null;
  galaxy: Texture | null;
  brightStars: ArrayBuffer | null;
  soil: Texture;
  normal: Texture;
  ejecta: Texture | null;
  craterSurface: Texture | null;
  earth: Texture;
  earthClouds: Texture;
};

async function loadElevation(path: string, signal: AbortSignal, format: "luma" | "rg" | "rg-and-mask" = "luma") {
  const response = await fetch(path, { signal });
  if (!response.ok) throw new Error("Lunar elevation data unavailable");
  const bitmap = await createImageBitmap(await response.blob(), { colorSpaceConversion: "none" });
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Lunar elevation data could not be decoded");
    context.drawImage(bitmap, 0, 0);
    const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const packed = format !== "luma";
    const values = packed ? new Uint16Array(bitmap.width * bitmap.height) : new Uint8Array(bitmap.width * bitmap.height);
    const mask = format === "rg-and-mask" ? new Uint8Array(values.length) : undefined;
    for (let i = 0; i < values.length; i++) {
      values[i] = packed ? rgba[i * 4] * 256 + rgba[i * 4 + 1] : rgba[i * 4];
      if (mask) mask[i] = rgba[i * 4 + 2];
    }
    return { width: bitmap.width, height: bitmap.height, values, mask };
  } finally {
    bitmap.close();
  }
}

function disposeModel(gltf: GLTF) {
  gltf.scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) {
          value.dispose();
          if (typeof ImageBitmap !== "undefined" && value.image instanceof ImageBitmap) value.image.close();
        }
      }
      material.dispose();
    }
  });
}

export function disposeSurfaceAssets(assets: SurfaceAssets) {
  disposeModel(assets.astronaut);
  for (const rock of assets.rocks) if (rock) disposeModel(rock);
  assets.galaxy?.dispose();
  assets.faultRock?.dispose();
  assets.soil.dispose();
  assets.normal.dispose();
  assets.ejecta?.dispose();
  assets.craterSurface?.dispose();
  assets.earth.dispose();
  assets.earthClouds.dispose();
  clearElevationGrid();
}

export async function loadSurfaceAssets(signal: AbortSignal): Promise<SurfaceAssets> {
  const textures = new TextureLoader();
  const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const loadModel = async (url: string) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error("Model unavailable");
    return gltf.parseAsync(await response.arrayBuffer(), "/lunar/");
  };
  const [astronaut, soil, normal, earth, earthClouds, elevation, regional, ejecta, basin, craterSurface, galaxy, scan02, scan05, starCatalog, faultRock, trail] = await Promise.allSettled([
    loadModel(lunarAssets.astronaut),
    textures.loadAsync(lunarAssets.soil),
    textures.loadAsync(lunarAssets.soilNormal),
    textures.loadAsync(lunarAssets.earth),
    textures.loadAsync(lunarAssets.earthClouds),
    loadElevation(lunarAssets.elevation, signal),
    loadElevation(lunarAssets.regionalElevation, signal, "rg"),
    textures.loadAsync(lunarAssets.ejectaDetail),
    loadElevation(lunarAssets.basinElevation, signal, "rg-and-mask"),
    textures.loadAsync(lunarAssets.craterSurface),
    textures.loadAsync(lunarAssets.galaxy),
    loadModel(lunarAssets.rock02),
    loadModel(lunarAssets.rock05),
    fetch(lunarAssets.starCatalog, { signal }).then(response => {
      if (!response.ok) throw new Error("Star catalog unavailable");
      return response.arrayBuffer();
    }),
    textures.loadAsync(lunarAssets.faultRock),
    loadElevation(lunarAssets.trail, signal),
  ]);

  if (signal.aborted || astronaut.status !== "fulfilled" || soil.status !== "fulfilled" || normal.status !== "fulfilled"
    || earth.status !== "fulfilled" || earthClouds.status !== "fulfilled" || elevation.status !== "fulfilled"
    || regional.status !== "fulfilled") {
    for (const model of [astronaut, scan02, scan05]) if (model.status === "fulfilled") disposeModel(model.value);
    for (const texture of [soil, normal, earth, earthClouds, ejecta, craterSurface, galaxy, faultRock]) {
      if (texture.status === "fulfilled") texture.value.dispose();
    }
    throw new Error("Lunar assets unavailable");
  }

  if (trail.status === "fulfilled") installTrailGrid(trail.value);
  installElevationGrid(elevation.value);
  installRegionalGrid(regional.value);
  if (basin.status === "fulfilled") installBasinGrid(basin.value);
  const topography = craterSurface.status === "fulfilled" ? craterSurface.value : null;
  if (topography) {
    topography.flipY = false;
    topography.anisotropy = 4;
  }
  if (basin.status !== "fulfilled") topography?.dispose();
  soil.value.colorSpace = earth.value.colorSpace = SRGBColorSpace;
  earthClouds.value.colorSpace = NoColorSpace;
  const detail = ejecta.status === "fulfilled" ? ejecta.value : null;
  const bedrock = faultRock.status === "fulfilled" ? faultRock.value : null;
  for (const texture of [soil.value, normal.value, detail, bedrock]) {
    if (!texture) continue;
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.anisotropy = 4;
  }

  astronaut.value.scene.traverse((node) => {
    if (node instanceof Mesh) {
      node.castShadow = true;
      node.frustumCulled = false;
      if (node.material instanceof MeshStandardMaterial) {
        node.material.roughness = 0.94;
        node.material.metalness = 0.04;
      }
    }
  });

  earth.value.anisotropy = 8;
  earthClouds.value.anisotropy = 8;
  earth.value.wrapS = RepeatWrapping;
  earthClouds.value.wrapS = RepeatWrapping;
  return {
    astronaut: astronaut.value,
    faultRock: bedrock,
    brightStars: starCatalog.status === "fulfilled" ? starCatalog.value : null,
    galaxy: galaxy.status === "fulfilled" ? galaxy.value : null,
    rocks: [scan02, scan05].map((result) => result.status === "fulfilled" ? result.value : null),
    soil: soil.value,
    normal: normal.value,
    ejecta: detail,
    craterSurface: basin.status === "fulfilled" ? topography : null,
    earth: earth.value,
    earthClouds: earthClouds.value,
  };
}
