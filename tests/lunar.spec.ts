import { expect, test, type Page } from "@playwright/test";

const sizes = [
  [320, 568], [375, 812], [390, 844], [430, 932],
  [768, 1024], [1280, 800], [1440, 900], [1920, 1080],
] as const;

async function ready(page: Page) {
  await expect(page.getByRole("heading", { name: "Communications relay" })).toBeVisible({ timeout: 20_000 });
}

test("landing and direct portfolio render at all eight sizes with zero scene asset requests", async ({ page }) => {
  const sceneRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/lunar\/(?:astronaut|earth-|lunar-height|copernicus-relief|regolith)/.test(request.url())) sceneRequests.push(request.url());
  });

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Akshat Jain" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Begin Exploration" })).toBeInViewport();
    await page.getByRole("link", { name: "View Portfolio" }).click();
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    await expect(page.getByRole("link", { name: "MEETFLIX" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }

  await page.getByRole("link", { name: "MEETFLIX" }).click();
  await expect(page.getByRole("heading", { name: "MEETFLIX" })).toBeVisible();
  expect(sceneRequests).toEqual([]);
});

test("keyboard traversal, dialog pause and focus return, quality, and repeated entry", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
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
  const dialog = page.getByRole("dialog", { name: "MEETFLIX" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close relay entry" })).toBeFocused();
  await page.keyboard.down("s");
  await page.waitForTimeout(1150);
  await page.keyboard.up("s");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(inspect).toBeFocused();
  await expect(inspect).toBeVisible();
  await inspect.click();
  await dialog.getByRole("link", { name: "View project entry" }).click();
  await expect(page).toHaveURL("/work/meetflix");
  await page.getByRole("link", { name: "Explore", exact: true }).click();
  await ready(page);
  await expect(inspect).toHaveCount(0);
  await page.getByRole("link", { name: "Exit" }).click();
  await expect(page).toHaveURL("/");
  expect(errors).toEqual([]);
});

test("portrait touch holds and pointer cancellation release movement", async ({ browser, baseURL }) => {
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
    const dialog = page.getByRole("dialog", { name: "MEETFLIX" });
    await expect(dialog).toBeVisible();
    await page.setViewportSize({ width: 844, height: 390 });
    await expect(dialog.getByRole("button", { name: "Close relay entry" })).toBeInViewport();
    await dialog.getByRole("button", { name: "Close relay entry" }).tap();
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
  await expect(page.getByRole("link", { name: "MEETFLIX" })).toBeVisible();

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
    await expect(htmlPage.getByRole("link", { name: "MEETFLIX" })).toBeVisible();
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
  await expect(page.getByRole("link", { name: "MEETFLIX" })).toBeVisible();
});

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
