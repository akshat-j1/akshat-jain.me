import { defineConfig } from "@playwright/test";

const port = 3100;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 35_000,
  workers: 1,
  use: {
    baseURL,
    channel: "chromium",
    launchOptions: {
      ...(process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}),
    },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: `npm start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
