// Metre-scale layout in the lunar world's XZ plane. The ferry faces down its local +Z axis.
export const ferrySite = { x: 24, z: -10.5, yaw: -0.40 };
export const footPads = [-1, 1].flatMap(side =>
  [-1, 1].map(end => ({ x: side * 2.78, z: end * 2.85 })));

export function sitePoint(x: number, z: number) {
  const c = Math.cos(ferrySite.yaw), s = Math.sin(ferrySite.yaw);
  return { x: ferrySite.x + c * x + s * z, z: ferrySite.z - s * x + c * z };
}

export const ferryObstacles = [
  ...[-2.75, -1.1, 0.65, 2.45].map(z => ({ ...sitePoint(0, z), radius: 2.34, height: 4.5 })),
  ...footPads.map(p => ({ ...sitePoint(p.x, p.z), radius: 0.55, height: 1.5 })),
  { ...sitePoint(-3, 0.6), radius: 0.83, height: 1.85 },
];

// The two cleaved shoulders flank different sides of the path. Their long
// axes follow the strike of the same oblique outcrop.
export const rimBlocks = [
  { x: 10.8, z: -6.2, radius: 2.30, height: 3.1, angle: -.70 },
  { x: 12.9, z: -4.1, radius: 1.68, height: 2.5, angle: -.55 },
  { x: 13.1, z: -17.3, radius: 1.90, height: 2.25, angle: -.74 },
  { x: 15.1, z: -18.6, radius: 1.23, height: 1.55, angle: -.62 },
];
