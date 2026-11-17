export type DiscoveryPoint = {
  id: string;
  name: string;
  label: string;
  action: string;
  x: number;
  z: number;
  reach: number;
};

export type Destination = {
  id: string;
  name: string;
  href: string;
  arrival: DiscoveryPoint;
  installations: readonly DiscoveryPoint[];
};

export const relay = {
  id: "relay", name: "Communications relay", label: "Station 01", action: "Inspect relay",
  x: 1.7, z: -10, reach: 4.65, radius: 2.05,
};

export const moon = {
  id: "moon", name: "Lunar surface", href: "/explore",
  arrival: { id: "landing", name: "Landing site", label: "Moon", action: "Inspect landing site", x: 0, z: 2.5, reach: 2.5 },
  installations: [relay],
} satisfies Destination;

export const destinations: readonly Destination[] = [moon];

export type Discovery = DiscoveryPoint & {
  project: { name: string; href: string; summary?: string; preparing: boolean };
};

export function nearestDiscovery(points: readonly Discovery[], x: number, z: number) {
  let nearest: Discovery | null = null;
  let best = Infinity;
  for (const point of points) {
    const squared = (x - point.x) ** 2 + (z - point.z) ** 2;
    if (squared < point.reach ** 2 && squared < best) {
      best = squared;
      nearest = point;
    }
  }
  return nearest;
}
