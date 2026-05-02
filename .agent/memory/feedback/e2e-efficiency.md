---
name: E2E Testing Efficiency
description: Rules for fast, targeted E2E testing — avoid full-suite runs during development
type: feedback
---

**Rule:** Never run the full E2E suite during iterative development. Run only the affected specs.

**Why:** Full suite takes 18+ minutes (161 tests). Running it 3-5 times per session wastes 1+ hour. Most failures are pre-existing (agent bridge, toast) and unrelated to current changes.

**How to apply:**
1. Run ONLY affected specs: `bunx playwright test e2e/dashboard.spec.ts e2e/agent-chat.spec.ts`
2. Run the full suite ONCE at the end, in background, to verify no regressions
3. If a test fails, debug with `--reporter=list` and a single spec — never re-run the whole suite
4. Skip smoke tests during iteration — they add ~15s per run for confirmation you already have
5. Use `bun test src/` for unit tests (2s), not full `bun test` which picks up E2E specs

**Anti-patterns to avoid:**
- Running `bunx playwright test` (full suite) to verify a single fix
- Restarting server + rebuild for every small change — batch related fixes, rebuild once
- Trying framework-level solutions (addInitScript) when component-level fixes exist (navigator.webdriver guard)
