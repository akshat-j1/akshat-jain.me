import { expect, test } from "@playwright/test";
import { buildCatalog, projectHref, type Project, type Retirement } from "../content/catalog";
import { moon, nearestDiscovery, relay } from "../content/worlds";

const sample: Project = {
  id: "example", slug: "entry", name: "Example", publication: "published", entry: "brief",
};
const atRelay = { destination: moon.id, installation: relay.id };
const arrival = { destination: moon.id };
const anotherWorld = { ...moon, id: "test-world", name: "Test world", installations: [] };
const load = (projects: Project[], retired: Retirement[] = []) =>
  buildCatalog(projects, retired, [moon, anotherWorld], () => false);

test("editorial changes keep identity, route and physical locations independent", () => {
  const original = { ...sample, assignments: [atRelay] };
  const extra = { ...sample, id: "second", slug: "second", name: "Second" };
  const added = load([original, extra]);
  expect(added.projects.map(p => p.id)).toEqual(["example", "second"]);
  expect(added.places.get(extra.id)).toEqual([]);
  const renamed = { ...original, name: "Renamed", assignments: [arrival, { destination: anotherWorld.id }] };
  const revised = load([{ ...extra, assignments: [atRelay] }, renamed]);
  expect(revised.projects.map(p => p.id)).toEqual(["second", "example"]);
  expect(projectHref(revised.bySlug.get("entry")!)).toBe("/work/entry");
  const points = revised.bindings.get(moon.id)!;
  expect(nearestDiscovery(points, relay.x, relay.z)?.project.name).toBe("Second");
  expect(nearestDiscovery(points, moon.arrival.x, moon.arrival.z)?.project.name).toBe("Renamed");
  expect(revised.bindings.get(anotherWorld.id)?.[0].project.href).toBe("/work/entry");
  expect(load([renamed]).bindings.get(moon.id)?.map(p => p.id)).toEqual([moon.arrival.id]);
  expect(load([]).projects).toEqual([]);
  expect(nearestDiscovery(load([]).bindings.get(moon.id)!, relay.x, relay.z)).toBeNull();
});

test("drafts, aliases and retired URLs resolve only to public canonical entries", () => {
  const catalog = load([{ ...sample, aliases: ["former"] },
    { ...sample, publication: "draft", id: "hidden", slug: "hidden", aliases: ["hidden-former"], assignments: [atRelay] }],
    [{ slug: "removed" }, { slug: "replaced", successorId: sample.id }]);
  expect([...catalog.bySlug.keys()]).toEqual(["entry"]);
  expect([...catalog.redirects]).toEqual([["former", "/work/entry"], ["removed", "/work"], ["replaced", "/work/entry"]]);
  expect(catalog.bindings.get(moon.id)).toEqual([]);
});

test("invalid editorial changes fail validation before publication", () => {
  expect(() => load([sample, { ...sample, id: "new" }])).toThrow("duplicate slug");
  expect(() => load([sample, { ...sample, slug: "new" }])).toThrow("duplicate project ID");
  expect(() => load([{ ...sample, aliases: ["entry"] }])).toThrow("duplicate slug");
  expect(() => load([sample], [{ slug: "entry" }])).toThrow("duplicate slug");
  expect(() => load([], [{ slug: "removed", successorId: "missing" }])).toThrow("Unknown published successor");
  for (const assignment of [{ destination: "missing" }, { destination: moon.id, installation: "missing" }]) {
    expect(() => load([{ ...sample, assignments: [assignment] }])).toThrow("Unknown discovery location");
  }
  expect(() => load([{ ...sample, assignments: [atRelay, atRelay] }])).toThrow("Multiple assignments");
  const screenshot = { src: "/test.webp", alt: "Test", width: 10, height: 10 };
  expect(() => load([{ ...sample, screenshots: [screenshot] }])).toThrow("missing screenshot");
});

test("unknown project URLs return a readable 404 with working history navigation", async ({ page }) => {
  // Uppercase segments are outside the catalog's permitted slug format.
  const response = await page.goto("/work/UNKNOWN");
  expect(response?.status()).toBe(404);
  await page.getByRole("link", { name: "Browse the portfolio" }).click();
  await expect(page).toHaveURL("/work");
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Project unavailable" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Portfolio", exact: true })).toBeVisible();
});
