import { expect, test, type Page } from "@playwright/test";

import { catalog } from "../content/projects";
import { moon, relay } from "../content/worlds";
import { projectHref } from "../content/catalog";

const first = catalog.projects[0];
const relayEntry = catalog.bindings.get(moon.id)?.find(point => point.id === relay.id);
async function expectPortfolio(page: Page) {
  if (first) await expect(page.getByRole("link", { name: first.name, exact: true }).first()).toBeVisible();
  else await expect(page.getByText("No project entries are published yet.")).toBeVisible();
}

const sizes = [
  [320, 568], [375, 812], [390, 844], [430, 932],
  [768, 1024], [1280, 800], [1440, 900], [1920, 1080],
] as const;

async function ready(page: Page) {
  await expect(page.getByRole("button", { name: "Open wider observation view" })).toBeVisible({ timeout: 20_000 });
}

test("both landing pages and direct portfolio render at all eight sizes without loading the scene", async ({ page }) => {
  const sceneRequests: string[] = [];
  const homepageRequests: string[] = [];
  let checkingHome = false;
  page.on("request", (request) => {
    const { pathname } = new URL(request.url());
    if (checkingHome && /^\/(?:lunar\/|experience(?:\/|$)|explore(?:\/|$))/.test(pathname)) {
      homepageRequests.push(pathname);
    }
    if (pathname.startsWith("/lunar/") && !/^\/lunar\/(?:survey-)?opening(?:-portrait)?\.webp$/.test(pathname)) {
      sceneRequests.push(pathname);
    }
  });

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    checkingHome = true;
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Akshat Jain" })).toBeVisible();
    await expect(page.getByText("Computer science student, developer and builder.")).toBeVisible();
    await expect(page.getByText("Something exciting is in the works")).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(248, 246, 240)");
    await expect(page.getByRole("heading", { name: "Akshat Jain" }).locator("em")).toHaveCSS("color", "rgb(38, 61, 178)");
    await expect(page.getByRole("link", { name: "GitHub" })).toHaveAttribute("href", "https://github.com/akshat-j1");
    const comingSoon = page.getByRole("link", { name: "Coming soon" });
    await expect(comingSoon).toBeInViewport();
    await expect(comingSoon).toHaveAttribute("href", "/experience");
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
    checkingHome = false;

    await comingSoon.click();
    await expect(page).toHaveURL("/experience");
    await expect(page.locator(".opening-plate img")).toBeVisible();
    await expect.poll(() => page.locator(".opening-plate img").evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.getByRole("link", { name: "Begin Exploration" })).toBeInViewport();
    await page.getByRole("link", { name: "View Portfolio" }).click();
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    await expectPortfolio(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }

  if (first) {
    await page.locator(`a[href="${projectHref(first)}"]`).click();
    await expect(page.getByRole("heading", { name: first.name, exact: true })).toBeVisible();
  }
  expect(homepageRequests).toEqual([]);
  expect(sceneRequests).toEqual([]);
});

