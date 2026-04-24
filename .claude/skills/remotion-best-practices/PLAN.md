# Novel Video Generation — Strategic Roadmap

> **Cross-linked docs:**
>
> This file (active phases) | Archive
> ---|---
> `PLAN.md` — Phase 42–43 specs | `PLAN-archive.md` — Phases 24–41 (complete)
> `TODO.md` — Active tasks | `TODO-archive.md` — Completed tasks
> `NEXT.md` — Entry point (read first) | `REFLECTIONS.md` — Historical session logs
> — | `../storygraph/PLAN.md` — Code architecture

---

## Phase 42: my-core-is-boss New Episode — Pipeline Diversity Test

### Problem

The full E2E pipeline (scaffold → story → narration → images → TTS → render) has only been tested end-to-end on weapon-forger. my-core-is-boss has 5 of 34 planned episodes, with KG data (173 nodes, 315 edges, 8 communities). But no new episode has been created through the pipeline since the WebUI and batch tools were built.

### Goal

Create one new my-core-is-boss episode using the full pipeline, identifying any series-specific issues that weapon-forger doesn't expose.

### Key Questions

1. Does episodeforge scaffold work with my-core-is-boss naming convention?
2. Are character images available or need generation?
3. Does the WebUI workflow page handle my-core-is-boss correctly?
4. Does TTS voice assignment work for my-core-is-boss characters?

### Architecture

Follows the same E2E flow as weapon-forger ch3-ep2:
```
PLAN.md review → scaffold → story/narration → image gen → TTS → scene implementation → render
```

### Files

| Area | Expected |
|------|----------|
| Episode dir | `bun_remotion_proj/my-core-is-boss/my-core-is-boss-ch<ch>-ep<ep>/` |
| Story | PLAN.md + narration.ts |
| Assets | Check `assets/characters/` for existing images |
| Audio | TTS WAV files + durations.json |
| Scenes | TitleScene + ContentScene(s) + OutroScene |

---

## Phase 43: Review Agent CLI in bun_pi_agent

### Problem

The current three-tier quality pipeline has a gap:
- **Tier 0** (programmatic) — free, fast, always runs → gate.json
- **Tier 1** (GLM scoring) — free, slow → quality-score.json
- **Tier 2** (Claude Code review) — paid, manual, requires Claude Code session

For routine quality checks, Claude Code is overkill. A GLM5-turbo agent can handle structured review at zero cost.

### Goal

Build a standalone CLI review agent that:
1. Reads pipeline output (gate.json, quality-score.json, narration files)
2. Calls GLM5-turbo for structured quality review
3. Outputs typed review JSON (decision, dimensions, fix suggestions)
4. Runs from repo root without CWD change
5. Can be integrated into CI/WebUI workflows

### Architecture

```
bun_app/bun_pi_agent/src/review-agent/
├── cli.ts              # CLI entry: bun run review-agent <series-dir>
├── review-prompt.ts    # Build structured review prompt from pipeline data
├── review-parser.ts    # Parse GLM response into ReviewResult
└── __tests__/
    └── review-agent.test.ts

Input files (read-only):
  - <series>/storygraph_out/gate.json
  - <series>/storygraph_out/kg-quality-score.json
  - <series>/storygraph_out/merged-graph.json
  - Episode narration.ts files

Output:
  - <series>/storygraph_out/quality-review.json

ReviewResult:
  decision: "APPROVE" | "APPROVE_WITH_FIXES" | "REQUEST_RERUN" | "BLOCK"
  dimensions: {
    semantic_correctness: 0-10
    creative_quality: 0-10
    genre_fit: 0-10
    pacing: 0-10
    character_consistency: 0-10
    regression_vs_previous: 0-10
  }
  overall: 0-10
  strengths: string[]
  weaknesses: string[]
  fix_suggestions: { target: string, suggestion: string, priority: "high"|"medium"|"low" }[]
  summary_zhTW: string
```

### CLI Design

```bash
bun run review-agent bun_remotion_proj/weapon-forger
bun run review-agent bun_remotion_proj/my-core-is-boss --model glm-5-turbo
bun run review-agent bun_remotion_proj/weapon-forger --json
```

### Key Design Decisions

1. **GLM5-turbo default** — Faster + cheaper than GLM-5 for structured review.
2. **No CWD change** — All paths resolved relative to provided series-dir arg.
3. **Standalone module** — Not wired into storygraph CLI initially.
4. **ReviewResult is typed** — Parser validates GLM output with graceful fallbacks.
5. **Integration path** — Can later wire into storygraph CLI, WebUI, CI pipeline.

### Why bun_pi_agent (not storygraph)

- bun_pi_agent already has the GLM client (`callAI()`) infrastructure
- Review is an AI agent task, not a graph extraction task
- Separates concerns: storygraph = KG pipeline, bun_pi_agent = AI agents
