# Novel Video Generation — TODO

> **Cross-linked docs:**
> - `NEXT.md` — Entry point (read first — status, next task, dependency graph)
> - `PLAN.md` — Active phase specs (Phase 42–43)
> - `TODO-archive.md` — Completed tasks (Phase 24–41)
> - `PLAN-archive.md` — Completed phase specs (Phase 24–41)
> - `REFLECTIONS.md` — Historical session logs
> - `../storygraph/PLAN.md` — storygraph code-level architecture
> - `../storygraph/TODO.md` — storygraph code-level tasks

> **Rule:** Strategic/pipeline tasks → this file. Code implementation tasks → `../storygraph/TODO.md`.

> **Status:** v0.52.0 — Phase 42 (my-core-is-boss ch2-ep3) COMPLETE. Next: more episodes or pipeline improvements.

---

## Phase 41-C: Roadmap Refactor — COMPLETE

- [x] **41-C1: Archive PLAN.md completed phases** — Phase 31-39 specs → PLAN-archive.md
- [x] **41-C2: Archive TODO.md completed items** — Phase 33-D through 40-G → TODO-archive.md
- [x] **41-C3: Extract NEXT.md reflections** — ~680 lines → REFLECTIONS.md (new on-demand file)
- [x] **41-C4: Update SKILL.md** — Added REFLECTIONS.md to Strategic Roadmap table
- [x] **41-C5: Update /develop_bun_app post-run** — Document REFLECTIONS.md pattern
- [x] **41-C6: Verify sizes** — PLAN.md <100, NEXT.md <40, TODO.md <100 lines

---

## Phase 42: my-core-is-boss New Episode (PLANNED)

> **Goal:** Test the full E2E pipeline on my-core-is-boss series (currently only 5/34 episodes). Validate pipeline diversity — weapon-forger works, does my-core-is-boss?
> **Why:** Pipeline has only been tested end-to-end on weapon-forger. Need cross-series validation.
> **Full spec:** `PLAN.md §Phase 42`

- [x] **42-A: Review my-core-is-boss PLAN.md** — Identified ch2-ep3 (技能點分配) as next episode.
- [x] **42-B: Scaffold episode** — Already scaffolded by episodeforge. Fixed Root.tsx path bug.
- [x] **42-C: Write story + narration** — Narration already written (35 segments across 5 scenes).
- [x] **42-D: Generate character images** — All needed images already existed (linyi, zhaoxiaoqi, xiaoelder with full emotions).
- [x] **42-E: Generate TTS** — MLX Qwen3-TTS, 35 segments, 4 voices (vivian/ryan/serena/uncle_fu). ~5min generation.
- [x] **42-F: Implement scenes** — Rewrote all 5 scene files from templates to full production code. Fixed DialogBox API, segment-durations paths, multi-character sprites.
- [x] **42-G: Render + verify** — Rendered to MP4 (247.3 MB, 7:10 duration, 12906 frames). One bug fix needed: SystemNotification type="achievement" → type="success".

---

## Phase 43: Review Agent CLI — COMPLETE

> **Goal:** Build a standalone CLI quality review agent in `bun_pi_agent` using GLM5-turbo. Replaces Claude Tier 2 review for routine quality checks.
> **Why:** Current Tier 2 review requires Claude Code session (paid). A GLM5-turbo agent can run free, autonomously.
> **Full spec:** `PLAN.md §Phase 43`

- [x] **43-A: Design review-agent architecture** — 6 files: types.ts, ai-call.ts, review-prompt.ts, review-parser.ts, cli.ts, __tests__/
- [x] **43-B: Create review-agent CLI entry** — `bun_app/bun_pi_agent/src/review-agent/cli.ts` + root `bun run review-agent` script
- [x] **43-C: Review prompt engineering** — 6 dimensions: semantic_correctness, creative_quality, genre_fit, pacing, character_consistency, regression_vs_previous. Narration text extraction via regex.
- [x] **43-D: Response parsing + output** — parseReviewResponse with fence stripping, JSON repair, score clamping, graceful fallbacks. Writes quality-review.json v2.0.
- [ ] **43-E: Integration** — Wire into storygraph CLI. Optional: WebUI route. (DEFERRED — standalone works, integration later)
- [x] **43-F: Tests** — 198 tests pass (18 new). Smoke tested on weapon-forger (BLOCK 2.5/10) and my-core-is-boss (APPROVE_WITH_FIXES 6.3/10).
