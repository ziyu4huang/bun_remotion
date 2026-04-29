# REFLECTION — Cross-App Development Plan

> **Scope:** storygraph, episodeforge, remotion_studio, bun_pi_agent
> **Date:** 2026-04-29
> **Focus:** agent-first WebUI design, CI gate, cross-app coherence

---

## Current State Summary

| App | Version | Tests | Lines of Code | Maturity |
|-----|---------|-------|---------------|----------|
| storygraph | v0.36.0 | 461 pass | ~8700 | **Mature** — pipeline + dual-agent review complete |
| episodeforge | v0.3.0 | 87 pass | ~1800 | **Solid** — scaffold + P1 complete, PLAN.md rows |
| remotion_studio | v0.12.0 | 289 pass + 23 E2E | ~12000 | **Active** — agent-first all analytical pages |
| bun_pi_agent | v0.13.0 | 483 pass + 38 e2e | ~10200 | **Active** — 33 tools, 14 agents, CI gate |

**Total: 1317 tests across 4 apps.**

### Test Health

| App | Gaps |
|-----|------|
| storygraph | All major modules tested. Regression test suite complete. |
| episodeforge | No tests for tech explainer template output, no `--force` or `--list-series` flag tests. |
| remotion_studio | E2E specs verify rendering, not interactions. Agent bridge SSE untested server-side. |
| bun_pi_agent | Benchmark scoring differentiation still open. |

---

## Design Philosophy: Agent-First

**Key insight (2026-04-29):** The WebUI should NOT try to be a dashboard with buttons and tables for complex workflows. Instead:

1. **GUI = read-only state display** — show metrics, scores, status
2. **Agent = primary interface** — explain quality, run checks, investigate regressions, suggest fixes
3. **Quality page pattern** — "Ask Quality Agent" with context-aware prompts, agent response renders inline
4. **No GUI for operations that need explanation** — regression analysis, quality review, baseline management all go through the agent

This applies to all remotion_studio pages. Wherever the user needs to understand complex data or make decisions, the agent should be the interface — not a button that triggers a background job.

---

## Cross-App Integration Map

```
                    ┌──────────────────┐
                    │  bun_pi_agent    │
                    │  33 tools        │
                    │  14 agents       │
                    └──┬─────┬────┬────┘
                       │     │    │
           ┌───────────▼┐ ┌──▼──┐ ┌▼──────────┐
           │ storygraph  │ │Agent│ │ Benchmark  │
           │ tools (10)  │ │Chat │ │ (5 tasks)  │
           └──┬──────────┘ └─────┘ └────────────┘
              │                         ▲
    ┌─────────▼──────┐                  │
    │ remotion_studio │─────────────────┘
    │ pipeline-api.ts │  (quality routes
    │ agent-first UX  │   read storygraph_out)
    └────────────────┘
```

### Completed Integration Points

| From → To | How | Status |
|-----------|-----|--------|
| storygraph → remotion_studio | `pipeline-api.ts` exports, `storygraph_out/` data files | ✓ Read-only display + agent-driven |
| bun_pi_agent → storygraph | 10 sg_* tools wrapping pipeline-api.ts + regression | ✓ Full pipeline + regression + dual review |
| bun_pi_agent → remotion_studio | Agent bridge SSE + studio-* agents | ✓ Agent-first quality page |
| storygraph regression → CI | `ci.ts` + `graphify-regression.ts --ci` | ✓ `bun run ci:kg` / `ci:kg-all` |

---

## R1-R4 Roadmap: COMPLETE

| Phase | What | Tests | Status |
|-------|------|-------|--------|
| R1 | storygraph regression test suite | 43 | ✓ |
| R2 | pi-agent dual review + tools | 17 | ✓ |
| R3 | Agent-first quality page (remotion_studio) | 10 | ✓ |
| R4 | CI gate scripts (`ci:kg`, `ci:kg-all`) | 6 | ✓ |

---

## What's Unlocked

1. **Author workflow:** Write plan → agent scaffolds → agent runs pipeline → agent checks quality + regression → agent generates TTS → agent renders → **all from AgentChat**
2. **Quality safety net:** `bun run ci:kg <series>` catches regression before production
3. **Agent-driven improvement:** Agent explains quality, suggests fixes, updates baselines
4. **Agent-first studio:** Quality page is the template — other complex pages should follow this pattern

---

## Next Priorities

1. **Apply agent-first to other pages** ✓ — Quality, Benchmark, Monitoring, Dashboard all have "Ask agent" CTAs
2. **episodeforge P1** ✓ — --list-series, --force, asset validation, reorderScripts done. Remaining: PLAN.md row, custom templates
3. **Ch3-Ep3: 秘境 BOSS** — Next episode in my-core-is-boss series
4. **Test reviewer integration** — Wire test-reviewer agent into studio

---

## Deferred Items

- **Cross-series federated merge** (storygraph) — blocked on 3+ high-quality series
- **Plugin system** (bun_pi_agent) — architecture P2, not blocking
- **Video preview** (remotion_studio) — requires Remotion still infrastructure
- **Export to platforms** (remotion_studio) — requires per-platform FFmpeg pipeline
