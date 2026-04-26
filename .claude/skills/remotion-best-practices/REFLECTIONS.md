# Historical Session Reflections

> On-demand reference only. NOT loaded every session.
> Active status: `NEXT.md`

## 2026-04-26 — Phase 57–58: TaskStore + JSON Persistence

- Phase 57: TaskNode/TaskTree types + in-memory TaskStore (10 tests). Clean data layer, no I/O.
- Phase 58: Added JSON persistence following scheduler-service.ts pattern (loadFromDisk/saveToDisk, eviction cap 50, corruption recovery). Key design: constructor accepts `filePath` for testability, lazy loading via `ensureLoaded()`, save after every mutation. Tests use tmp directory with beforeEach/afterEach cleanup. 15 tests pass (5 new: persist-to-disk, load-in-new-instance, corruption-recovery, eviction, delete-persists). 213 total pass, 0 regressions.

## 2026-04-26 — Phase 54-E: studio-coordinator Agent

**What:** Created studio-coordinator agent definition — the master orchestrator that uses spawn_task to delegate to all other studio agents.
**Files:** .agent/agents/studio-coordinator.md (new, ~100 lines).
**Design:** Coordinator has only spawn_task + Read/Grep/Find. It defines 4 production pipelines (Build Episode, Quick Render, Quality Audit, Asset Generation) with step-by-step delegation instructions. Includes coordination rules: check prerequisites, pass context between steps, handle failures gracefully, respect agent scopes, use appropriate max_turns.
**Phase 54 status:** COMPLETE. All 9 sub-agents built (studio-scaffold, studio-tts, studio-render, studio-image, studio-reviewer, studio-advisor, sg-quality-gate, sg-benchmark-runner, sg-story-advisor) + coordinator.

## 2026-04-26 — Phase 54-D: studio-image Agent

**What:** Added studio-image agent with 3 image tools wrapping bun_image and character profile services. Added bun_image workspace dependency to bun_pi_agent.
**Files:** bun_pi_agent/src/tools/image-tools.ts (new, ~320 lines), .agent/agents/studio-image.md (new), tool-registry.ts (+3 entries), tools/index.ts (+1 import), tools.test.ts (29→32 count), package.json (+bun_image dep).
**Tools:** image_generate (batch generation with facing enhancement), image_status (scan assets + flag missing manifests), image_characters (parse characters.ts + characters.md + manifest files).
**Design:** Duplicated minimal character-profile parsers from remotion_studio rather than importing server code into agent tools. Clean separation.
**Tests:** 17/17 tools tests pass. 32 total tools registered. All pre-existing tests unchanged.

## 2026-04-26 — Phase 56: Playwright E2E Tests + Pipeline→Storygraph Rename

