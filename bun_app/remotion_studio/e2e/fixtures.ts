/**
 * Re-exports Playwright test utilities.
 *
 * All E2E specs should import { test, expect } from "./fixtures"
 * instead of from "@playwright/test".
 *
 * The Wizard auto-redirect is disabled in App.tsx when navigator.webdriver
 * is true (Playwright sets this automatically).
 */
export { test, expect } from "@playwright/test";
export * from "./helpers";
