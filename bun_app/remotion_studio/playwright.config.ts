import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    locale: "zh-TW",
    viewport: { width: 1280, height: 800 },
  },
  webServer: [
    {
      command: "bun run src/server/index.ts",
      port: 5173,
      reuseExistingServer: true,
      timeout: 10_000,
    },
    {
      command: "npx vite",
      port: 3000,
      reuseExistingServer: true,
      timeout: 10_000,
    },
  ],
});
