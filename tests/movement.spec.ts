import { expect, test } from "@playwright/test";
import { cameraRelativeAxes } from "../components/explore/input";
import { clearBoomFraction, clearEyeHeight } from "../components/explore/camera-clearance";
import { observeExplorer, travellerPose } from "./scene-probe";

test("camera-relative input preserves directions and diagonal speed at a quarter turn", () => {
  expect(cameraRelativeAxes(0, -1, 0, -0.6)).toEqual({ x: 0, z: -1 });
  expect(cameraRelativeAxes(0, -1, 1, 0).x).toBe(1);
  expect(cameraRelativeAxes(0, 1, 1, 0).x).toBe(-1);
  expect(cameraRelativeAxes(-1, 0, 1, 0).z).toBe(-1);
  expect(cameraRelativeAxes(1, 0, 1, 0).z).toBe(1);
  const { x, z } = cameraRelativeAxes(1, -1, 0.36, -0.48);
  expect(Math.hypot(x, z)).toBeCloseTo(Math.SQRT2);
});

test("the follow camera clears low rocks but retracts at the relay and lifts over an intervening slope", () => {
  const pivot = { x: 0, y: 1.62, z: 0 };
  const eye = { x: 0, y: 2.72, z: 8 };
  const flat = () => 0;
  const rock = { x: 0, z: 3, radius: 1, height: 0.8 };
  expect(clearBoomFraction(pivot, eye, [rock], flat)).toBe(1);
  const relay = { ...rock, radius: 1.58, height: 2.62 };
  expect(clearBoomFraction(pivot, eye, [relay], flat)).toBeLessThan(0.3);
  expect(clearBoomFraction(pivot, eye, [{ ...relay, z: -3 }], flat)).toBe(1);
  expect(clearEyeHeight(pivot, eye, (_, z) => z > 3 && z < 5 ? 2.4 : 0)).toBeGreaterThan(3.2);
});

test("held W steers with the view during a mouse orbit and releases without phantom repeats", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await observeExplorer(page);
  await page.goto("/explore");
  await expect(page.getByRole("button", { name: "Open wider observation view" })).toBeVisible();
  await expect.poll(async () => (await travellerPose(page))?.speed).toBe(0);
  await page.keyboard.down("w");
  try {
    await expect.poll(async () => (await travellerPose(page))?.speed).toBeGreaterThan(1.3);
    await page.mouse.move(614, 520);
    await page.mouse.down();
    await page.mouse.move(952, 520, { steps: 14 });
    await page.mouse.up();
    await expect.poll(async () => (await travellerPose(page))?.viewX).toBeGreaterThan(0.82);
    await expect.poll(async () => (await travellerPose(page))?.alignment).toBeGreaterThan(0.94);
  } finally {
    await page.keyboard.up("w");
  }
  await expect.poll(async () => (await travellerPose(page))?.speed).toBe(0);
  const stopped = (await travellerPose(page))!;
  await page.evaluate(() => {
    window.dispatchEvent(new Event("blur"));
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", repeat: true, cancelable: true }));
  });
  await page.waitForTimeout(320);
  expect(await travellerPose(page)).toMatchObject({ x: stopped.x, z: stopped.z, speed: 0 });
});

test("touch arrows follow a rotated camera in landscape and cancel cleanly", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await observeExplorer(page);
    await page.goto("/explore");
    await expect(page.getByRole("button", { name: "Open wider observation view" })).toBeVisible();
    const cdp = await context.newCDPSession(page);
    const canvas = (await page.locator("canvas").boundingBox())!;
    const x = canvas.x + 340;
    const y = canvas.y + 140;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y, id: 11 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 260, y, id: 11 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(async () => (await travellerPose(page))?.viewX).toBeGreaterThan(0.73);

    const forward = page.getByRole("button", { name: "Move forward" });
    const bounds = (await forward.boundingBox())!;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, id: 12 }] });
    await expect.poll(async () => (await travellerPose(page))?.speed).toBeGreaterThan(1.2);
    await expect.poll(async () => (await travellerPose(page))?.alignment).toBeGreaterThan(0.94);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await expect.poll(async () => (await travellerPose(page))?.speed).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  } finally {
    await context.close();
  }
});
