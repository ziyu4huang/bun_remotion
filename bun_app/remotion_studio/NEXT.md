# remotion_studio — NEXT Iteration

> **Cross-linked docs:**
> - Code PLAN: `bun_app/remotion_studio/PLAN.md`
> - Code TODO: `bun_app/remotion_studio/TODO.md`
> - Code NEXT: `bun_app/remotion_studio/NEXT.md` — **(this file)**

> **Version:** v0.32.0 → v0.33.0 target
> **Date:** 2026-05-01
> **Theme:** Accessibility + Uncommitted Cleanup

---

## Reflection from v0.32.0

| What | Assessment |
|------|-----------|
| Responsive tables | Complete — 9 tables across 4 pages wrapped with overflowX scroll containers. Simple, effective fix. |
| Toast alignment | Complete — borderRadius and fontSize now use theme tokens instead of hardcoded values. |
| ErrorBoundary | Complete — Uses Card + Button design system components instead of inline styles. |
| Design system distribution | Complete — 4/4 primitives (Button, Card, StatusBadge, InputField) across all 17 pages. |
| Bundle optimization | Already good — 480KB total, 31 chunks, lazy loading + hover preload. Index chunk at 65KB is the largest. No heavy third-party libs to split out. |
| Mobile sidebar | Already good — hamburger + slide-in overlay on mobile, icon-only collapse on desktop. |
| Accessibility | Gap — Button, Card, StatusBadge have zero aria attributes. Only hamburger button has `aria-label`. |
| Uncommitted changes | 37 files changed (agent routes, types, tools) — need triage before next iteration. |

**Key lesson:** The design system migration (v0.27→v0.32) was 5 versions of incremental work. Each version focused on one primitive, migrated all pages, verified tests, then moved on. This cadence (one primitive per version, ~20 min each) was more reliable than trying to migrate everything at once.

---

## v0.33.0 Goals

### Goal 1: Accessibility — Design system aria support (P0)

**Current state:** Button, Card, StatusBadge, InputField have no aria attributes. Only mobile hamburger has `aria-label="Toggle navigation"`.
**Target state:** Design system components accept and forward aria props. Key interactive elements have sensible defaults.
**Estimated effort:** 4 files (Button.tsx, Card.tsx, StatusBadge.tsx, InputField.tsx)

**Approach:**
1. Add `aria-label` passthrough on Button (spread `...rest` already exists, verify it works)
2. Add `role="status"` + `aria-label` on StatusBadge (status announcements for screen readers)
3. Add `role` prop on Card for interactive cards
4. Add `aria-describedby` on InputField for error messages
5. Add `aria-live="polite"` to toast notifications
6. Verify with keyboard navigation (Tab, Enter, Escape)

### Goal 2: Uncommitted changes triage (P0)

**Current state:** 37 files with uncommitted changes across agent routes, types, tools, E2E tests.
**Target state:** All changes triaged — committed, reverted, or documented as in-progress.
**Estimated effort:** git diff review + commit decisions

**Approach:**
1. Review `git diff --stat` for scope
2. Identify which changes are agent-related (bun_pi_agent tools/types) vs studio-related
3. Group related changes into logical commits
4. Verify tests still pass after each commit

### Goal 3: Bundle health check (P2)

**Current state:** 480KB total, 31 chunks. No size regression tracking.
**Target state:** Add bundle size assertion to build script so regressions are caught.
**Estimated effort:** 1 file (vite.config.ts or build script)

**Approach:**
1. Add a post-build step that checks total bundle size < 550KB
2. Print chunk sizes sorted by size for visibility
3. Consider adding `rollup-plugin-visualizer` for future analysis

---

## Task Dependency Graph

```
Goal 2 (Uncommitted triage) ──┐
                                ├──► v0.33.0 release
Goal 1 (Accessibility) ───────┤
                                │
Goal 3 (Bundle health) ───────┘
```

Goal 2 first (clean working tree before making changes), then Goals 1 and 3 in parallel.

---

## Success Criteria for v0.33.0

- [ ] Uncommitted changes triaged (committed, reverted, or documented)
- [ ] Button/Card/StatusBadge/InputField accept aria props
- [ ] Toast has `aria-live="polite"` for screen reader announcements
- [ ] Keyboard navigation works for sidebar + command palette
- [ ] Bundle size check added to build (warns if > 550KB)
- [ ] Unit tests: 316+ pass, 0 fail
- [ ] Smoke E2E: 21/21 pass, 0 console errors
- [ ] Version bumped to 0.33.0

---

## Deferred to v0.34.0+

| Item | Why deferred |
|------|-------------|
| Video preview before render | Requires Remotion still rendering infrastructure |
| Export to platform formats | Requires per-platform FFmpeg pipeline + captions |
| File attachment in all advisor contexts | Partial coverage exists; full coverage needs UX design |
| Onboarding tour | New user walkthrough needs UX design |
| Component splitting (PipelineWizard 876 lines) | Code quality, not user-facing. Low priority. |

---

## Session Summary (v0.27.0 → v0.32.0)

5 versions shipped in one session, all green (316 tests, 21/21 smoke):

| Version | Theme | Key Changes |
|---------|-------|-------------|
| v0.28.0 | Button migration | ~60 buttons across 17 pages, 7 helpers removed, FAB overlap fix |
| v0.29.0 | Card migration | ~20 cards across 9 pages |
| v0.30.0 | Badge consolidation | 5 inline badges → StatusBadge |
| v0.31.0 | InputField migration | 8 inputs across 4 pages |
| v0.32.0 | Tables + polish | 9 responsive tables, toast tokens, ErrorBoundary refactor |

Design system scorecard: 4/4 complete. All primitives (Button, Card, StatusBadge, InputField) fully distributed.
