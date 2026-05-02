# E2E Testing — Headless → Headed Feedback Loop

## Mandatory Pipeline

Every WebUI feature MUST follow this pipeline to produce high-quality E2E tests:

```
1. Write headless E2E tests
   ↓
2. Run headless — must all pass
   ↓
3. Run headed Playwright (interactive, visible browser)
   ↓
4. Did headed reveal issues not caught by headless?
   ├─ YES → E2E tests are missing coverage → update them → go to step 2
   └─ NO  → Tests are production-quality ✓
```

**Why this pipeline exists:** Headless tests verify DOM structure but miss visual regressions, layout breaks, timing issues, and interaction edge cases that only a human eye catches in a real browser. The headed run is the "human QA" step that feeds back into the headless test suite. Each iteration tightens the E2E tests closer to real human interaction quality.

## Rules

1. **Never skip headed verification.** A headless-only test suite is a false sense of security.
2. **Headed failure = test gap, not test failure.** When headed reveals an issue that headless missed, the fix is to ADD/UPDATE the headless E2E test, not just fix the UI.
3. **Test what the user SEES, not just what the DOM contains.** Prefer `toBeVisible()`, visual state assertions, and interaction flows over `textContent()` checks.
4. **Cover the full interaction path:** load → render → interact → verify response → navigate away.
5. **Each headed session must test at minimum:**
   - Page loads without console errors
   - All interactive elements are reachable and functional
   - Navigation between pages preserves state where expected
   - Visual layout doesn't break (no overlapping, no overflow)
   - Error states display correctly

## Test File Organization

```
bun_app/remotion_studio/e2e/
  helpers.ts              — Shared utilities (navigateTo, waitForPageLoad, etc.)
  smoke.spec.ts           — All 13 pages load
  dashboard.spec.ts       — Dashboard + job queue + task tree
  projects.spec.ts        — Project list, detail, build, advisor
  workflows-tree.spec.ts  — Workflows page + tree view + polling
  agent-chat.spec.ts      — Agent selection, streaming, buttons
  benchmark.spec.ts       — Benchmark runner, baselines
  <page>.spec.ts          — Per-page tests
```

## Headless Run

```bash
# From repo root, with dev server running
cd bun_app/remotion_studio && bunx playwright test
```

## Headed Run

```bash
# Interactive browser — watch what happens
cd bun_app/remotion_studio && bunx playwright test --headed
```

For debugging a specific test:
```bash
cd bun_app/remotion_studio && bunx playwright test --headed --debug e2e/workflows-tree.spec.ts
```

## Common Patterns

### Wait for dynamic content
```typescript
// API data loads async — wait for it
await page.locator("select option").first().waitFor({ state: "attached" });
```

### Test interaction flow
```typescript
// Select template → verify step summary appears → verify button state
await select.selectOption(firstOption);
await expect(page.getByText("Steps:")).toBeVisible();
```

### Console error check
```typescript
const errors: string[] = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
// ... interact ...
const filtered = errors.filter(e => !e.includes("favicon.ico"));
expect(filtered).toEqual([]);
```

### Visual state assertions
```typescript
// Check element is not just in DOM but actually visible and not clipped
await expect(element).toBeVisible();
await expect(element).not.toHaveCSS("display", "none");
```

## Efficiency Rules (CRITICAL)

**NEVER run the full E2E suite during iterative development.** The full suite (160+ tests) takes 18+ minutes.

1. **Targeted testing:** Run only affected specs: `bunx playwright test e2e/dashboard.spec.ts`
2. **Full suite ONCE:** Run `bunx playwright test` only at the end, in background, to catch regressions
3. **Unit tests first:** `bun test src/` (2s) catches most issues; `bun test` picks up E2E specs (use `src/` filter)
4. **Batch rebuilds:** Don't rebuild+restart for every small change. Group fixes, rebuild once.

## Full-Page Overlay Rule

Any React component rendering `position: fixed; inset: 0; z-index: 9999` (tour, modal, splash) **MUST** check `navigator.webdriver` to auto-skip in Playwright:

```tsx
useEffect(() => {
  if (navigator.webdriver) return; // Skip in automated testing
  // ... show overlay logic
}, []);
```

`page.addInitScript()` does NOT reliably set localStorage before React mounts — don't waste time on it. The component-level guard is the only reliable approach.