**What:** Added 65 Playwright E2E tests covering all 13 WebUI pages. Renamed "Pipeline" tab to "Storygraph" with help tooltips and AI advisor. Extracted AdvisorPanelBase as shared component.
**Files:** 13 new e2e/*.spec.ts files, playwright.config.ts, e2e/helpers.ts, Storygraph.tsx (renamed from Pipeline.tsx + help + advisor), AdvisorPanelBase.tsx (new shared component), App.tsx (nav rename), Projects.tsx (-240 lines inline advisor).
**Tests:** 65 E2E tests pass, 198 bun tests pass (2 pre-existing failures). Test categories: smoke (15), dashboard (6), projects (8), agent-chat (4), benchmark (6), navigation (3), quality (3), monitoring (3), story-editor (3), assets/tts/render (6), workflows/image (4).
**Lessons:** (1) Playwright `getByText` can match multiple elements — use `getByRole("heading")` instead. (2) CSS `background` returns `rgb(r,g,b)` not hex — test with rgb values. (3) Playwright CWD matters — run with `--config` flag or from the config directory. (4) Agent chat tests depending on LLM response time are inherently flaky — test UI state changes, not LLM timing. (5) Server crashes during long test runs need server restart.
## 2026-04-25 — Phase 53-D/E: Agent Chat improvements + Story Advisor panel

**What:** Added conversation history (localStorage per agent, up to 200 msgs), retry on error (re-sends last user message, removes failed response), export as markdown download. Added AdvisorPanel component — collapsible sidebar on ProjectDetail that streams responses from studio-advisor or sg-story-advisor agent with series context pre-pended to prompts.
**Files:** AgentChat.tsx (refactored: loadHistory/saveHistory, handleSelectAgent, handleRetry, handleClear, handleExport, runStream extracted; isError flag on error messages), Projects.tsx (+AdvisorPanel component, ProjectDetail flex layout with sidebar).
**Design:** History is keyed per agent name in a single localStorage key as JSON. Retry removes the last user+error pair and re-sends from the same point — avoids partial context duplication. Export produces clean markdown with headers and metadata. AdvisorPanel is self-contained with its own streaming state, auto-discovers advisor agent by name.
**Honest assessment:** Clean, minimal additions. The AdvisorPanel reuses the same streamChat API — no new server routes needed. One future improvement: multi-turn context in the advisor (currently each prompt is stateless, only includes series ID prefix).

## 2026-04-25 — Phase 53-B: LLM Config API (SKIPPED)

**Decision:** Skipped Phase 53-B (LLM config API + Settings page). Reason: `bun_pi_agent` already reads config from env vars (`PI_AGENT_MODEL`, `getEnvApiKey()`). No need for a UI config layer — keep it simple, focus on building features (53-C "Build Episode" flow) rather than exploring LLM provider differences. Can always add later if truly standalone deployment is needed.

## 2026-04-25 — Phase 53-A: Agent-backed workflow engine

**What:** Added agent delegation to the workflow engine. When `agent: true` is passed in the trigger options, each workflow step delegates to a sub-agent via `runAgentTask()` instead of direct function calls. 7 step-to-agent mappings defined. Agent responses captured as `agentReport` in step status for UI display.
**Files:** `workflow-engine.ts` (~150 lines added: STEP_AGENT_MAP, buildStepPrompt, resolveAgentStepOutput, runAgentStep), `workflows.ts` (agent flag passthrough), `types.ts` (agentReport field).
**Design:** Used the proven pattern from `benchmark.ts` (Phase 52-D). Key insight: agents write artifacts to disk via their tools, then `resolveAgentStepOutput()` reads disk to produce step output compatible with existing path resolvers. Scaffold step detects created directory by naming convention + mtime scan. Safe resolver variants (`safeResolve*`) prevent early prompt-building failures when paths depend on prior steps.
**Honest assessment:** Clean implementation, backward compatible. TTS/render/image still use `pi-developer` fallback — Phase 54 will add dedicated agents. The prompt generation is straightforward but may need tuning once tested end-to-end with real agents.

## 2026-04-25 — Phase 52-E: Studio sub-agent definitions

**What:** Created 3 new studio-oriented agent definitions: studio-scaffold (5 tools, episode scaffolding), studio-reviewer (8 tools, quality review pipeline), studio-advisor (7 tools, story/content suggestions). Total agent library now 8 agents.
**Files:** `.agent/agents/studio-scaffold.md`, `studio-reviewer.md`, `studio-advisor.md`.
**Design:** Studio agents use domain-specific tool subsets — reviewer gets sg_pipeline/check/score/regression + rm_analyze/lint (strict quality), advisor gets sg_suggest/health + rm_analyze/suggest + Read/Grep/Glob (creative advisory), scaffold gets Read/Write/Bash/Grep/Glob (file creation). Reviewer uses glm-5 (more capable), others use glm-5-turbo (faster).
**Verified:** `--list-agents` shows all 8 agents with correct tool counts and model assignments.

## 2026-04-25 — Phase 52-D: Agent-backed workflow steps

**What:** Added opt-in agent delegation to Benchmark and Quality pages. Benchmark gets "Agent mode" checkbox — when enabled, POST /run delegates to sg-benchmark-runner agent instead of direct pipeline-api calls. Quality gets "Run Agent Quality Gate" button delegating to sg-quality-gate agent.
**Files:** benchmark.ts (+65 lines agent branch), Benchmark.tsx (agent toggle + report display), Quality.tsx (quality gate button + result), api.ts (agent param), types.ts (agentReport field).
**Design:** Agent tools write same artifacts to disk, so server reads gate.json after agent completes to build structured BenchmarkResult — UI stays identical. Agent report shown in green box below metrics. Fully backward compatible.
**Tests:** 198/200 pass (2 pre-existing failures).

## 2026-04-25 — Phase 52-C audit: already implemented

**What:** Audited Phase 52-C (Agent Chat page). Found it was already fully implemented alongside 52-A/B in a prior session — just not marked complete in roadmap.
**Files:** AgentChat.tsx (307 lines, agent selector + streaming + tool viz + abort), agent-bridge.ts (135 lines, lazy imports + event mapping), routes/agent.ts (109 lines, 4 endpoints), api.ts (streamChat SSE client), shared/types.ts (AgentInfo, AgentStreamEvent, AgentTaskResult).
**Assessment:** Implementation is solid. SSE streaming via POST+ReadableStream, proper abort handling, tool call expandable cards, bridge availability check. Roadmap updated to reflect completion.

## 2026-04-25 — Focus shift: /develop_bun_app leads Phase 52-54

**What:** User directed focus to `/develop_bun_app` skill. Key directives:
1. bun_pi_agent (20 tools + 5 agents) should drive remotion_studio — bridge them
2. pi_agent scoring/quality agents for examining storygraph data
3. Make remotion_studio run without claude-code, just needs LLM endpoint
4. Develop many sub-agents leveraging bun-pi-agent for the studio
5. Name "bun_webui" was too generic — already resolved (Phase 51 → remotion_studio)

**Action:** Added Phase 52-54 detailed TODOs to `develop_bun_app/TODO.md` as P0 tasks. Updated `NEXT.md` to reflect skill handoff: `/remotion-best-practices` owns strategic roadmap, `/develop_bun_app` owns code implementation.

**Architecture insight:** The bridge is same-process import of `createAgentFromDef()` + `discoverAgents()`. No subprocess overhead. The studio's Hono routes call agent-bridge.ts which directly uses bun_pi_agent's factory.

## 2026-04-25 — Phase 52-A/B: Agent bridge + routes (v0.9.0)

**What:** Built the same-process agent bridge connecting remotion_studio to bun_pi_agent. Created `agent-bridge.ts` with lazy imports + event mapping, and 4 API routes.

**Result:** 6 new tests pass, 200 total (197 pass, 3 pre-existing failures). Bridge works: discovers agents, runs tasks, streams SSE events.

**Files created:**
- `remotion_studio/src/server/agent-bridge.ts` — core bridge (lazy imports, runAgentTask, listAvailableAgents, isBridgeAvailable)
- `remotion_studio/src/server/routes/agent.ts` — Hono routes (GET /agents, GET /status, POST /chat SSE, POST /tasks)
- `remotion_studio/src/__tests__/agent-bridge.test.ts` — 6 route tests

**Files edited:**
- `remotion_studio/src/server/index.ts` — registered /api/agent route group
- `remotion_studio/src/shared/types.ts` — added AgentInfo, AgentStreamEvent, AgentTaskResult types
- `remotion_studio/src/client/api.ts` — added agent.getStatus(), listAgents(), startTask() methods

**Key design decisions:**
- **Lazy imports** — bun_pi_agent loaded on first API call, not at module scope. Avoids crash if no API key configured.
- **isBridgeAvailable()** — graceful degradation. Returns 503 if bridge can't load (missing key, broken import).
- **AgentStreamEvent union** — typed SSE events (text, tool_start, tool_end, turn_end, done, error) for browser consumption.
- **hono/streaming streamSSE** — used for /chat endpoint instead of manual ReadableStream construction.

## 2026-04-25 — Phase 51: bun_webui → remotion_studio rename

**What:** Renamed `bun_webui` to `remotion_studio` across the entire codebase — directory, package.json, workspace config, server log, and 10+ documentation/memory/skill files.

**Result:** Clean rename. `bun install` regenerated lockfile successfully. Zero remaining `bun_webui` references in active files (only archive files retain old name for historical accuracy).

**Files changed:** `bun_app/remotion_studio/` (directory + package.json + server/index.ts), root `package.json`, 3 memory files, 6 skill doc files, 1 bun_pi_agent TODO.

## 2026-04-25 — Strategic Pivot: Agent-Driven Studio

**What:** Designed Phases 51-54 roadmap for transforming remotion_studio + bun_pi_agent into an autonomous video production studio. Key architectural decision: same-process integration (import agent factory directly) over subprocess (ACP JSON-RPC) for initial speed.

**Vision:** `remotion_studio` (renamed from bun_webui) becomes the frontend that drives `bun_pi_agent`, which orchestrates 10+ specialized sub-agents. Only an LLM endpoint needed — no claude-code, no human in the loop for standard workflows.

**Phase chain:** 51 (rename) → 52 (agent bridge API + Chat page) → 53 (standalone mode + "Build Episode") → 54 (expanded sub-agent library).

**New sub-agents planned:** studio-scaffold, studio-reviewer, studio-advisor, studio-tts, studio-render, studio-image, studio-coordinator. The coordinator agent uses spawn_task to delegate — matching the same pattern as the existing sg-benchmark-runner.

**Assessment:** The same-process approach is pragmatic for Phase 52 but won't scale for concurrent agent tasks. Phase 53+ will need subprocess isolation or worker threads. The LLM config UI (Phase 53-B) is critical — without it, the user still needs to set env vars manually, defeating the "standalone" goal.

## 2026-04-25 — Phase 50: Remotion Content Tools## 2026-04-25 — Phase 50: Remotion Content Tools

**Built:** 3 new rm_* tools (rm_analyze, rm_suggest, rm_lint) + rm-content-analyst agent. Total tools: 17→20, tests: 263→283.

**rm_analyze** reads a single episode: parses `dialogLines[]` from `.tsx` files via two-pass regex, reads `audio/durations.json` for timing, `audio/voice-manifest.json` for voice assignments. Hybrid: checks storygraph_out first.

**rm_suggest** scans all episodes in a series: discovers episode dirs via `/-ch(\d+)-ep(\d+)$/` pattern, collects character appearances and durations, identifies gaps (character underuse, pacing outliers, gag stagnation).

**rm_lint** checks 6 rules: naming (Composition ID, NUM_SCENES), staticFile (image vs audio), animation (no CSS transitions), imports (shared vs legacy), assets (file existence), structure (TransitionSeries, durations match).

**Assessment:** The two-pass regex approach for dialog parsing is pragmatic but fragile — optional fields like `effect`, `sfx` arrays, and multi-line objects make regex unreliable. For production use, an AST-based parser (using Bun's built-in TypeScript parser) would be more robust. The lint rules are conservative (false negatives over false positives), which is the right initial approach.

**Key learning:** The `parseDialogLines` function isolates the array block first (bracket depth counting), then extracts individual entries. This two-pass approach handles multi-line entries better than a single mega-regex.

## Phase 47: Multi-Agent Definition System (2026-04-25)

**What:** Implemented complete multi-agent definition system for bun_pi_agent. Agents defined as `.agent/agents/*.md` with YAML frontmatter (name, description, tools, model, skills) + body as custom prompt. 4 predefined agents created.

**Implementation:**
- `src/agents/` — 5 new modules (types, parser, tool-registry, factory, index)
- `src/agent.ts` — refactored to delegate to factory with `setAgentDefinition()` override
- `src/index.ts` — `--agent <name>` and `--list-agents` CLI flags
- `.agent/agents/` — 4 predefined agent definitions

**Key decisions:**
- Used module-level variable (`activeDef`) in agent.ts instead of globalThis — cleaner dependency injection
- Tool registry maps friendly names (Read, sg_pipeline) to factory functions — easy to extend
- discoverAgents scans both project-level and user-level dirs, deduplicates by name (first wins)
- Parser is simple key:value YAML — no nesting needed for agent definitions
- Backward compatible: no `--agent` flag = exact same behavior as before

**What's next:** Phase 48 (spawn_task for subagent invocation) or Remotion analysis tools. The story-advisor agent is ready but needs Remotion-specific content analysis tools to be truly useful — currently it can only read storygraph data and source files, not analyze scene structure or dialog quality.

## Multi-Agent Architecture Planning (2026-04-25)

**What:** Planned Phase 47 (agent definition system) and Phase 48 (subagent invocation) for pi-agent. Inspired by Claude Code's `.claude/agents/` pattern.

**Key insight:** Claude Code agents are markdown files with YAML frontmatter (name, description, tools whitelist, model override, skills filter). The body becomes the agent's system prompt. Agents can be invoked via `--agent <name>` flag or as subagents via `spawn_task` tool.

**Design decisions:**
- Use `.agent/agents/*.md` (not `.claude/agents/`) — matches existing `.agent/skills/` convention
- Tool whitelisting by name (Read, Write, sg_suggest, etc.) — simple string matching
- No denylist needed initially — whitelist covers the use case
- `spawn_task` in Phase 48 enables agent-to-agent delegation
- 4 predefined agents: story-advisor, quality-gate, benchmark-runner, developer

**Risk:** pi-agent-core's Agent class may have constraints on runtime tool injection or context isolation for subagents. Need to test `agent.prompt()` for subagent pattern in Phase 48.

## Phase 46: Proactive Storygraph Tools (2026-04-25)

**What:** Added `sg_suggest` (8 analyzers, prioritized suggestions) and `sg_health` (6 dimensions, debt count) to the pi-agent toolkit. These tools read existing `storygraph_out/` artifacts — no pipeline runs needed, sub-second execution.

**Why:** Storygraph was purely reactive (check quality AFTER writing). The pi-agent needed proactive tools to tell writers what to address BEFORE writing the next episode.

**Key design decisions:**
- Pure programmatic analysis (no AI calls) — fast, deterministic, no API cost
- 8 analyzer functions in pipeline-api.ts, each returning `Suggestion[]`
- `runHealth()` internally calls `runSuggest()` to detect flat-arc characters as debt items
- Reused trait extraction pattern from graphify-check.ts as inline code (can't import from CLI script)

**Tests:** 227 pass (was 221). Tool count: 7→9 storygraph, 14→16 total.

**Files:** `storygraph/src/pipeline-api.ts` (+~450 lines), `bun_pi_agent/src/tools/storygraph-tools.ts` (+~80 lines), `storygraph-tools.test.ts` (+6 tests), `storygraph-benchmark.md` (Steps 5.5-5.6).

## Scaffold Template Verification + Commit (2026-04-25)

**What:** Verified and committed the episodeforge template fixes from pipeline reflection session. All 4 fixes confirmed: audio paths, staticFile→require, DialogBox API, ComicEffects API.

**Verification:** 75 episodeforge tests pass. Diffed template output against ch3-ep1 production code — APIs match. Series-specific DialogBox (my-core-is-boss/assets/components/) doesn't require `getCharacterConfig` (uses series' own CHARACTERS object), so template is correct.

**Assessment:** Templates are now current. The `type="achievement"` bugs in ch2-ep3 and ch3-ep1 were manual mistakes during episode writing, not template issues. No further template changes needed. Next task: Ch3-Ep2 (隱藏關卡).

---

## develop_bun_app v1.3.0 — develop op workflow (2026-04-25)

**What:** Rewrote `operations/develop.md` from a pattern cookbook into a structured 5-step workflow.

**Before:** 5 patterns (module, CLI args, config, routes, fixtures) listed with no decision logic. Claude reads it as reference material, not a workflow.

**After:**
- Step 1: Identify change type (7 types: new-module, new-route, new-cli-flag, new-config, new-tool, bugfix, refactor)
- Step 2: Plan the change (state files/exports/tests before coding, confirm if 3+ files)
- Step 3: Implement (per-change-type recipes)
- Step 4: Test
- Step 5: Update docs (PLAN.md module table + TODO.md)

**Key additions:** `new-tool` change type (was missing), confirmation gate for 3+ file changes, explicit "plan before code" step.

**Assessment:** The develop op now matches the Command→Inputs→Outputs→Validation structure that storygraph operations use. P0 task resolved. Next skill improvement would be P1 (parameterized scaffold or scaffold.ts script).

---

## Pipeline Reflection (2026-04-25)

**What:** Comprehensive review of all bun apps, skills, and pipeline components.

**Fixes applied:**
1. **episodeforge template** — Fixed 4 issues in `templates.ts`:
   - `staticFile(audio)` → `require()` for audio (would cause render failure on every new scaffold)
   - `../public/audio/` → `../audio/` in Root.tsx and ContentScene paths (no `public/` prefix)
   - Old DialogBox API → new `lines/sceneFrame/sceneDuration` API
   - Old ComicEffects API → new `effects/normalizeEffects` array pattern
   - 75 episodeforge tests pass after fixes
2. **SystemNotification defensive guard** — Added `?? typeColors.mission` fallback in all 4 copies (shared, my-core-is-boss, weapon-forger, galgame-meme-theater). Invalid type values now default to "mission" colors instead of crashing at render time.
3. **bun_pi_agent TODO** — Updated Phase 3 items to reflect Phase 44-45 completion. Removed duplicate entries. Status bumped to v0.6.0, 221 tests.

**Issues identified but not fixed:**
- my-core-is-boss storygraph regression (gate 100→80) — known, caused by ch2-ep3 addition, will be recalculated when ch3-ep1 is included in next pipeline run
- develop_bun_app skill missing knowledge capture protocol — deferred
- Skill docs not cross-linked — low priority

---

## Ch3-Ep1 — 速通記錄 (2026-04-25)

**What:** Scaffolded my-core-is-boss ch3-ep1 (速通記錄). noclip穿牆=虛空漫步, 3:07秒速通三千年秘境. 5 scenes, 35 TTS segments, storygraph gate 100/100 PASS. Rendered 152M, 10841 frames, 6:01.

**Assessment:** Clean scaffold. Story feels fresh — noclip is a good new gag, 趙小七's timer gadget is a nice escalation from static notebooks. Xiao Elder trying to walk through the wall and claiming "routine inspection" is a strong comedy beat. ContentScene3 has 3 characters on screen simultaneously which matches the established pattern.

**Bug found during render:** `type="achievement"` on SystemNotification in ContentScene2 — only `mission|warning|success|info` are valid. Same class of bug as ch2-ep3 (noted in Phase 42 reflections). The SystemOverlay component doesn't validate the type prop — it silently returns `undefined` from the color lookup, causing `Cannot read properties of undefined (reading 'accent')` at frame 3578.

**Audio durations:** [661, 1919, 2936, 3728, 1657] = 10,901 frames ≈ 6:03 at 30fps (minus transitions). Longer than ch2-ep3 (7:10) — ContentScene3 is the longest at ~2:04.

**What's next:** Ch3-Ep2 (隱藏關卡 — 查看代碼).

---

## Phase 45 — Web UI Benchmark Page (2026-04-25)

**What:** Added Benchmark page to remotion_studio with 5 API endpoints and React frontend. Follows existing patterns from Pipeline.tsx and Quality.tsx exactly.

**Key decisions:**
- Server routes import pipeline-api.ts directly (same pattern as pipeline.ts route) — no dependency on bun_pi_agent tools.
- `/run` endpoint is a multi-step job with progress callbacks (5% → 30% → 60% → 75% → 95% → 100%).
- Regression check is synchronous (fast file reads) — no job needed.
- Baseline management uses `copyFileSync` — same as sg_baseline_update tool.

**Files created:** benchmark.ts (routes), Benchmark.tsx (page). Files modified: types.ts, api.ts, App.tsx, server/index.ts.

**Pre-existing test failures:** export-import round-trip and image API timeout — unrelated to benchmark changes.

## Phase 44-D — CI integration (2026-04-25)

## Phase 44-D — CI integration (2026-04-25)

**What:** Added `ci: true` parameter to `sg_regression` tool for structured JSON output + exitCode in details. Created `src/ci.ts` standalone CI entry point: runs pipeline → check → regression, outputs JSON, exits 0/1.

**Key decisions:**
- `sg_regression` with `ci: true` returns JSON for ALL paths (no-baseline, no-gate, regression result), not just the happy path.
- CI script (`ci.ts`) is a standalone entry point, not integrated into the agent's interactive CLI. Follows review-agent/cli.ts pattern.
- No-baseline exits 0 (not an error, just informational). No-gate exits 1 (pipeline failed to produce output).

**Test count:** 221 tests (3 new: ci JSON output, ci error dir, non-ci text format). All pass.

**Bug caught:** Relative import path `../storygraph/` from `src/` resolves to `bun_pi_agent/storygraph/` not `bun_app/storygraph/`. Needed `../../storygraph/`. Same issue doesn't affect `src/tools/` because it uses `../../../`.

## Phase 44-C — Baseline management tools (2026-04-25)

**What:** Added `sg_baseline_update` and `sg_baseline_list` tools to storygraph-tools.ts. Updated benchmark skill to use sg_baseline_list for series discovery instead of bash find.

**Key decisions:**
- `sg_baseline_list` discovers series by looking for PLAN.md in subdirectories (same convention as episode setup). Falls back to `bun_remotion_proj/` under workDir.
- `sg_baseline_update` uses `copyFileSync` — atomic, no race condition.
- Both tools read gate.json directly (no pipeline-api dependency), keeping them lightweight.

**Tool count:** 12 → 14 (7 base + 7 storygraph). All 218 tests pass.

## Phase 44-B — storygraph-benchmark skill (2026-04-25)

**What:** Created `.agent/skills/storygraph-benchmark.md` — autonomous benchmark workflow system prompt for bun_pi_agent. 7-step workflow: discover → status → pipeline → check → regression → score → report.

**Key decisions:**
- Placed skill at repo root `.agent/skills/` (not inside bun_pi_agent) so it's found regardless of cwd. The skill loader scans both `.claude/skills` and `.agent/skills` relative to workDir.
- Skill is a markdown file read on-demand by the agent — the system prompt only includes metadata (name/description/location). Full content loaded when agent encounters `/benchmark` trigger.
- pi-coding-agent doesn't parse `trigger` frontmatter field — triggers are convention, not enforced by the loader.

**Tests:** 4 new tests in `src/__tests__/skills.test.ts` (skill loads, has correct fields, appears in prompt section, file is readable). All 214 tests pass.

## Phase 44 Planning — Autonomous Storygraph Benchmark (2026-04-25)

**What:** Planned bun_pi_agent Phase 3 (Autonomous Storygraph Benchmark) as strategic Phase 44. Ran storygraph on my-core-is-boss, verified quality tiers work, discovered regression.

**Regression discovery:** my-core-is-boss score dropped 100→80 after adding ch2-ep3 in commit 65f7190. Root cause: new episode content, not pipeline bug. Regression runner correctly caught -20 delta with 10% threshold. 24 WARNs (Trait Coverage, Interaction Density, Community Cohesion) + 1 FAIL (Plot Arc: no climax beat).

**Quality tier verification:**
- Tier 0 (programmatic): 13+ checks, gate.json v2 — WORKS
- Tier 1 (GLM AI): blended 0.4×prog + 0.6×AI — WORKS
- Tier 2 (Claude/Claude Code review): structured rubric — WORKS
- Regression runner: baseline comparison with --ci — WORKS

**Architecture decision:** bun_pi_agent can import `pipeline-api.ts` directly (same Bun workspace). No subprocess overhead, no claude-code needed. The chain: `sg_pipeline → sg_check → sg_regression → review-agent → sg_status` all runs via agent tools.

**Roadmap chain:** Phase 43 (review agent, done) → Phase 44 (autonomous benchmark) → Phase 45 (Web UI integration). This closes the loop: the agent that reviews quality can now also run the pipeline and detect regressions autonomously.

**Key files for Phase 44:**
- `bun_app/storygraph/src/pipeline-api.ts` — runPipeline, runCheck, runScore, getPipelineStatus (importable)
- `bun_app/bun_pi_agent/src/review-agent/` — Phase 43 review agent (reuse for Tier 2)
- `bun_app/storygraph/src/scripts/graphify-regression.ts` — Baseline comparison logic
- `bun_app/storygraph/test-corpus/baselines/` — 5 series baselines

---

## Phase 42 — my-core-is-boss ch2-ep3 (2026-04-24)

**What:** Created and rendered my-core-is-boss ch2-ep3 (技能點分配). Episode was already scaffolded with narration written. Main work was rewriting 5 template scene files to production code.

**Pipeline validation:** Cross-series E2E pipeline works. No new images needed — all character emotions (linyi 7, zhaoxiaoqi 5, xiaoelder 5) and backgrounds (sect-plaza, sect-training) already existed.

**Bugs found:**
1. Scaffolded Root.tsx had wrong audio path: `../public/audio/durations.json` instead of `../audio/durations.json`
2. Scaffolded ContentScene files used old DialogBox API (character/text/lineIndex props) instead of current API (lines/sceneFrame/sceneDuration)
3. Scaffolded ContentScene files had wrong segment-durations path: `../../public/audio/` instead of `../../audio/`
4. Used `type="achievement"` on SystemNotification — only `mission|warning|success|info` are valid

**Assessment:** Pipeline is mature enough for cross-series episodes. No fundamental blockers. The main friction is scaffold template quality — episodeforge generates old-API code that needs manual rewriting. A scaffold update to use current DialogBox/component APIs would save ~30 min per episode.
---

## Phase 43: Review Agent CLI (2026-04-24)

- **Built standalone GLM5-turbo review agent** in `bun_app/bun_pi_agent/src/review-agent/` (6 files).
- **No cross-app dependency** — reimplemented stripMarkdownFence/repairTruncatedJSON (~30 lines) rather than importing from storygraph.
- **Narration extraction via regex** — reads narration.ts as text, extracts `text:` fields. Avoids dynamic TS import issues.
- **6 review dimensions**: semantic_correctness, creative_quality, genre_fit, pacing, character_consistency, regression_vs_previous.
- **Smoke tested on both series**: weapon-forger → BLOCK 2.5/10 (gate score 0, 50 warnings), my-core-is-boss → APPROVE_WITH_FIXES 6.3/10 (gate 100, reasonable).
- **198 tests pass** (18 new). All existing bun_pi_agent tests still green.
- **Bugs found**: repairTruncatedJSON can't fix unterminated strings without a comma to cut back to — expected limitation.
- **Deferred**: storygraph CLI integration and WebUI route (43-E). Standalone CLI works, integration can wait.

---

## Phase 41-C: Roadmap Refactor (2026-04-24)

- **Always-loaded content reduced 83%** — SKILL.md + NEXT.md: 775 → 132 lines. NEXT.md 708→65, TODO.md 388→56, PLAN.md 795→126.
- **REFLECTIONS.md created** — 344 lines of historical session logs extracted from NEXT.md. On-demand only.
- **PLAN-archive.md expanded** — Phase 31-39 specs (+261 lines). Covers three-tier quality pipeline, Web UI foundation, category system.
- **TODO-archive.md expanded** — Phase 33-D through 40-G completed items (+175 lines).
- **SKILL.md updated** — Reflections now go to REFLECTIONS.md, not NEXT.md. Strategic Roadmap table updated.
- **Post-run operation updated** — develop_bun_app/operations/post-run.md documents REFLECTIONS.md pattern for skill docs.
- **Honest assessment:** PLAN.md at 126 lines exceeds the 100-line target because Phase 43's architecture section (ReviewResult schema, CLI design, key decisions) is inherently verbose. Could trim by removing code blocks but that would reduce the spec's usefulness. The real win is the always-loaded metric: 775→132 lines means ~640 fewer tokens consumed per session. The REFLECTIONS.md pattern should scale — as more work happens, only NEXT.md grows (by ~2 lines per completed phase in the table), not the reflections.

## Goal Reflection: Storygraph Progress

### What's DONE (strong):
- **Core extraction pipeline:** Regex + AI + Hybrid modes, genre-aware (xianxia_comedy, galgame_meme, novel_system)
- **Quality gate:** Tier 0 (programmatic 13+ checks) + Tier 1 (GLM scoring) + Tier 2 (Claude review)
- **Visualization:** vis.js HTML with community detection, PageRank, cross-links
- **CLI:** `storygraph` CLI with CI mode, score, write-gate, parse-plan, validate-plan
- **Category system:** 7 video categories, scene templates, category-aware scaffolding (episodeforge)
- **Episode pipeline:** Workspace-first enforcement, PLAN/TODO lifecycle, graphify quality gate
- **KG feedback loop:** Context injection (Phase 32-A) + enrichment + calibration (Phase 32-B) — structurally closed
- **Evaluation framework:** Regression runner, tier comparison, cost matrix, model benchmark (Phase 33-G/28-B/31-B)
- **Documentation:** CI guide (33-C3), deploy mode + hybrid mode workflow (33-H), category guide (34-D)

### What's NOT done:
1. **Phase 33-F3 — Deploy automation story draft (0%):** GLM creative writing for zh_TW dialog. Experimental — quality uncertain.
2. **Phase 33-D — Feedback loop calibration:** Track suggestion→score correlations. Needs more episode data.

### What's partially done:
- **Phase 32-B calibration:** Structurally complete but needs more episodes across series to produce actionable correlations. weapon-forger shows 4/8 sections never populated.

---

## Batch Character Generation (2026-04-24)

- **13 character images generated** via CDP bridge → Chrome → z.ai. All 13 succeeded, 0 failed, ~8 minutes total.
- **zhoumo** 4 emotions: angry, nervous, shocked, smirk (177-248KB each)
- **luyang** 4 emotions: angry, nervous, shocked, smirk (177-214KB each)
- **mengjingzhou** 4 emotions: angry, nervous, shocked, smirk (188-234KB each)
- **soul** base image created — 滄溟子 remnant soul (236KB, ghostly purple ethereal appearance). New manifest JSON created.
- **CDP bridge improved** — Added `ensureLoggedIn()` that auto-detects OAuth authorize pages and either auto-clicks authorize or fails fast with `NOT_LOGGED_IN` error. Previously the bridge silently hung forever on auth redirects.
- **Login-check feedback saved** to `.agent/memory/feedback/cdp-login-check.md`
- **Honest assessment:** The emotion images (177-248KB) are smaller than the original base images (820KB-1.6MB) — likely different resolution or source quality. The z.ai generated images are consistent within each character set. The soul.png is ethereal/ghostly which matches the narration description but may not work well for DialogBox display (too translucent). The CDP bridge is robust now — login detection + auto-authorize means future batch runs won't silently hang.

## WF-CH3-EP2: weapon-forger ch3-ep2 智商測試 (2026-04-24)

- **Story draft** — Continues ch3-ep1 cliffhanger (self-destruct countdown). Characters: zhoumo, luyang, mengjingzhou. Running gags: 忘加按鈕 (IQ test question is "you forgot the stop button"), 現代科技用語 (CT scan, MVP, iteration, product philosophy), 法寶反噬 (laser pen becomes test content).
- **narration.ts** — 4 scenes, 33 segments. VOICE_MAP with uncle_fu for all characters.
- **Scene files rewritten** — TitleScene (subtitle "智商測試"), ContentScene1 (secret-realm bg, countdown timer, hidden subsystem discovery), ContentScene2 (cave bg, crystal ball IQ test, green flash on correct answer, escape), OutroScene (credits + teaser for ch3-ep3).
- **WeaponForgerCh3Ep2.tsx fixed** — Replaced `staticFile()` audio with `require()`, added `name` props to all Sequences, fixed `wipe()` props (removed width/height).
- **remotion.config.ts created** — `Config.setPublicDir("../assets")` for shared image serving.
- **TTS generated** — Qwen3-TTS via mlx_tts, 4 WAV files (13.3MB total). durations.json: [951, 2667, 3435, 1369] frames.
- **Rendered** — 154MB MP4, 8377 frames, ~280s (4min 39sec). Output: `out/weapon-forger-ch3-ep2.mp4`.
- **Honest assessment:** The episode uses all existing assets (no new images needed). The dialog mixes narrator descriptions with character interactions well. The countdown timer, crystal ball glow, and green flash for correct answer add visual variety. Main limitation: all characters use the same `uncle_fu` voice — indistinguishable in multi-character scenes. The narrator dialog lines in ContentScene1/2 were mapped to "zhoumo" for DialogBox display since narrator isn't in CHARACTERS config — this is a minor visual inconsistency (zhoumo avatar shows during narrator text).

## Phase 41-A: Character Profile System (2026-04-22)

- **character-profiles.ts service** — Reads 3 data sources per series (manifest JSONs for prompts/variants, characters.md for appearance, characters.ts for metadata). Merges into `CharacterProfile[]` with graceful degradation.
- **GET /api/image/characters** — New endpoint returning character profiles for a series.
- **POST /api/image/generate enhanced** — Accepts `enhanceWithCharacter: { facing }` to wrap prompts through `buildCharacterPrompt()` (was imported but never called).
- **ImageGen.tsx updated** — Character selector dropdown, facing toggle (LEFT/RIGHT), variant gallery with thumbnails, auto-populate prompt from basePrompt/appearance, auto-prefix filename.
- **Image.z.ai CDP generation verified** — Connected to Chrome via CDP, filled prompt, clicked 开始生成, downloaded result (1280x1280, 286KB). Key: must use `textarea.fill()` not `evaluate`, detect completion by `img[alt="Generated"]` not download button.
- **Honest assessment:** The character profiles service works for weapon-forger (7 chars, 20 manifest JSONs) and my-core-is-boss (4 chars, 22 manifests). galgame-meme-theater has no manifest JSONs so only gets names/appearance from characters.md. The `buildCharacterPrompt()` enhancement adds facing direction + magenta background + anime style on the server side. The variant gallery relies on `/api/assets/file/` endpoint which serves images from the filesystem.

## Phase 40-A/B/C/D/E/F/G: WebUI E2E Verification (2026-04-22)

- **40-A:** WebUI dev server (Hono :5173 + Vite :3000) started. All 11 pages load. Fixed Workflows.tsx JSX bug (orphan `</div>`).
- **40-B:** Scaffold ch3-ep2 via API — 11 files created. Bug found: dry-run mode creates real files.
- **40-C:** Pipeline run — weapon-forger 8 eps, 300 nodes, gate 0/100 (empty ch3-ep2 dragged score down).
- **40-D:** Image gen via CDP bridge. Bun WebSocket incompatible → Node.js subprocess bridge. test-warrior.png 197KB 1280x1280.
- **40-E:** TTS — MLX engine, 4 scenes, 4 WAV files (7.5MB), durations.json.
- **40-F:** Render — 86MB MP4, 304s video.
- **40-G:** Full workflow — image (z.ai CDP) + TTS (MLX) + render (152.6MB MP4, 8146 frames).
- **Honest assessment:** The CDP approach works but requires user to manually start Chrome with debugging flag. The persistent mode fallback exists but Google's automation detection makes it unreliable. The full pipeline is verified end-to-end through the WebUI.

## Workflow Image Step Integration (2026-04-22)

- **workflow-engine.ts** — Added `case "image"` to `runStep()`: resolves seriesDir, calls `generateImageBatch()` with progress callbacks and skip-existing. Extended `WorkflowTriggerOptions` with `images[]`, `imageOutputDir`, `skipExistingImages`. New template `image-tts-render`.
- **15 workflow tests pass**.

## bun_app/bun_image/ (2026-04-22)

- **image-engine.ts** — `ZaiImageEngine` class wrapping Playwright browser automation for image.z.ai. CDP mode + persistent mode.
- **image-pipeline.ts** — `generateImage()` + `generateImageBatch()` with skip-existing, progress callbacks, metadata companion files.
- **url-utils.ts** — `extractImageUrl()`, `sanitizeFilename()`, `buildCharacterPrompt()`, `buildBackgroundPrompt()`.
- **WebUI route + page** — image.ts routes + ImageGen.tsx page with series selector, asset type toggle, prompt textarea, aspect ratio picker.
- **29 new tests** (15 url-utils + 8 pipeline + 6 API). **709 total tests pass**.

## Phase 37-B+: Quality Dashboard Enhancements (2026-04-21)

- **quality-comparison.ts service** — Cross-series comparison, regression alerts, score history.
- **Quality.tsx page redesigned** — Two-view layout: Cross-Series + Per-Series with regression alerts, AI dimensions, score history.
- **15 new tests**, 185 webui total.

## Phase 36-B: Story Editor (2026-04-21)

- **plan-editor.ts service** — Reads/writes PLAN.md from series directories. 6 functions.
- **plans.ts routes** — 6 endpoints for plan CRUD.
- **StoryEditor.tsx page** — Series selector, 3 view modes (Sections/Edit/Preview), auto-save 1.5s debounce.
- **13 new tests**, 168 webui total.

## Phase 39-A5: Export/Import (2026-04-21)

- **export-import-service.ts** — Export captures series metadata, PLAN.md, episodes, quality data, automation rules. Import validates + creates with skip-on-exist safety.
- **4 API endpoints** (list/export/download/import). **22 new tests**, 652 total.

## Phase 39-A4: CI/CD Integration (2026-04-21)

- **webhook-service.ts** — HMAC-SHA256 auth, delivery log. **scheduler-service.ts** — Interval cron, tick loop, persistent schedules.
- **15 endpoints total** (5 webhook + 10 schedule). **39 new tests**, 627 total.

## Phase 39-A3: Monitoring Dashboard (2026-04-21)

- **monitoring.ts service** — Series health aggregator (gate/blended/completion/trend/activity).
- **Monitoring.tsx page** — Summary cards, series health table, activity log.
- **8 new tests**.

## Phase 39-A2: Automation Rules (2026-04-21)

- **automation-rules.ts** — Rule engine with CRUD, 3 trigger types (`plan_changed`, `quality_passed`, `scaffold_complete`), cooldown enforcement.
- **file-watcher.ts** — Bun FileSystemWatcher watching PLAN.md with 30s debounce.
- **24 new tests**, 583 total.

## Phase 39-A1: Workflow Templates (2026-04-21)

- **workflow-engine.ts** — 4 templates: `full-pipeline`, `scaffold-and-pipeline`, `quality-gate`, `tts-and-render`.
- **Workflows.tsx page** — Template selector + per-step progress with SSE streaming.
- **13 new tests**, 559 total.

## Phase 38-A/B: Asset Management + TTS/Render (2026-04-21)

- **asset-scanner.ts** — Scans characters, backgrounds, audio per series.
- **Assets.tsx** — Image grid with modal, audio player grouped by episode.
- **TTS + Render API + pages** — tts.ts route, render.ts route, TTS.tsx, Render.tsx pages.
- **20 + 16 new tests**, 546 total.

## Phase 37-A: Pipeline + Quality UI (2026-04-21)

- **Pipeline routes** — GET status, POST run/check/score with job queue.
- **Quality routes** — GET gate + quality score combined.
- **Pipeline.tsx + Quality.tsx pages** — Series selector, job progress, score cards, check table.
- **9 new tests**, 510 total.

## Phase 36-A: Project CRUD (2026-04-20)

- **project-scanner.ts** — Scans 5 series, auto-detects categories, reads gate scores.
- **Projects.tsx** — List/detail/create views with scaffold wizard.
- **12 new tests**, 500 total.

## P0: CLAUDE.md Token Efficiency Refactor (2026-04-21)

- **CLAUDE.md reduced from 237 → 107 lines (55% reduction).** Moved 3 sections to on-demand memory files:
  - `project/project-structure.md` — Full file tree + bun_app/ section
  - `project/remotion-api-reference.md` — Remotion API table + package.json notes
  - `feedback/_index.md` — 39 feedback entries organized by topic
- **What stays in CLAUDE.md:** Quick Reference, Commands, Video Categories, Post-clone setup, CRITICAL cd rules, Memory convention.

## Phase 35-C1/C2: Script Module Exports (2026-04-20)

- **35-C1: episodeforge scaffold module** — Extracted `scaffold()` from CLI-only into importable module. 6 tests.
- **35-C2: storygraph pipeline API** — `pipeline-api.ts` with 4 exportable functions (getPipelineStatus, runScore, runPipeline, runCheck). 3 tests.
- **409 tests pass** across 22 files.

## Phase 35-B: React SPA + Dashboard (2026-04-20)

- **Vite + React setup** — App.tsx with 7-page sidebar nav, proxy to Hono.
- **Dashboard page** — Server health badge, job queue table, SSE progress bar.
- **147KB JS bundle** (47KB gzipped).

## Phase 35-A: Hono API Server (2026-04-20)

- **bun_app/remotion_studio/** scaffold — Hono app with CORS, health endpoint, job CRUD with SSE streaming.
- **Job queue middleware** — In-memory JobQueue with progress callbacks.
- **Shared types** — Project, Episode, Job, GateResult, Pipeline types.

## Phase 33-F3: Story Draft Generator (2026-04-20)

- **buildStoryDraftPrompt()** — Generates zh_TW dialog from KG constraints. Genre-specific style guides.
- **buildStoryQualityPrompt()** — Self-evaluation across 8 dimensions with anti-inflation instruction.
- **graphify-story-draft.ts orchestrator** — Loads KG context → generates draft → evaluates.
- **30 new tests**, 480 total.
- **Honest assessment:** Untested with actual AI calls. Key risks: GLM-5 malformed JSON, generic dialog, self-evaluation not correlating with human judgment.

## Phase 33-D: Feedback Loop Calibration (2026-04-20)

- **graphify-review.ts** — Tier 2 quality review tool (template + AI modes).
- **suggestion-log.ts** — Fix suggestion tracking with status and delta computation.
- **Cross-project smoke tests** — 34 tests validating all 5 series pipeline output.
- **Regression score trending** — --trend flag for regression runner.
- **Quality examples reporter** — Per-series AI extraction summary.
- **57 new tests**, 450 total.

## Phase 33-I: my-core-is-boss Storygraph Rebuild (2026-04-20)

- **Full pipeline run** in hybrid mode: 5 episodes, 173 nodes, 315 edges, 40 link edges, 8 communities.
- **Gate v2.0:** 100/100 (22 PASS, 16 WARN, 1 FAIL). Blended: 74.8% (ACCEPT).
- **5-series regression suite complete**.

## Graph HTML Info-Panel Scrollbar + Expand-Neighbors Fix (2026-04-20)

- **CSS scrollbar fix** — `#info-panel` flex layout fix, 40vh cap, custom scrollbar styling.
- **Expand-neighbors button fix** — Replaced broken inline onclick with clean global `expandNeighbors()` function.

## Graph HTML Overflow Fix + Playwright Debugging (2026-04-20)

- **Overflow bug fixed** — `#graph` overflow hidden, word-break on info content, neighbor pill truncation, widthConstraint on nodes.
- **Playwright debugging workflow** established for vis.js graph HTML.

## Phase 33-C3: CI Integration Guide (2026-04-20)

- **ci-guide.md created** — GitHub Actions, pre-commit hooks, regression baselines, multi-series matrix patterns.

## Phase 28-B: Model Benchmark (2026-04-20)

- **graphify-model-bench.ts** — Multi-model benchmark with accuracy sampling, reliability runs.
- **19 new tests**, 393 total.

## Phase 31-B1: Regression Test Corpus Curation (2026-04-20)

- **4 series baselines** (weapon-forger, storygraph-explainer, galgame-meme-theater, xianxia-system-meme).
- **All 4 series PASS regression** — 0% delta.

## Phase 33-G: Evaluation Framework (2026-04-20)

- **graphify-regression.ts** — Regression runner with CI mode, baseline updates, threshold override.
- **graphify-tier-compare.ts** — Cross-series comparison table generator.
- **graphify-cost-matrix.ts** — Pipeline step timing tracker.
- **40 new tests**, 374 total.

## Phase 33-F4: Narration + TODO Generators (2026-04-20)

- **gen-narration.ts** — Generates narration.ts from scene data. 3 templates (narrative_drama, tech_explainer, galgame_vn).
- **gen-episode-todo.ts** — Generates episode TODO.md from PLAN.md. Category-specific checklists.
- **18 new tests**, 334 total.

## Phase 32-B: KG Enrichment + Prompt Calibration (2026-04-20)

- **graphify-enrich.ts** — Post-render KG enrichment (actual durations vs predictions).
- **prompt-calibration.ts** — Track 8 KG prompt features, correlate with quality scores.
- **weapon-forger:** 7 episodes, 28 scenes enriched. 4/8 sections never populated.
- **19 new tests**, 316 total.

## storygraph-explainer Full Rebuild + Bug Fixes (2026-04-19)

- **Full pipeline rebuild** — 127 nodes, 144 edges, 5 link edges, 7 communities, score 100/100.
- **CLI CWD bug FIXED** — Flag values resolved as paths. Fix: explicit flag-value pair handling.
- **Plot Arc SKIP for narrator-only** — tech_explainer has no dramatic arc.
- **Duplicate node issue identified** — Hybrid mode creates duplicate scene/tech_term nodes (~10% inflation).

## Phase 32-A: KG Context Injection (2026-04-19)

- **buildRemotionPrompt()** — 8-section zh_TW constraint prompt from KG data.
- **kg-loaders.ts** — 8 server-side loaders for KG data.
- **297 tests pass** (26 new).

## storygraph-explainer Phase 2: Hybrid Mode Fix (2026-04-19)

- **Three fixes to ai-client.ts:** Greedy fence stripping, truncated JSON repair, maxTokens=4096.
- **Hybrid vs regex:** 83→131 nodes (+58%), 88→149 edges (+70%), 0→8 communities. Score 100/100.

## storygraph-explainer Reset — Storygraph-First Pipeline (2026-04-19)

- **Deleted entire storygraph-explainer**, redesigned as 3 episodes.
- **New approach:** Write narration.ts first, run storygraph extraction, validate node richness, THEN scaffold code.

## storygraph-explainer Phase 1B: ep2+ep3 Written + Merged (2026-04-19)

- **ep2 (五階段管線):** 31 nodes, 30 edges. **ep3 (一行程式看見全貌):** 30 nodes, 29 edges.
- **Merged graph:** 83 nodes, 88 edges, 5 link edges, 3 algorithm cross-links. Score 75/100.

## P0: Test Suite Speedup (2026-04-19)

- **bunfig.toml** with pathIgnorePatterns excluding bun_pi_agent. `bun test` 180ms (74x speedup).

## Phase 33-F2: Quality Gate Writer (2026-04-19)

- **graphify-write-gate.ts** — Template-based zh_TW quality gate report.
- **buildDialogAssessmentPrompt()** — GLM prompt for zh_TW quality assessment.
- **10 tests pass**, 422 total.

## Phase 33-F1: PLAN.md Parser + Chapter Validator (2026-04-19)

- **plan-parser.ts** — Generic PLAN.md parser with Chinese numeral support.
- **chapter-validator.ts** — 8 validation rules.
- **39 tests pass** across 4 series.

## storygraph-intro → storygraph-explainer Rename (2026-04-19)

- **Rename** across 26 files. Flat standalone → chapter-based series.

## 34-B1-B9: storygraph-intro Scaffold + Scenes + Render (2026-04-19)

- **9 scenes**, all rendered. 3681 frames, 8.3 MB MP4.

## 34-R + Bun Workspace Migration (2026-04-19)

- **Rename verification** caught real bugs (missing script, wrong entry point).
- **Bun 1.3.11 workspace** — no hoisted symlinks for workspace packages.

## Rename bun_graphify → storygraph, bun_scaffold → episodeforge (2026-04-19)

- **140+ references updated** across 30+ files. Zero stale refs.

## Phase 34-B0: Scaffold Extension + remotion_types (2026-04-19)

- **remotion_types package** — Extracted category types, scene templates, presets from storygraph.
- **episodeforge extended** — `--category` flag, standalone naming, tech_explainer templates.

## Phase 34-A: Category Taxonomy (2026-04-19)

- **7 categories defined.** Category ≠ Genre design validated.
- **3 new files:** category-types.ts, scene-templates.ts, tech-explainer-presets.ts.

## Web UI Vision (2026-04-19)

- **Architecture chosen:** Bun + Hono + React SPA.
- **Phases 35-39 planned** — Foundation → Project CRUD → Pipeline/Quality → Assets/Render → Orchestration.

## Consistency Checker Fix + Regex→Hybrid Enforcement (2026-04-19)

- **Three bugs fixed:** Jaccard content comparison, scene properties preservation, SKIP status for inapplicable checks.
- **Score impact:** 75/100 (3 false FAIL) → 95/100 (0 FAIL, 6 SKIP).
- **Regex mode deprecated** for production. Must use hybrid/ai.

## storygraph-explainer Phase 2: Extraction Verified (2026-04-19)

- **Two parser bugs fixed:** segPattern trailing commas, narrator tech_term skip for narrator-only series.
- **22 nodes, 21 edges** from regex extraction. All Phase 2 thresholds passed.

## Phase 33-H: Episode-Setup Workflow Adjustment (2026-04-19)

- **Deploy mode docs** — When to use deploy mode (≥ 3 eps, gate v2.0, blended ≥ 70).
- **Hybrid mode docs** — GLM (free) vs Claude (paid) task assignment.

## Phase 33-A + 33-E: gate.json v2 + Multi-Series Evaluation (2026-04-19)

- **gate.json v2** with provenance, regression detection, quality_breakdown, supervisor_hints.
- **3 genres validated** (xianxia_comedy, galgame_meme, novel_system).

## Phase 31-A: Subagent Scoring (2026-04-19)

- **AI quality scoring works:** GLM-5 produces per-dimension scores with detailed justifications.
- **Blended formula validated:** 0.4 × programmatic + 0.6 × AI produces meaningful scores.

## Phase 33-B: Tier 2 Review (2026-04-19)

- **kg-review topic** with 5-dimension rubric + genre extensions.
- **episode-creation.md updated** — Step 3d added.

## Phase 54-C: studio-render agent (2026-04-26)

- **render-tools.ts** (283 lines) — 3 tools: render_episode, render_status, render_list.
- Wraps remotion-renderer.ts logic directly (findEpisodePath, deriveCompositionId, spawn bun run build).
- render_list provides series-level overview with staleness detection (source newer than output).
- Workflow engine updated: render→studio-render, tts→studio-tts (was pi-developer for both).
- Agent definition: .agent/agents/studio-render.md (6 tools: 3 render + Read + Grep + Find).
- **Bun parse issue:** Template literals in Write-generated file caused parse errors despite valid syntax. Resolved by rewriting via `cat > file << 'EOF'` with string concatenation. Lesson: avoid template literals in bun_pi_agent tool files written by the Write tool.
- All 308 tests pass (7 new, 0 regressions, 26→29 tools).
