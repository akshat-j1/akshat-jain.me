import { MeshStandardMaterial, Vector2, Vector3, type Texture } from "three";
import { sunlight } from "./lighting";

const sunDirection = new Vector3(...sunlight).normalize();

export function createRegolithMaterial(albedo: Texture, normal: Texture, detail: Texture | null, craterSurface: Texture | null) {
  const material = new MeshStandardMaterial({
    color: "#f4f3f0",
    map: albedo,
    normalMap: normal,
    normalScale: new Vector2(0.64, 0.64),
    vertexColors: true,
    roughness: 0.96,
  });

  material.onBeforeCompile = (shader) => {
    if (detail) shader.uniforms.ejectaDetail = { value: detail };
    if (craterSurface) shader.uniforms.craterSurface = { value: craterSurface };
    shader.uniforms.lunarSun = { value: sunDirection };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `
        #include <common>
        attribute vec4 groundSurface;
        varying vec4 vGroundSurface;
        varying vec3 vGroundPosition;
      `)
      .replace("#include <begin_vertex>", `
        #include <begin_vertex>
        vGroundSurface = groundSurface;
        vGroundPosition = position;
      `);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `
        #include <common>
        varying vec4 vGroundSurface;
        varying vec3 vGroundPosition;
        uniform vec3 lunarSun;
        ${craterSurface ? "uniform sampler2D craterSurface;" : ""}
        ${detail ? "uniform sampler2D ejectaDetail;" : ""}
      `)
      .replace("#include <map_fragment>", `
        vec3 dust = texture2D(map, vMapUv).rgb;
        float fragments = clamp(vGroundSurface.x, 0.0, 1.0);
        float ledge = clamp(vGroundSurface.y, 0.0, 1.0);
        float hillside = smoothstep(37.0, 64.0, length(vGroundPosition.xz));

        ${craterSurface ? `
          vec3 crater = texture2D(craterSurface, vGroundPosition.xz / 600.0 + 0.5).rgb;
          vec2 tilt = crater.rg * 2.0 - 1.0;
          vec3 rockNormal = normalize(vec3(tilt.x, sqrt(max(0.001, 1.0-dot(tilt,tilt))), tilt.y));
          float regional = smoothstep(36.0, 55.0, length(vGroundPosition.xz));

          vec2 talusUV = mat2(0.8, -0.6, 0.6, 0.8) * vGroundPosition.xz * 0.033;
          vec3 talus = texture2D(map, talusUV + rockNormal.xz * 0.17).rgb;
          dust = mix(dust, talus, regional * 0.78);
        ` : ""}
        vec2 shelving = vec2(vGroundPosition.x * 0.106 - vGroundPosition.z * 0.084,
                             vGroundPosition.y * 0.47 + vGroundPosition.z * 0.067);
        float shear = 0.32 * sin(shelving.x * 1.73) + 0.16 * sin(shelving.x * 4.71 + shelving.y);
        vec2 strataUV = vec2(shelving.x, shelving.y + shear);
        ${detail ? `
          vec2 ejectaUV = mat2(0.8, 0.6, -0.6, 0.8) * vMapUv * 0.54 + vec2(0.36, 0.72);
          vec3 relief = texture2D(ejectaDetail, ejectaUV).rgb;
          vec3 rockFace = texture2D(ejectaDetail, strataUV).rgb;
          float detailFalloff = 1.0 - smoothstep(12.0, 49.0, length(vViewPosition));
          float clast = smoothstep(0.08, 0.78, relief.b) * fragments * detailFalloff;
          dust = mix(dust, vec3(0.12, 0.116, 0.108) + dust * 0.52, clast * 0.82);
          dust *= 1.0 + (rockFace.b - 0.25) * hillside * ledge * 0.31;
        ` : "float clast = fragments * 0.34;"}
        diffuseColor.rgb *= dust * mix(1.04, 1.24, ledge);
      `)
      .replace("#include <roughnessmap_fragment>", `
        #include <roughnessmap_fragment>
        roughnessFactor = 0.97 - 0.18 * max(clast, ledge);
      `)
      .replace("#include <lights_fragment_end>", `
        #include <lights_fragment_end>
        vec3 solarView = normalize(mat3(viewMatrix) * lunarSun);
        float backscatter = pow(max(0.0, dot(normalize(vViewPosition), solarView)), 9.0);
        reflectedLight.directDiffuse *= vGroundSurface.z * (0.96 + backscatter * 0.16);
        reflectedLight.directSpecular *= vGroundSurface.z;
      `)
      .replace("#include <aomap_fragment>", `
        #include <aomap_fragment>
        reflectedLight.indirectDiffuse *= vGroundSurface.w;
        reflectedLight.indirectSpecular *= vGroundSurface.w;
      `);

    if (detail) {
      shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `
        vec3 grain = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
        vec2 clastNormal = relief.rg * 2.0 - 1.0;
        grain.xy *= normalScale * mix(0.78, 1.26, fragments);
        grain.xy += mat2(0.8, -0.6, 0.6, 0.8) * clastNormal * fragments * detailFalloff * 0.53;
        grain.xy += (rockFace.rg * 2.0 - 1.0) * hillside * ledge * 0.35;
        normal = normalize(tbn * grain);
      `);
    }
    if (craterSurface) {
      shader.fragmentShader = shader.fragmentShader.replace("#include <lights_physical_fragment>", `
        // Keep fine regolith normals near the traveller. Relief in the distance
        // is resolved from the full-resolution survey instead of the coarse mesh.
        vec3 surveyed = normalize(mat3(viewMatrix) * rockNormal);
        normal = normalize(mix(normal, surveyed, regional * 0.97));
        #include <lights_physical_fragment>
      `).replace("#include <aomap_fragment>", `
        #include <aomap_fragment>
        // Survey lighting integrates terrain self-shadow and local horizon
        // occlusion at atlas resolution. Preserve dynamic shadows on the trail.
        reflectedLight.directDiffuse = mix(reflectedLight.directDiffuse,
          diffuseColor.rgb * (crater.b * crater.b * 2.6), regional);
        reflectedLight.indirectDiffuse *= 1.0 - regional;
      `);
    }
  };
  material.customProgramCacheKey = () => `regolith-${Boolean(detail)}-${Boolean(craterSurface)}`;
  return material;
}
