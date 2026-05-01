import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  use: {
    baseURL: "http://localhost:5173",
    locale: "zh-TW",
    viewport: { width: 1280, height: 800 },
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },
  webServer: {
    // Build client + start Hono server (no Vite dev server — avoids resource exhaustion)
    command: "bun run build && PORT=5173 bun run src/server/index.ts",
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
  projects: [
    {
      name: "e2e",
      testDir: "./e2e",
      testIgnore: /build-ch3-ep2/,
    },
    {
      name: "integration",
      testDir: "./e2e",
      testMatch: /build-ch3-ep2/,
      timeout: 60_000,
    },
  ],
});
