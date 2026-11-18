export function toeGroundCorrection(clearance: number, delta: number) {
  if (!Number.isFinite(clearance) || Math.abs(clearance) <= 0.015) return 0;
  const clamped = Math.max(-0.075, Math.min(0.075, clearance));
  return -clamped * (1 - Math.exp(-9 * Math.max(0, delta)));
}
