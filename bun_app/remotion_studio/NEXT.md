# remotion_studio — NEXT Iteration

> **Cross-linked docs:**
> - Code PLAN: `bun_app/remotion_studio/PLAN.md`
> - Code TODO: `bun_app/remotion_studio/TODO.md`
> - Code NEXT: `bun_app/remotion_studio/NEXT.md` — **(this file)**

> **Version:** v0.33.0 → v0.34.0 target
> **Date:** 2026-05-01
> **Theme:** Mobile E2E + Keyboard Navigation

---

## Reflection from v0.33.0

| What | Assessment |
|------|-----------|
| Uncommitted triage | Complete — 178 files committed, runtime data gitignored. Clean working tree. |
| Accessibility | Complete — Button type="button", InputField role="alert", StatusBadge role="status", Toast aria-live="polite". |
| Bundle health | Complete — Post-build check prints sorted chunks, 419KB (limit 600KB). |
| File picker TODO | Stale — AdvisorPanelBase already has full file picker support. Marked done. |

**Key lesson:** Before adding accessibility features, check what the framework already provides. Button extends `React.ButtonHTMLAttributes` so `...rest` already passes `aria-label`, `aria-disabled`, etc. The actual gap was missing `role` attributes on non-semantic elements (`<span>`) and sensible defaults (`type="button"`).

---

## v0.34.0 Goals

### Goal 1: Mobile responsive E2E tests (P0)

**Current state:** 21 smoke tests verify desktop rendering. No tests at 375px viewport.
**Target state:** Mobile viewport E2E covering sidebar, tables, forms, and wizard.
**Estimated effort:** 1 new spec file + helpers

**Approach:**
1. Create `e2e/mobile-responsive.spec.ts` with `viewport: { width: 375, height: 812 }` (iPhone X)
2. Test: sidebar hamburger opens/closes, tables scroll horizontally, wizard stacks vertically
3. Test: command palette renders at mobile width, global jobs panel shows as bottom sheet
4. Reuse existing `gotoWithRetry` helper

### Goal 2: Keyboard navigation for Command Palette + Sidebar (P1)

**Current state:** Command Palette has arrow/Enter/Escape support. Sidebar has no keyboard navigation.
**Target state:** Tab navigates sidebar items. Escape closes sidebar. Focus trap in modals.
**Estimated effort:** 2 files (App.tsx sidebar, CommandPalette focus management)

**Approach:**
1. Sidebar nav items get `tabIndex={0}`, Enter/Space to navigate
2. Escape closes mobile sidebar overlay
3. Command Palette focus trap — Tab cycles within palette, Escape closes

---

## Task Dependency Graph

```
Goal 1 (Mobile E2E) ──────────┐
                                 ├──► v0.34.0 release
Goal 2 (Keyboard navigation) ─┘
```

Both goals independent.

---

## Success Criteria for v0.34.0

- [ ] Mobile E2E spec covers sidebar, tables, wizard at 375px viewport
- [ ] Sidebar items keyboard-navigable (Tab + Enter)
- [ ] Escape closes mobile sidebar overlay
- [ ] Command Palette has focus trap (Tab stays within)
- [ ] Unit tests: 316+ pass, 0 fail
- [ ] Smoke E2E: 21/21 pass, 0 console errors
- [ ] Version bumped to 0.34.0

---

## Deferred to v0.35.0+

| Item | Why deferred |
|------|-------------|
| Onboarding tour | New user walkthrough needs UX design |
| Video preview before render | Requires Remotion still rendering infrastructure |
| Export to platform formats | Requires per-platform FFmpeg pipeline + captions |
| Component splitting (PipelineWizard 876 lines) | Code quality, not user-facing |

---

## Session Summary (v0.27.0 → v0.33.0)

6 versions shipped, all green (316 tests, 21/21 smoke):

| Version | Theme | Key Changes |
|---------|-------|-------------|
| v0.28.0 | Button migration | ~60 buttons, 7 helpers removed, FAB overlap fix |
| v0.29.0 | Card migration | ~20 cards across 9 pages |
| v0.30.0 | Badge consolidation | 5 inline badges → StatusBadge |
| v0.31.0 | InputField migration | 8 inputs across 4 pages |
| v0.32.0 | Tables + polish | 9 responsive tables, toast tokens, ErrorBoundary |
| v0.33.0 | Accessibility + cleanup | aria roles, bundle health check, gitignore, triage |
