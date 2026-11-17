import { Mesh, MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, Texture, TextureLoader } from "three";
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { lunarAssets } from "./assets";
import { clearElevationGrid, installElevationGrid, installRegionalGrid } from "./simulation";

export type SurfaceAssets = {
  astronaut: GLTF;
  soil: Texture;
  normal: Texture;
  earth: Texture;
  earthClouds: Texture;
};

async function loadElevation(path: string, signal: AbortSignal, packed = false) {
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
    const values = packed ? new Uint16Array(bitmap.width * bitmap.height) : new Uint8Array(bitmap.width * bitmap.height);
    for (let i = 0; i < values.length; i++) {
      values[i] = packed ? rgba[i * 4] * 256 + rgba[i * 4 + 1] : rgba[i * 4];
    }
    return { width: bitmap.width, height: bitmap.height, values };
  } finally {
    bitmap.close();
  }
}

function disposeAstronaut(gltf: GLTF) {
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
  disposeAstronaut(assets.astronaut);
  assets.soil.dispose();
  assets.normal.dispose();
  assets.earth.dispose();
  assets.earthClouds.dispose();
  clearElevationGrid();
}

export async function loadSurfaceAssets(signal: AbortSignal): Promise<SurfaceAssets> {
  const textures = new TextureLoader();
  const gltf = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const [astronaut, soil, normal, earth, earthClouds, elevation, regional] = await Promise.allSettled([
    fetch(lunarAssets.astronaut, { signal }).then(async (response) => {
      if (!response.ok) throw new Error("Spacesuit unavailable");
      return gltf.parseAsync(await response.arrayBuffer(), "/lunar/");
    }),
    textures.loadAsync(lunarAssets.soil),
    textures.loadAsync(lunarAssets.soilNormal),
    textures.loadAsync(lunarAssets.earth),
    textures.loadAsync(lunarAssets.earthClouds),
    loadElevation(lunarAssets.elevation, signal),
    loadElevation(lunarAssets.regionalElevation, signal, true),
  ]);

  if (signal.aborted || astronaut.status !== "fulfilled" || soil.status !== "fulfilled" || normal.status !== "fulfilled"
    || earth.status !== "fulfilled" || earthClouds.status !== "fulfilled" || elevation.status !== "fulfilled"
    || regional.status !== "fulfilled") {
    if (astronaut.status === "fulfilled") disposeAstronaut(astronaut.value);
    for (const texture of [soil, normal, earth, earthClouds]) {
      if (texture.status === "fulfilled") texture.value.dispose();
    }
    throw new Error("Lunar assets unavailable");
  }

  installElevationGrid(elevation.value);
  installRegionalGrid(regional.value);
  soil.value.colorSpace = earth.value.colorSpace = SRGBColorSpace;
  earthClouds.value.colorSpace = NoColorSpace;
  for (const texture of [soil.value, normal.value]) {
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
    soil: soil.value,
    normal: normal.value,
    earth: earth.value,
    earthClouds: earthClouds.value,
  };
}
