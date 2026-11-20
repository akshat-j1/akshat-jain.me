export type DiscoveryPoint = {
  id: string;
  name: string;
  label: string;
  action: string;
  x: number;
  z: number;
  reach: number;
  demo?: string;
};

export type Destination = {
  id: string;
  name: string;
  href: string;
  arrival: DiscoveryPoint;
  installations: readonly DiscoveryPoint[];
};

import { sitePoint } from "./ferry-site";

export const ferryHatch = {
  ...sitePoint(-3.85, -0.1),
  id: "ferry",
  name: "Survey ferry",
  label: "Eastern shelf",
  action: "Inspect ferry entry",
  reach: 2.6,
  demo: "A survey ferry rests beyond the eastern rim. Walk around the hull and look back through the saddle toward the communications relay. The next journey begins here.",
};

export const relay = {
  id: "relay",
  name: "Communications relay",
  label: "Station 01",
  action: "Inspect relay",
  x: 1.7,
  z: -10,
  reach: 4.65,
  radius: 2.05,
  demo: "A listening post looking out across the basin. The dish connects this quiet outpost to an imagined network of explorers.",
};

export const artifactSites = [
  {
    id: "orrery",
    name: "Celestial Orrery",
    label: "Western overlook",
    action: "Inspect orrery",
    x: -10.8,
    z: -14,
    reach: 3.9,
    demo: "A mechanical atlas of imagined worlds. Its copper rings turn around a luminous core, tracing the paths of journeys still to come.",
  },
  {
    id: "archive",
    name: "Signal Archive",
    label: "Southern ridge",
    action: "Inspect archive",
    x: 8.8,
    z: 7,
    reach: 3.9,
    demo: "A listening station at the edge of the basin. The illuminated memory fins hold an imagined collection of signals from distant explorers.",
  },
] as const;

export const moon = {
  id: "moon",
  name: "Lunar surface",
  href: "/explore",
  arrival: {
    id: "landing",
    name: "Landing site",
    label: "Moon",
    action: "Inspect landing site",
    x: 0,
    z: 2.5,
    reach: 2.5,
  },
  installations: [relay, ferryHatch, ...artifactSites],
} satisfies Destination;

export const destinations: readonly Destination[] = [moon];

export type Discovery = DiscoveryPoint & {
  project: {
    name: string;
    href: string;
    summary?: string;
    preparing: boolean;
    demo?: boolean;
  };
};

export function nearestDiscovery(
  points: readonly Discovery[],
  x: number,
  z: number,
) {
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

// Scenic entries fill unassigned installations. Catalog assignments take precedence.
export function withScenicEntries(bindings: readonly Discovery[]): Discovery[] {
  const demos = moon.installations;
  return [
    ...bindings,
    ...demos
      .filter((site) => !bindings.some((point) => point.id === site.id))
      .map((site) => ({
        ...site,
        project: {
          name: site.name,
          href: "/experience",
          summary: site.demo,
          preparing: false,
          demo: true,
        },
      })),
  ];
}
