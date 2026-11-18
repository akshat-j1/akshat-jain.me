import { expect, test } from "@playwright/test";
import { createInput, directionFor } from "../components/explore/input";
import { toeGroundCorrection } from "../components/explore/foot-contact";
import { clearElevationGrid, createWalker, groundHeight, installBasinGrid, installElevationGrid, installRegionalGrid, nearRelay, relay, stepWalker } from "../components/explore/simulation";

function walk(player: ReturnType<typeof createWalker>, x: number, z: number, duration: number, fps = 60) {
  for (let frame = 0; frame < duration * fps; frame++) stepWalker(player, x, z, 1 / fps);
}

test("axes combine independent held inputs and release correctly", () => {
  const input = createInput();
  expect(directionFor("KeyW")).toBe("up");
  expect(directionFor("ArrowLeft")).toBe("left");
  input.set("finger-1", "up");
  input.set("finger-2", "right");
  input.set("KeyW", "up");
  expect(input.axis("up", "down")).toBe(-1);
  expect(input.axis("left", "right")).toBe(1);
  input.release("finger-1");
  expect(input.axis("up", "down")).toBe(-1);
  input.release("KeyW");
  expect(input.axis("up", "down")).toBe(0);
  input.clear();
  expect(input.moving).toBe(false);
});

test("walking is stable across frame rates and diagonal input is normalized", () => {
  const fast = createWalker();
  const slow = createWalker();
  walk(fast, 1, -1, 2, 60);
  walk(slow, 1, -1, 2, 20);
  expect(slow.x).toBeCloseTo(fast.x, 1);
  expect(slow.z).toBeCloseTo(fast.z, 1);
  expect(fast.speed).toBeCloseTo(2.6, 2);
  walk(fast, 0, 0, 1);
  expect(fast.speed).toBe(0);
  const x = fast.x;
  const z = fast.z;
  walk(fast, 0, 0, 1);
  expect(fast.x).toBe(x);
  expect(fast.z).toBe(z);
});

test("relay collision, proximity, terrain and world bounds stay consistent", () => {
  const player = createWalker();
  player.x = relay.x;
  walk(player, 0, -1, 8);
  expect(nearRelay(player)).toBe(true);
  expect(player.z).toBeGreaterThanOrEqual(relay.z + relay.radius + 0.32);
  expect(player.z).toBeLessThan(relay.z + relay.reach);
  expect(Number.isFinite(groundHeight(player.x, player.z))).toBe(true);
  walk(player, 0, 1, 20);
  expect(nearRelay(player)).toBe(false);
  expect(player.z).toBeLessThanOrEqual(12);
  expect(player.z).toBeGreaterThan(11.8);
  walk(player, -1, 0, 20);
  expect(player.x).toBeGreaterThanOrEqual(-15);
  expect(player.x).toBeLessThan(-14.8);
});

test("LOLA elevation data drives the same ground height used by movement", () => {
  clearElevationGrid();
  const baseline = groundHeight(0, 0);
  installElevationGrid({ width: 2, height: 2, values: new Uint8Array([255, 255, 255, 255]) });
  expect(groundHeight(0, 0) - baseline).toBeGreaterThan(2);
  installElevationGrid({ width: 2, height: 2, values: new Uint8Array([0, 0, 0, 0]) });
  expect(groundHeight(0, 0) - baseline).toBeLessThan(-2);
  clearElevationGrid();
  expect(groundHeight(0, 0)).toBe(baseline);
});

test("astronaut toe contact lifts sinking feet, lowers floating feet, and eases the correction", () => {
  const step = 1 / 60;
  expect(toeGroundCorrection(-0.1, step)).toBeGreaterThan(0);
  expect(toeGroundCorrection(0.1, step)).toBeLessThan(0);
  expect(Math.abs(toeGroundCorrection(-2, step))).toBeLessThanOrEqual(0.075 * (1 - Math.exp(-9 * step)));
  expect(toeGroundCorrection(0.01, step)).toBe(0);
  expect(toeGroundCorrection(Number.NaN, step)).toBe(0);
});

test("regional relief blends into the horizon without moving the spawn or relay", () => {
  clearElevationGrid();
  const center = groundHeight(0, 2.5);
  const station = groundHeight(relay.x, relay.z);
  const horizon = groundHeight(0, -90);
  try {
    installRegionalGrid({ width: 2, height: 2, values: new Uint16Array([16946, 16946, 18946, 18946]) });
    expect(groundHeight(0, 2.5)).toBe(center);
    expect(groundHeight(relay.x, relay.z)).toBe(station);
    expect(groundHeight(0, -90) - horizon).toBeGreaterThan(2);
    expect(Math.abs(groundHeight(0, -56.99) - groundHeight(0, -57.01))).toBeLessThan(0.03);
  } finally {
    clearElevationGrid();
  }
  expect(groundHeight(0, -90)).toBe(horizon);
});

test("the outer basin blends in beyond the complete walking bounds", () => {
  const corners = [[-15, -25], [15, -25], [-15, 12], [15, 12]] as const;
  const heights = corners.map(([x, z]) => groundHeight(x, z));
  try {
    installBasinGrid({ width: 2, height: 2, values: new Uint16Array(4).fill(16384 + 512 * 20) });
    expect(corners.map(([x, z]) => groundHeight(x, z))).toEqual(heights);
    expect(groundHeight(0, -100)).toBe(20);
    expect(Math.abs(groundHeight(0, -36.01) - groundHeight(0, -35.99))).toBeLessThan(0.03);
  } finally {
    clearElevationGrid();
  }
});

test("the eastern berth opens from the basin and the hull blocks walking", () => {
  const walker = createWalker();
  walker.x = 14;
  walker.z = -10.5;
  walk(walker, 1, 0, 8);
  expect(walker.x).toBeGreaterThan(19);
  expect(walker.x).toBeLessThan(22);
  walker.x = 16;
  walker.z = -18;
  walk(walker, 0, -1, 2);
  expect(walker.z).toBeGreaterThanOrEqual(-18);
});
