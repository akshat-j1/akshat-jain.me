export const qualityTiers = {
  high: { dpr: 1.55, shadows: 1024, subdivisions: 182, rocks: 820 },
  balanced: { dpr: 1.2, shadows: 768, subdivisions: 132, rocks: 620 },
  lite: { dpr: 1, shadows: 0, subdivisions: 86, rocks: 350 },
};

export type Quality = keyof typeof qualityTiers;
export type QualityMode = "auto" | Quality;

export function initialQuality(gl: WebGL2RenderingContext): Quality {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (gl.getParameter(gl.MAX_TEXTURE_SIZE) < 4096 || (memory !== undefined && memory <= 2)) return "lite";
  return "balanced";
}

export function lowerQuality(quality: Quality): Quality {
  return quality === "high" ? "balanced" : "lite";
}