test("keyboard activation opens the cinematic landing and browser history restores both homepages", async ({ page }) => {
  await page.goto("/");
  const comingSoon = page.getByRole("link", { name: "Coming soon" });
  await page.keyboard.press("Tab");
  await expect(comingSoon).toBeFocused();
  await expect(comingSoon).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL("/experience");
  await expect(page.getByRole("link", { name: "Begin Exploration" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL("/");
  await expect(comingSoon).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL("/experience");
  await expect(page.getByRole("link", { name: "View Portfolio" })).toBeVisible();

  await page.goto("/coming-soon");
  await expect(comingSoon).toHaveAttribute("href", "/experience");
});

test("keyboard traversal, dialog pause and focus return, quality, and repeated entry", async ({ page }) => {
  test.skip(!relayEntry, "This case exercises a published relay assignment.");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/experience");
  await page.getByRole("link", { name: "Begin Exploration" }).click();
  await ready(page);
  await expect(page.getByRole("button", { name: "Inspect relay" })).toHaveCount(0);

  await page.getByRole("button", { name: "Scene settings" }).click();
  await page.getByRole("combobox", { name: "Rendering quality" }).selectOption("lite");
  await page.getByRole("button", { name: "Hide movement controls help" }).click();
  await page.getByRole("button", { name: "Controls", exact: true }).click();
  await page.keyboard.down("w");
  const inspect = page.getByRole("button", { name: "Inspect relay" });
  await expect(inspect).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("w");

  await page.keyboard.press("e");
  const dialog = page.getByRole("dialog", { name: relayEntry!.project.name });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close project entry" })).toBeFocused();
  await page.keyboard.down("s");
  await page.waitForTimeout(1150);
  await page.keyboard.up("s");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(inspect).toBeFocused();
  await expect(inspect).toBeVisible();
  await inspect.click();
  await dialog.getByRole("link", { name: "View project entry" }).click();
  await expect(page).toHaveURL(relayEntry!.project.href);
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await ready(page);
  await expect(inspect).toHaveCount(0);
  await page.getByRole("link", { name: "Exit" }).click();
  await expect(page).toHaveURL("/experience");
  expect(errors).toEqual([]);
});

test("portrait touch holds and pointer cancellation release movement", async ({ browser, baseURL }) => {
  test.skip(!relayEntry, "This case exercises a published relay assignment.");
  const context = await browser.newContext({ baseURL, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto("/explore");
    await ready(page);
    const forward = page.getByRole("button", { name: "Move forward" });
    const right = page.getByRole("button", { name: "Move right" });
    const a = (await forward.boundingBox())!;
    const b = (await right.boundingBox())!;
    expect(a.width).toBeGreaterThanOrEqual(44);
    const session = await context.newCDPSession(page);
    const touchPoints = [{ x: a.x + a.width / 2, y: a.y + a.height / 2, id: 1 }];
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart", touchPoints: [...touchPoints, { x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 }],
    });
    await page.waitForTimeout(450);
    await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await page.waitForTimeout(3900);
    const inspect = page.getByRole("button", { name: "Inspect relay" });
    await expect(inspect).toHaveCount(0);
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints });
    await expect(inspect).toBeVisible({ timeout: 15_000 });
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await inspect.tap();
    const dialog = page.getByRole("dialog", { name: relayEntry!.project.name });
    await expect(dialog).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(dialog.getByRole("button", { name: "Close project entry" })).toBeInViewport();
    await dialog.getByRole("button", { name: "Close project entry" }).tap();
    await expect(inspect).toBeVisible();
  } finally {
    await context.close();
  }
});

test("reduced motion, unavailable WebGL, and no JavaScript retain direct project access", async ({ page, browser, baseURL }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Choose your view" })).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("link", { name: "View Portfolio" }).click();
  await expectPortfolio(page);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value(this: HTMLCanvasElement, kind: string, options: unknown) {
        return kind === "webgl2" ? null : Reflect.apply(original, this, [kind, options]);
      },
    });
  });
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "The lunar scene is unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Portfolio" })).toBeVisible();

  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  try {
    const htmlPage = await context.newPage();
    await htmlPage.goto("/explore");
    await htmlPage.getByRole("link", { name: "View Portfolio" }).click();
    await expectPortfolio(htmlPage);
  } finally {
    await context.close();
  }
});

test("a delayed or failed model load keeps the portfolio link available", async ({ page }) => {
  let failRequest!: () => void;
  const delayed = new Promise<void>((resolve) => { failRequest = resolve; });
  await page.route("**/lunar/astronaut.glb", async (route) => {
    await delayed;
    await route.abort();
  });
  await page.goto("/explore");
  await expect(page.getByText("Loading the lunar scene…")).toBeVisible();
  await expect(page.getByRole("link", { name: "View Portfolio" })).toBeVisible();
  failRequest();
  await expect(page.getByRole("heading", { name: "The lunar scene is unavailable" })).toBeVisible();
  await page.getByRole("link", { name: "View Portfolio" }).click();
  await expectPortfolio(page);
});

