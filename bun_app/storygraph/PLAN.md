# storygraph — Plan

> Full architecture → `.claude/skills/storygraph/PLAN.md`
> Full specs → GitHub issue #35 (PRD)

## Quick Reference

- **Version:** v0.42.0 — 517 tests, 28 files
- **Purpose:** Knowledge graph extraction + quality scoring for narrative series
- **Pipelines:** Regex / AI (glm) / Hybrid (default)
- **Consumers:** remotion_studio (pipeline-api.ts), bun_pi_agent (9 storygraph tools)

## Architecture (one-liners)

- `cli.ts` — Full CLI with score, write-gate, parse-plan, validate-plan, --ci
- `ai-client.ts` — pi-ai SDK wrapper (callAI, parseArgsForAI)
- `extract/` — Narrative extraction from narration.ts
- `scripts/` — 20+ scripts (pipeline, episode, merge, check, score, HTML, crosslink, etc.)
- `pipeline-api.ts` — 7 exported functions with streaming progress (v0.42.0)
- `types.ts` — GraphNode, GraphEdge, ExtractionResult, StoryCrossLink, etc.

## Pipeline Flow

```
graphify-pipeline.ts: extract → merge → crosslink → check → score → HTML
                       (--mode regex|ai|hybrid, --incremental, --feedback)
```

## Quality Tiers

| Tier | Method | Output |
|------|--------|--------|
| Tier 0 | Programmatic (gate.json v2) | 13+ genre-aware checks |
| Tier 1 | GLM blended (0.4×prog + 0.6×AI) | kg-quality-score.json |
| Tier 2 | Claude structured rubric | quality-review.json |
