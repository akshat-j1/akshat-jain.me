import { MeshStandardMaterial, Vector2, type Texture } from "three";

export function createRegolithMaterial(albedo: Texture, normal: Texture, detailed: boolean) {
  const material = new MeshStandardMaterial({
    color: "#eeedeb",
    map: albedo,
    normalMap: normal,
    normalScale: new Vector2(0.65, 0.65),
    vertexColors: true,
    roughness: 0.93,
  });

  material.onBeforeCompile = (shader) => {
    const diffuse = detailed ? `
      vec2 aggregateUV = mat2(0.8, 0.6, -0.6, 0.8) * vMapUv * 0.19 + vec2(0.36, 0.72);
      vec3 fineGrain = texture2D(map, vMapUv).rgb;
      vec3 aggregate = texture2D(map, aggregateUV).rgb;
      vec3 localAlbedo = mix(fineGrain, fineGrain * (0.62 + aggregate * 1.85), 0.67);
      diffuseColor.rgb *= localAlbedo;
    ` : `
      vec3 localAlbedo = texture2D(map, vMapUv).rgb;
      diffuseColor.rgb *= localAlbedo;
    `;

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <map_fragment>", diffuse)
      .replace("#include <roughnessmap_fragment>", `
        #include <roughnessmap_fragment>
        roughnessFactor = mix(1.0, 0.84, clamp(localAlbedo.r * 2.5, 0.0, 1.0));
      `);

    if (detailed) {
      shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", `
        vec3 grain = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
        vec3 aggregateNormal = texture2D(normalMap, aggregateUV).xyz * 2.0 - 1.0;
        grain.xy += 0.43 * mat2(0.8, -0.6, 0.6, 0.8) * aggregateNormal.xy;
        grain.xy *= normalScale;
        normal = normalize(tbn * grain);
      `);
    }
  };
  material.customProgramCacheKey = () => detailed ? "regolith-layered" : "regolith-lite";
  return material;
}
