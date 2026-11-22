/** Local visual/performance review. Requires the existing Playwright dev dependency.
 * Optional AXE_CORE_PATH points to a temporary official axe-core installation.
 * Run against a production build, with no other browser benchmark running.
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3200";
const output = resolve(
  process.env.PORTFOLIO_REVIEW_OUTPUT ?? "docs/screenshots/portfolio",
);
const chrome =
  process.env.PLAYWRIGHT_CHROMIUM_PATH ??
  (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : undefined);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(chrome ? { executablePath: chrome } : {}),
});
const results = {
  baseURL,
  date: new Date().toISOString(),
  browser: browser.version(),
  conditions:
    "Production localhost. Fresh browser contexts; warm server image cache. Mobile is Chrome emulation, 4x CPU, 1.6 Mbps down / 750 Kbps up / 150 ms latency. Desktop is unthrottled. Three navigation runs each. No physical-device or field INP claim.",
  navigation: [],
  scrolling: [],
  accessibility: [],
};

async function reveal(page) {
  // Visit the page as a reader would, so one-time reveals and lazy images settle.
  const end = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < end; y += 650) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(110);
  }
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

try {
  // Capture actual browser output, with motion enabled; these are not concept renders.
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
      baseURL,
      viewport,
      deviceScaleFactor: 1,
      ...(name === "mobile" ? { isMobile: true, hasTouch: true } : {}),
    });
    const page = await context.newPage();
    await page.goto("/");
    await reveal(page);
    await page.screenshot({ path: `${output}/${name}-hero.png` });
    await page.screenshot({
      path: `${output}/${name}-full.jpg`,
      fullPage: true,
      type: "jpeg",
      quality: 85,
    });
    for (const id of ["work", "about", "expedition"]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `${output}/${name}-${id}.jpg`,
        type: "jpeg",
        quality: 88,
      });
    }
    // Audit the entire revealed page. Contrast needing image interpretation is also reviewed visually.
    const axe = process.env.AXE_CORE_PATH;
    if (axe && existsSync(axe)) {
      await page.addScriptTag({ path: axe });
      const audit = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: {
            type: "tag",
            values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
          },
        });
        return {
          violations: result.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })),
          passes: result.passes.length,
          incomplete: result.incomplete.map((v) => ({
            id: v.id,
            nodes: v.nodes.length,
          })),
        };
      });
      results.accessibility.push({ name, ...audit });
    }
    await context.close();
  }

  for (const mobile of [false, true]) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        baseURL,
        viewport: mobile
          ? { width: 390, height: 844 }
          : { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        isMobile: mobile,
        hasTouch: mobile,
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      if (mobile) {
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 150,
          downloadThroughput: 200000,
          uploadThroughput: 93750,
        });
      }
      await page.addInitScript(() => {
        window.__portfolioMetrics = { lcp: 0, cls: 0, longTasks: [] };
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__portfolioMetrics.lcp = entry.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (!entry.hadRecentInput)
              window.__portfolioMetrics.cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            window.__portfolioMetrics.longTasks.push(entry.duration);
        }).observe({ type: "longtask", buffered: true });
      });
      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForTimeout(1500);
      const navigation = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const resources = performance.getEntriesByType("resource");
        const scripts = resources.filter((r) => r.initiatorType === "script");
        return {
          ...window.__portfolioMetrics,
          fcp: performance.getEntriesByName("first-contentful-paint")[0]
            ?.startTime,
          domContentLoaded: nav.domContentLoadedEventEnd,
          transferredBytes:
            nav.transferSize +
            resources.reduce((n, r) => n + r.transferSize, 0),
          scriptTransferBytes: scripts.reduce((n, r) => n + r.transferSize, 0),
          requests: resources.length + 1,
          sceneAssets: resources
            .filter((r) => /\.(?:glb|wasm|ktx2)(?:\?|$)/.test(r.name))
            .map((r) => r.name),
        };
      });
      results.navigation.push({
        device: mobile ? "mobile" : "desktop",
        run,
        ...navigation,
      });
      if (run === 3) {
        await cdp.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: 0,
          downloadThroughput: -1,
          uploadThroughput: -1,
        });
        await reveal(page);
        const frames = await page.evaluate(
          () =>
            new Promise((resolve) => {
              const deltas = [];
              let previous = 0;
              let start = 0;
              const end = document.documentElement.scrollHeight - innerHeight;
              function frame(now) {
                if (!start) start = now;
                if (previous) deltas.push(now - previous);
                previous = now;
                const progress = Math.min((now - start) / 4000, 1);
                window.scrollTo(0, end * progress);
                if (progress < 1) requestAnimationFrame(frame);
                else {
                  deltas.sort((a, b) => a - b);
                  resolve({
                    frames: deltas.length,
                    p50Ms: deltas[Math.floor(deltas.length * 0.5)],
                    p95Ms: deltas[Math.floor(deltas.length * 0.95)],
                    over50Ms: deltas.filter((x) => x > 50).length,
                  });
                }
              }
              requestAnimationFrame(frame);
            }),
        );
        results.scrolling.push({
          device: mobile ? "mobile-4x-cpu" : "desktop",
          ...frames,
        });
      }
      await context.close();
    }
  }
  await writeFile(
    `${output}/measurements.json`,
    JSON.stringify(results, null, 2) + "\n",
  );
  console.log(JSON.stringify(results, null, 2));

  if (process.env.PORTFOLIO_RECORD === "1") {
    const context = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 900 },
      recordVideo: {
        dir: `${output}/recording`,
        size: { width: 1440, height: 900 },
      },
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForTimeout(2200);
    await page.mouse.move(720, 440);
    const end = await page.evaluate(
      () => document.documentElement.scrollHeight - innerHeight,
    );
    // Browser-native smooth scroll captures the real reveal/motion sequence, without postproduction effects.
    for (const [y, hold] of [
      [1000, 1200],
      [1750, 900],
      [2450, 900],
      [3150, 1200],
      [4200, 1000],
      [5000, 1000],
      [end, 1500],
    ]) {
      await page.evaluate(
        (y) => window.scrollTo({ top: y, behavior: "smooth" }),
        y,
      );
      await page.waitForTimeout(hold);
    }
    await page.getByRole("link", { name: "Back to top ↑" }).click();
    await page.waitForTimeout(1000);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Toolkit" })
      .click();
    await page.getByRole("tab", { name: /Systems/ }).click();
    await page.waitForTimeout(1100);
    await page.getByRole("tab", { name: /Intelligence/ }).click();
    await page.waitForTimeout(1100);
    const video = page.video();
    await context.close();
    await video.saveAs(`${output}/portfolio-walkthrough.webm`);
    await video.delete();
    console.log(`Recorded ${output}/portfolio-walkthrough.webm`);
  }
} finally {
  await browser.close();
}
