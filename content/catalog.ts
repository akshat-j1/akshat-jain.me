import type { Destination, Discovery, DiscoveryPoint } from "./worlds";

type Assignment = { destination: string; installation?: string };
export type Project = {
  id: string;
  slug: string;
  name: string;
  publication: "published" | "draft";
  entry: "in-preparation" | "brief" | "case-study";
  status?: string;
  featured?: boolean;
  summary?: string;
  presentation?: {
    category: string;
    title: string;
    hook: string;
    visual: "image" | "weather-study" | "language-study";
    caption: string;
    overlay?: { top: string; title: string; bottom: string };
    study?: {
      label: string;
      heading?: string;
      emphasis?: string;
      footer?: string;
      details?: readonly string[];
      scale?: readonly string[];
    };
    cover?: { src: string; alt: string; width: number; height: number };
  };
  technologies?: readonly string[];
  screenshots?: readonly {
    src: string;
    alt: string;
    width: number;
    height: number;
    credit?: string;
  }[];
  links?: readonly { label: string; href: string }[];
  sections?: readonly { heading: string; paragraphs: readonly string[] }[];
  aliases?: readonly string[];
  assignments?: readonly Assignment[];
};
export type Retirement = { slug: string; successorId?: string };
export const projectHref = (project: Project) => `/work/${project.slug}`;

function reserve(keys: Set<string>, key: string, kind: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key) || keys.has(key)) {
    throw new Error(`Invalid or duplicate ${kind}: ${key}`);
  }
  keys.add(key);
}

export function buildCatalog(records: readonly Project[], retirements: readonly Retirement[],
  worlds: readonly Destination[], hasMedia: (src: string) => boolean) {
  const projects = records.filter(project => project.publication === "published");
  const bySlug = new Map(projects.map(project => [project.slug, project]));
  const redirects = new Map<string, string>();
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const worldIds = new Set<string>();
  const bindings = new Map<string, Discovery[]>();
  const places = new Map<string, { world: Destination; point: DiscoveryPoint }[]>();

  for (const world of worlds) {
    reserve(worldIds, world.id, "destination");
    const points = new Set<string>();
    for (const point of [world.arrival, ...world.installations]) reserve(points, point.id, "discovery point");
    bindings.set(world.id, []);
  }
  for (const project of records) {
    reserve(ids, project.id, "project ID");
    reserve(slugs, project.slug, "slug");
    for (const alias of project.aliases ?? []) {
      reserve(slugs, alias, "slug");
      if (project.publication === "published") redirects.set(alias, projectHref(project));
    }
    for (const image of [...(project.screenshots ?? []), ...(project.presentation?.cover ? [project.presentation.cover] : [])]) {
      if (!/^\/(?:[\w-]+\/)*[\w.-]+\.(?:avif|webp|jpe?g|png)$/i.test(image.src) ||
        !image.alt.trim() || !(image.width > 0 && image.height > 0) || !hasMedia(image.src)) {
        throw new Error(`Invalid or missing screenshot for ${project.id}: ${image.src}`);
      }
    }
    for (const link of project.links ?? []) {
      if (!/^https?:\/\//i.test(link.href) || !link.label.trim()) throw new Error(`Invalid link for ${project.id}`);
    }
    const locations = [];
    for (const assignment of project.assignments ?? []) {
      const world = worlds.find(item => item.id === assignment.destination);
      const point = assignment.installation === undefined ? world?.arrival :
        world?.installations.find(item => item.id === assignment.installation);
      if (!world || !point) throw new Error(`Unknown discovery location for ${project.id}`);
      if (project.publication === "draft") continue;
      const active = bindings.get(world.id)!;
      if (active.some(item => item.id === point.id)) throw new Error(`Multiple assignments at ${world.id}/${point.id}`);
      locations.push({ world, point });
      active.push({ ...point, project: { name: project.name, href: projectHref(project),
        summary: project.summary, preparing: project.entry === "in-preparation" } });
    }
    places.set(project.id, locations);
  }
  for (const retired of retirements) {
    reserve(slugs, retired.slug, "slug");
    const successor = projects.find(project => project.id === retired.successorId);
    if (retired.successorId !== undefined && !successor) throw new Error(`Unknown published successor for ${retired.slug}`);
    redirects.set(retired.slug, successor ? projectHref(successor) : "/work");
  }
  return { projects, bySlug, redirects, bindings, places };
}