test("a failed ejecta texture falls back to the base ground material", async ({ page }) => {
  await page.route("**/lunar/ejecta-detail.webp", (route) => route.abort());
  await page.goto("/explore");
  await ready(page);
  await expect(page.getByRole("button", { name: "Open wider observation view" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Portfolio" })).toBeVisible();
});

for (const asset of ["basin-relief.png", "crater-surface.webp", "trail-impacts.png", "rim-strata.webp", "moon_rock_02.glb", "galactic-light.webp"]) {
  test(`exploration remains available without ${asset}`, async ({ page }) => {
    await page.route(`**/lunar/${asset}`, (route) => route.abort());
    await page.goto("/explore");
    await ready(page);
    await expect(page.getByRole("button", { name: "Open wider observation view" })).toBeVisible();
  });
}

test("the canvas resizes across the matrix and context loss offers portfolio access", async ({ page }) => {
  await page.goto("/explore");
  await ready(page);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await expect(page.getByRole("link", { name: "Exit" })).toBeInViewport();
    await expect(page.getByRole("button", { name: "Scene settings" })).toBeInViewport();
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
    expect(await canvas.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }

  await page.locator("canvas").evaluate((canvas) => {
    if (canvas instanceof HTMLCanvasElement) {
      canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
    }
  });
  await expect(page.getByRole("heading", { name: "The lunar scene is unavailable" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Portfolio" })).toBeVisible();
});

test("desktop drag-to-look and the wider observation view remain reversible", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/explore");
  await ready(page);
  const canvas = page.locator("canvas");
  await page.getByRole("button", { name: "Open wider observation view" }).click();
  await expect(page.getByRole("button", { name: "Return to walking view" })).toHaveAttribute("aria-pressed", "true");
  const bounds = (await canvas.boundingBox())!;
  await page.mouse.move(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.58, bounds.y + bounds.height * 0.48, { steps: 8 });
  await page.mouse.up();
  await expect(page.getByTestId("surface-canvas")).toHaveAttribute("data-looked", "true");
  await page.getByRole("button", { name: "Return to walking view" }).click();
  await expect(page.getByRole("button", { name: "Open wider observation view" })).toHaveAttribute("aria-pressed", "false");
});

test("touch drag-to-look works on the open ground without stealing movement controls", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto("/explore");
    await ready(page);
    const bounds = (await page.locator("canvas").boundingBox())!;
    const input = await context.newCDPSession(page);
    const x = bounds.x + bounds.width * 0.68;
    const y = bounds.y + bounds.height * 0.47;
    await input.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 1 }] });
    await input.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 38, y: y + 16, id: 1 }] });
    await input.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(page.getByTestId("surface-canvas")).toHaveAttribute("data-looked", "true");
    const forward = page.getByRole("button", { name: "Move forward" });
    await expect(forward).toBeVisible();
    await expect(forward).toHaveAttribute("aria-label", "Move forward");
  } finally {
    await context.close();
  }
});

test("losing focus drops a held key and allows a fresh movement command", async ({ page }) => {
  test.skip(!relayEntry, "This case exercises a published relay assignment.");
  await page.goto("/explore");
  await ready(page);
  try {
    await page.keyboard.down("ArrowUp");
    await page.waitForTimeout(500);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForTimeout(3650);
    await expect(page.getByRole("button", { name: "Inspect relay" })).toHaveCount(0);
  } finally {
    await page.keyboard.up("ArrowUp");
  }
  await page.keyboard.down("ArrowUp");
  await expect(page.getByRole("button", { name: "Inspect relay" })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.up("ArrowUp");
});

test("Auto quality steps down when active rendering is persistently slow", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(performance.now()), 47);
    window.cancelAnimationFrame = (handle) => window.clearTimeout(handle);
  });
  await page.goto("/explore");
  await ready(page);
  await page.getByRole("button", { name: "Scene settings" }).click();
  const choice = page.locator('option[value="auto"]');
  await expect(choice).toHaveText("Auto (balanced)");
  await page.keyboard.down("w");
  try {
    await expect(choice).toHaveText("Auto (lite)", { timeout: 12_000 });
  } finally {
    await page.keyboard.up("w");
  }
});
