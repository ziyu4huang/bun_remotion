import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  timeout: 15_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    locale: "zh-TW",
    viewport: { width: 1280, height: 800 },
  },
  // No webServer — start manually first:
  //   bun run dev & npx vite &
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
