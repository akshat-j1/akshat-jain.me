import { expect, test } from "@playwright/test";
import { catalog } from "../content/projects";
import { projectHref } from "../content/catalog";

test("flight homepage leads directly to the catalog and keeps existing URLs", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Akshat Jain — Developer & Builder");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /^https:\/\/www\.akshat-jain\.me\/?$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    /Akshat\s+Jain/,
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Work" })
    .click();
  await expect(page).toHaveURL("/work");
  for (const project of catalog.projects) {
    await page
      .getByRole("link", { name: `Discover ${project.name}`, exact: true })
      .click();
    await expect(page).toHaveURL(projectHref(project));
    await expect(
      page.getByRole("heading", { name: project.name, exact: true }),
    ).toBeVisible();
    for (const link of project.links ?? []) {
      await expect(
        page.getByRole("link", { name: link.label }),
      ).toHaveAttribute("href", link.href);
    }
    await page.goBack();
    await expect(page).toHaveURL("/work");
  }
  const legacy = await request.get("/experience", { maxRedirects: 0 });
  expect(legacy.status()).toBe(308);
  expect(legacy.headers().location).toBe("/");
  expect((await request.get("/work/does-not-exist")).status()).toBe(404);
  expect(errors).toEqual([]);
});

test("native scroll reversibly moves the rocket and reveals the second scene", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator(".flight-track");
  const ship = page.locator(".flight-ship");
  await expect(page.locator(".flight")).toHaveAttribute(
    "data-flight-motion",
    "",
  );
  const initial = await ship.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.getByRole("link", { name: "Scroll to lift off" }).click();
  await expect(page).toHaveURL("/#departure");
  await expect
    .poll(() => ship.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(initial);
  await expect
    .poll(() =>
      page
        .locator(".flight-coast")
        .evaluate((element) => Number(getComputedStyle(element).opacity)),
    )
    .toBeGreaterThan(0.6);
  await expect
    .poll(() =>
      track
        .locator(".flight-deck")
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
    )
    .toBe(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect
    .poll(() => ship.evaluate((element) => getComputedStyle(element).transform))
    .toBe(initial);
});

test("portrait navigation and the robot greeting work with touch", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("link", { name: "Expedition", exact: true }).tap();
    await expect(page).toHaveURL("/#expedition");
    const reply = page.getByText("Signal received. See you on the Moon.");
    await expect(reply).toBeHidden();
    const wave = page.getByText("Wave hello", { exact: false });
    await wave.tap();
    await expect(reply).toBeVisible();
    await expect(page.locator(".flight-relay-hover")).not.toHaveCSS(
      "transform",
      "none",
    );
    await wave.tap();
    await expect(reply).toBeHidden();
    await expect(
      page.getByRole("link", { name: "Enter the universe" }),
    ).toHaveAttribute("href", "/explore");
  } finally {
    await context.close();
  }
});

test("keyboard and motion preferences retain access to the journey", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  const control = page.getByRole("button", { name: "Motion" });
  await control.click();
  await expect(control).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".flight-ship-hover")).toHaveCSS(
    "animation-name",
    "none",
  );
  await control.click();
  await expect(page.locator(".flight")).toHaveAttribute(
    "data-flight-motion",
    "",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".flight-deck")).toHaveCSS("position", "relative");
  await expect(page.locator(".flight-coast")).toHaveCSS("opacity", "1");
  await expect(page.getByRole("link", { name: "View my work" })).toBeVisible();
});

test("work, contact and the native robot disclosure work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".flight-deck")).toHaveCSS(
      "position",
      "relative",
    );
    await page.getByText("Wave hello", { exact: false }).click();
    await expect(
      page.getByText("Signal received. See you on the Moon."),
    ).toBeVisible();
    await page.getByRole("link", { name: "View my work" }).click();
    await expect(page).toHaveURL("/work");
    await page
      .getByRole("link", { name: "Discover MEETFLIX", exact: true })
      .click();
    await expect(
      page.getByText("This case study is in preparation."),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("scene imagery resolves without loading the lunar renderer", async ({
  page,
}) => {
  const downloads: string[] = [];
  page.on("request", (request) => {
    if (
      /\.(?:glb|wasm|ktx2)(?:\?|$)|\/lunar\/(?:basin|astronaut|moon_rock|earth)/.test(
        request.url(),
      )
    ) {
      downloads.push(request.url());
    }
  });
  await page.goto("/");
  await page.getByRole("link", { name: "Expedition", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement &&
              image.complete &&
              image.naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "GitHub", exact: true }),
  ).toHaveAttribute("href", "https://github.com/akshat-j1");
  await expect(
    page.getByRole("link", { name: "LinkedIn", exact: true }),
  ).toHaveAttribute("href", "https://www.linkedin.com/in/akshat-jainofficial/");
  expect(downloads).toEqual([]);
});
