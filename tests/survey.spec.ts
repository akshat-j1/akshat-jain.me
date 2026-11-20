import { expect, test } from "@playwright/test";
import { observeExplorer, travellerPose } from "./scene-probe";
import { buildCatalog } from "../content/catalog";
import { destinations, moon, withScenicEntries } from "../content/worlds";

test("scenic demos survive empty catalogs and assignments replace their content", () => {
  const empty = withScenicEntries([]);
  expect(empty.find((point) => point.id === "orrery")?.project.demo).toBe(true);
  const assigned = buildCatalog(
    [
      {
        id: "temporary",
        slug: "temporary",
        name: "Temporary test record",
        publication: "published",
        entry: "brief",
        assignments: [
          { destination: "moon", installation: "orrery" },
          { destination: "moon", installation: "archive" },
        ],
      },
    ],
    [],
    destinations,
    () => true,
  );
  const resolved = withScenicEntries(assigned.bindings.get(moon.id)!);
  expect(resolved.filter((point) => point.id === "orrery")).toHaveLength(1);
  expect(resolved.find((point) => point.id === "orrery")?.project.name).toBe(
    "Temporary test record",
  );
  expect(
    resolved.find((point) => point.id === "orrery")?.project.demo,
  ).toBeUndefined();
  expect(empty.find((point) => point.id === "ferry")?.project.demo).toBe(true);
});

test("jump, orbital return and map coordinate their inputs without moving the traveller", async ({
  page,
}) => {
  await observeExplorer(page);
  await page.goto("/explore");
  await expect(
    page.getByRole("button", { name: "World overview", exact: true }),
  ).toBeVisible();
  const original = (await travellerPose(page))!;
  await page.keyboard.press("Space");
  await expect
    .poll(async () => (await travellerPose(page))?.grounded)
    .toBe(false);
  await page.keyboard.down("w");
  await page.waitForTimeout(400);
  await page.keyboard.up("w");
  const air = (await travellerPose(page))!;
  expect(air.y).toBeGreaterThan(original.y + 0.6);
  expect(air.cameraY).toBeGreaterThan(original.cameraY);
  await page.keyboard.press("Space");
  await expect
    .poll(async () => (await travellerPose(page))?.grounded, { timeout: 5000 })
    .toBe(true);

  await page.waitForTimeout(500);
  await page.keyboard.press("KeyO");
  const held = (await travellerPose(page))!;
  await page.keyboard.down("w");
  await page.waitForTimeout(800);
  await page.keyboard.up("w");
  const overview = (await travellerPose(page))!;
  expect(overview.x).toBeCloseTo(held.x, 5);
  expect(overview.z).toBeCloseTo(held.z, 5);
  expect(overview.cameraY).toBeGreaterThan(held.cameraY + 15);
  await page.keyboard.press("ArrowLeft");
  await page.getByRole("button", { name: "Return to Exploration" }).click();
  await page.waitForTimeout(900);
  expect((await travellerPose(page))!.x).toBeCloseTo(held.x, 5);

  await page.keyboard.down("w");
  await page.waitForTimeout(150);
  await page.keyboard.press("KeyM");
  await expect(
    page.getByRole("dialog", { name: "Find your next horizon." }),
  ).toBeVisible();
  const mapped = (await travellerPose(page))!;
  await page.waitForTimeout(300);
  expect((await travellerPose(page))!.z).toBe(mapped.z);
  await page.keyboard.up("w");
  await page.getByRole("button", { name: "Select Survey ferry" }).click();
  await page.getByRole("button", { name: "View from above" }).click();
  await expect(
    page.getByRole("button", { name: "Return to Exploration" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "World overview", exact: true }),
  ).toBeVisible();
  expect((await travellerPose(page))!.z).toBe(mapped.z);
  await page.keyboard.press("KeyM");
  await page.keyboard.press("KeyM");
  await expect(
    page.getByRole("dialog", { name: "Find your next horizon." }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Map/ })).toBeFocused();
});

test("portrait jump, map selection, Escape and overview controls work with touch", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await observeExplorer(page);
    await page.goto("/explore");
    const jump = page.getByRole("button", { name: "Jump", exact: true });
    await expect(jump).toBeInViewport();
    await jump.tap();
    await expect
      .poll(async () => (await travellerPose(page))?.grounded)
      .toBe(false);
    await expect
      .poll(async () => (await travellerPose(page))?.grounded, {
        timeout: 5000,
      })
      .toBe(true);
    await page.getByRole("button", { name: /^Map/ }).tap();
    await page.getByRole("button", { name: "Select Celestial Orrery" }).tap();
    await expect(
      page.getByRole("heading", { name: "Celestial Orrery" }),
    ).toBeVisible();
    await expect(
      page.getByText("Scenic installation · Interactive demo"),
    ).toBeVisible();
    await page.getByRole("button", { name: "View from above" }).tap();
    await page.getByRole("button", { name: "Zoom overview out" }).tap();
    await page.getByRole("button", { name: "Rotate overview right" }).tap();
    await page.getByRole("button", { name: "Return to Exploration" }).tap();
    await expect(
      page.getByRole("button", { name: "Jump", exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("reduced-motion entry and Lite rendering retain map, jump and orbital return", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await observeExplorer(page);
  await page.goto("/explore");
  await page.getByRole("button", { name: "Start interactive scene" }).click();
  await page.getByRole("button", { name: "Scene settings" }).click();
  await page.getByRole("combobox", { name: "Rendering quality" }).selectOption("lite");
  await page.getByRole("button", { name: "Scene settings" }).click();
  await page.getByRole("button", { name: "Jump", exact: true }).click();
  await expect.poll(async () => (await travellerPose(page))?.grounded).toBe(false);
  await expect.poll(async () => (await travellerPose(page))?.grounded, { timeout: 5000 }).toBe(true);
  await page.getByRole("button", { name: /^Map/ }).click();
  await page.getByRole("button", { name: "Select Signal Archive" }).click();
  await page.getByRole("button", { name: "View from above" }).click();
  await page.getByRole("button", { name: "Return to Exploration" }).click();
  await expect(page.getByRole("button", { name: "Jump", exact: true })).toBeVisible();
});

test("enabling reduced motion dismisses a modal map and allows an explicit scene restart", async ({ page }) => {
  await page.goto("/explore");
  await page.getByRole("button", { name: "World overview", exact: true }).waitFor();
  await page.getByRole("button", { name: /^Map/ }).click();
  await expect(page.getByRole("dialog", { name: "Find your next horizon." })).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByRole("dialog", { name: "Find your next horizon." })).toHaveCount(0);
  await page.getByRole("button", { name: "Start interactive scene" }).click();
  await expect(page.getByRole("button", { name: "World overview", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /^Map/ }).click();
  await page.getByRole("button", { name: "Close map" }).click();
});
