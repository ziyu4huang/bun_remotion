import { test } from "@playwright/test";
import { gotoWithRetry, navigateTo, NAV_LABELS, collectConsoleErrors, assertNoConsoleErrors } from "./helpers.js";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SNAPSHOT_DIR = ".playwright-cli";

// Extract a lightweight DOM summary: tag + role + text + children (max depth 6)
function domSummaryScript() {
  return `
    (function summarize(el, depth) {
      if (depth > 6 || !el) return null;
      const tag = el.tagName?.toLowerCase() || '';
      if (['script','style','svg','path','br','hr','noscript'].includes(tag)) return null;

      const role = el.getAttribute?.('role') || el.role || '';
      const ariaLabel = el.getAttribute?.('aria-label') || '';
      const dataTestId = el.getAttribute?.('data-testid') || '';
      const text = (el.childNodes?.length === 1 && el.childNodes[0].nodeType === 3)
        ? el.childNodes[0].textContent?.trim()?.slice(0, 60)
        : '';

      const kids = [];
      if (el.children) {
        for (const child of el.children) {
          const s = summarize(child, depth + 1);
          if (s) kids.push(s);
        }
      }

      const label = [tag, role && 'role=' + role, ariaLabel && 'aria=' + ariaLabel,
                      dataTestId && 'testid=' + dataTestId, text && '"' + text + '"']
        .filter(Boolean).join(' ');

      if (kids.length === 0) return label;
      return { [label]: kids };
    })(document.body, 0)
  `;
}

function writeSnapshot(label: string, data: string) {
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const file = join(SNAPSHOT_DIR, `audit-${label.toLowerCase().replace(/\s+/g, "-")}.json`);
  writeFileSync(file, data);
}

for (const label of NAV_LABELS) {
  test(`snapshot: ${label}`, async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await gotoWithRetry(page);
    await navigateTo(page, label);
    await page.waitForTimeout(800);

    const snapshot = await page.evaluate(domSummaryScript());
    writeSnapshot(label, JSON.stringify(snapshot, null, 2));

    assertNoConsoleErrors(errors);
  });
}
