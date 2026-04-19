# Novel Video Generation — Strategic Roadmap

> **Cross-linked docs:**
>
> This file (active phases) | Archive
> ---|---
> `PLAN.md` — Phases 31–33 specs | `PLAN-archive.md` — Phases 24–30 (complete)
> `TODO.md` — Active tasks | `TODO-archive.md` — Completed tasks
> `NEXT.md` — Entry point (read first) | —
> — | `../storygraph/PLAN.md` — Code architecture, node types, edge relations

> **Status:** v0.27.2 — Core engine mature. Phase 34 complete. Next: 33-I (my-core-is-boss rebuild) or Phase 35 (Web UI).

---

## Phase 31: Subagent-Based KG Quality Scoring (P1 — replace programmatic-only)

### Problem

Programmatic scoring has known biases:

| Bias | Impact |
|------|--------|
| Quantity over quality | More nodes = higher score, regardless of accuracy |
| No accuracy signal | Hallucinated entities count same as real ones |
| Fixed type weights | `tech_term` bonus hurts comedy series |
| No semantic understanding | Can't detect nonsensical relationships |

### Architecture

```
graphify-score.ts (NEW)
  │
  ├── 1. Run pipeline (existing)
  │
  ├── 2. Build scoring prompt
  │     Input: merged-graph.json summary + narration.ts excerpts
  │     Rubric:
  │       - Entity accuracy (0-10): labels match source?
  │       - Relationship correctness (0-10): edges semantically valid?
  │       - Completeness (0-10): major story elements captured?
  │       - Cross-episode coherence (0-10): cross-links make sense?
  │       - Actionability (0-10): can Remotion pipeline use this?
  │
  ├── 3. Call subagent (callAI)
  │     Returns: { dimensions: {...}, overall: 0-10, justification: "..." }
  │
  ├── 4. Compute blended score
  │     blended = 0.4 * programmatic + 0.6 * subagent_overall
  │
  └── 5. Write kg-quality-score.json

graphify-compare.ts (enhanced)
  └── Add "Subagent Score" column + per-dimension breakdown to comparison report

graphify-regression.ts (NEW)
  ├── Test corpus: my-core-is-boss + galgame-meme-theater + weapon-forger
  ├── Baseline: kg-quality-baseline.json
  └── Report: per-series delta, regression detection (>10% drop from baseline)
```

### Why subagent, not programmatic

- **Accuracy requires reading comprehension** — "Does node '周墨: 科技工程術語' match the narration text?" needs NL understanding
- **Edge validity is semantic** — "Is `uses_tech_term` edge between `zhoumo` and `模組化設計` correct?" needs context
- **Actionability is subjective** — "Can a Remotion scene be built from this data?" needs design judgment
- **Comedy arc structure is fuzzy** — "Is this gag escalation or just repetition?" needs humor understanding

---

## Phase 32: KG-Driven LLM Prompt Enhancement (P2 — feedback loop)

### Architecture

```
merged-graph.json
  │
  ├── buildRemotionPrompt()
  │     ├── Previous episode summary (key events, character states)
  │     ├── Active foreshadowing (planted, not yet paid off)
  │     ├── Character growth trajectory (direction + recent traits)
  │     ├── Gag evolution history (last 2 episodes)
  │     ├── Pacing profile of previous episode
  │     └── Thematic coherence data
  │
  ├── Episode-creation Step 3b
  │     └── Uses enriched prompt → better PLAN.md → better video
  │
  └── Post-render feedback
        ├── Actual scene durations vs pacing predictions
        ├── Effect usage vs effect_count predictions
        └── Updates KG → calibrates future prompts
```

### New Files

| File | Purpose |
|------|---------|
| `subagent-prompt.ts` + `buildRemotionPrompt()` | KG context injection into episode prompts |
| `story-graph.ts` enhancements | `loadPreviousEpisodeSummary()`, `loadActiveForeshadowing()`, `loadGagEvolution()`, `loadCharacterArcContext()` |
| `graphify-enrich.ts` (NEW) | Post-render KG enrichment (actual durations → predictions) |
| `prompt-calibration.ts` (NEW) | Track which KG features correlate with quality scores |

---

## Phase 33: Dual-LLM Architecture — Deployable pi-agent + Claude Code Supervisor

### Problem

The current system has two LLM paths that are **entangled**:

| Path | Environment | Model | Cost | Role |
|------|------------|-------|------|------|
| pi-agent pipeline | Anywhere (Bun + z.ai API) | GLM-5 | Free | KG extraction, consistency checks |
| Claude Code subagent | Claude Code session | Claude | Paid | Quality gate evaluation (Step 3b) |

**Entanglement:** Claude Code's Step 3b depends on pi-agent output (gate.json, consistency-report.md) but Claude Code is the environment that triggers the pipeline. In deployment (no Claude Code), there's no quality review.

**Goal:** Separate these concerns into a clean **three-tier quality pipeline** that can run autonomously (deploy) or with Claude supervision (develop).

### Architecture — Three-Tier Quality Pipeline

```
┌──────────────────────────────────────────────────────────────┐
│  Tier 0: Programmatic (free, fast, always runs)              │
│                                                               │
│  Jaccard similarity, PageRank, arc scores, type counts       │
│  13+ genre-aware consistency checks → PASS/WARN/FAIL         │
│  Already implemented (Phases 24-30)                           │
│  Output: gate.json (score 0-100)                              │
│                                                               │
│  gate.json.decision:                                          │
│    PASS (≥70) → proceed                                       │
│    WARN (40-69) → flag for Tier 1                             │
│    FAIL (<40) → block + escalate to Tier 2                   │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  Tier 1: pi-agent AI scoring (free, slow, runs on pipeline)  │
│                                                               │
│  GLM-5 evaluates its own KG quality:                          │
│    - Entity accuracy (0-10): labels match source?             │
│    - Relationship correctness (0-10): edges semantically OK?  │
│    - Completeness (0-10): major story elements captured?      │
│    - Cross-episode coherence (0-10): cross-links make sense?  │
│    - Actionability (0-10): can Remotion use this?             │
│                                                               │
│  Blended score: 0.4 × programmatic + 0.6 × ai_overall        │
│  Output: quality-score.json (per-dimension)                   │
│                                                               │
│  quality-score.json overall:                                  │
│    ≥7/10 → accept                                             │
│    <7/10 → escalate to Tier 2                                 │
│                                                               │
│  THIS IS PHASE 31 — subagent KG quality scoring               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼ (escalated)
┌──────────────────────────────────────────────────────────────┐
│  Tier 2: Claude Code review (paid, manual, human-in-loop)    │
│                                                               │
│  Claude reads ALL Tier 0 + Tier 1 output + raw narration.ts  │
│  Deep evaluation:                                             │
│    - Semantic correctness (beyond entity labels)              │
│    - Creative quality (humor, engagement, originality)        │
│    - Genre-specific assessment (comedy timing, xianxia FX)    │
│    - Regression vs previous run                               │
│    - Specific fix suggestions with line references            │
│                                                               │
│  Output: quality-review.json + review notes in PLAN.md        │
│  Can trigger: re-run with adjusted params                     │
│                                                               │
│  Runs inside Claude Code session only                         │
└──────────────────────────────────────────────────────────────┘
```

### Escalation Logic

```
Pipeline runs → Tier 0 (programmatic) → gate.json

  gate.json.score ≥ 70?
    YES → Tier 1 (GLM scoring) → quality-score.json
      quality-score.json overall ≥ 7?
        YES → ACCEPT (no Claude needed)
        NO  → ESCALATE to Tier 2
    NO → ESCALATE to Tier 2

Tier 2 (Claude Code):
  - Human triggers /remotion-best-practices with review request
  - Claude reads gate.json v2 + quality-score.json + narration files
  - Claude evaluates, suggests fixes
  - Human reviews → applies fixes → re-runs pipeline
```

### Two Operating Modes

**Mode 1: Autonomous (deploy / CI/CD)**

```bash
storygraph <series-dir> --ci
# Runs Tier 0 + Tier 1
# Outputs: gate.json, quality-score.json, consistency-report.md, etc.
# Exit code: 0 if accepted, 1 if escalated (needs Claude review)
# No Claude Code needed
```

**Mode 2: Supervised (develop / Claude Code)**

```bash
# Inside Claude Code session:
/remotion-best-practices
# → Reads pipeline output
# → If escalated, Claude does Tier 2 review
# → Suggests fixes, human applies
# → Can trigger re-run
```

### What Already Exists

| Component | Phase | Status | Notes |
|-----------|-------|--------|-------|
| pi-agent pipeline | 26-27 | ✅ | graphify-pipeline --mode hybrid, end-to-end |
| Programmatic scoring | 29 | ✅ | gate.json with 0-100 score, PASS/WARN/FAIL |
| AI extraction (GLM) | 26-27 | ✅ | Hybrid mode: regex + GLM-5 supplement |
| Genre-aware checks | 30 | ✅ | 3 genres, comedy arc, gag diversity |
| Check enrichment | 26-B3 | ✅ | GLM writes zh_TW analysis |
| gen-prompt | — | ✅ | KG → writing constraints |
| Step 3b Claude review | — | ✅ | Claude evaluates quality, writes gate section |
| **AI quality scoring** | 31 | ✅ | GLM evaluates KG (Tier 1) |
| **Enhanced gate.json** | 33 | ✅ | v2 format for dual consumption |
| **Claude review skill** | 33 | ✅ | Structured Tier 2 rubric |
| **CLI packaging** | 33 | ❌ | npx storygraph |
| **Feedback loop** | 33 | ❌ | Review → pipeline calibration |
| **CI mode** | 33 | ❌ | Exit code for automated pipelines |

### gate.json v2 Design

```json
{
  "version": "2.0",
  "timestamp": "2026-04-19T...",
  "series": "my-core-is-boss",
  "genre": "novel_system",
  "generator": { "mode": "hybrid", "model": "glm-5", "version": "0.15.0" },
  "score": 75,
  "decision": "PASS",
  "previous_score": 72,
  "score_delta": 3,
  "checks": [
    { "name": "Character Consistency", "status": "PASS", "score_impact": 5, "fix_suggestion_zhTW": "..." },
    { "name": "Plot Arc", "status": "WARN", "score_impact": -5, "fix_suggestion_zhTW": "..." }
  ],
  "quality_breakdown": {
    "consistency": 0.8,
    "arc_structure": 0.7,
    "pacing": 0.65,
    "character_growth": 0.9,
    "thematic_coherence": 0.75,
    "gag_evolution": null
  },
  "supervisor_hints": {
    "focus_areas": ["pacing_curve_flat_ch2ep2"],
    "suggested_rubric_overrides": [],
    "escalation_reason": null
  },
  "requires_claude_review": false
}
```

Key additions:
- `series`, `genre`, `generator` — provenance and context
- `previous_score`, `score_delta` — regression detection
- `quality_breakdown` — per-dimension normalized scores (null for genre-inapplicable)
- `supervisor_hints.focus_areas` — what Claude should focus on
- `requires_claude_review` — automated escalation trigger

### Phase 33 Implementation Reflections

#### Ordering rationale

1. **Genre validation must precede Tier 1** — Phase 30 added genre-aware scoring but was only tested on my-core-is-boss. Running pipeline on weapon-forger (xianxia) and galgame-meme-theater (comedy) FIRST catches genre-specific bugs before building AI scoring on top.

2. **Risk decomposition for beyond-graphify** — Step 0 lite (PLAN.md parser) and Step 4 lite (scaffold generator) are template-based and low-risk. Step 3b lite (gate writer) is medium-risk (GLM assessment). Step 2 lite (story draft) is high-risk creative generation.

3. **CLI wraps more than graphify** — CLI is more valuable when it also wraps the gate writer (33-F2), so users get complete deploy experience.

4. **Documentation reflects final state** — episode-creation.md and SKILL.md should document the three operating modes after all lite steps exist.

5. **Evaluation needs deploy steps to compare** — Can't compare deploy vs develop quality until deploy (lite) steps exist.

#### MVP definition

Phases 1-5 (33-A + 33-E smoke + 31-A + 33-E detail + 33-B) deliver the minimum viable dual-agent:
- Tier 0 (programmatic) — gate.json v2 with quality_breakdown
- Tier 1 (GLM) — quality-score.json with per-dimension evaluation
- Tier 2 (Claude) — structured review skill with escalation logic
- Genre validation — confirmed working on all 3 series

#### What's out of scope for initial implementation

- **Step 2 lite (story generation)** — GLM creative writing quality is uncertain. Requires its own evaluation.
- **Docker deployment** — Bun runs natively on macOS/Linux. Docker is future.
- **Multi-user collaboration** — Current architecture assumes single developer.
- **Real-time pipeline** — Current pipeline is batch (run on command).

### Relation to Other Phases

| Phase | Role | How it fits |
|-------|------|-------------|
| Phase 26 (complete) | pi-agent AI integration | callAI() + pi-ai SDK — foundation for deployable agent |
| Phase 30 (complete) | Genre-aware pipeline | pi-agent handles multiple genres correctly |
| Phase 31 (complete) | Subagent KG scoring | Tier 1 — GLM evaluates KG quality |
| Phase 32 (planned) | KG-driven prompts | Uses Tier 1 quality data for prompt enrichment |
| Phase 33 (active) | Dual-LLM architecture | Formalizes Tier 2 (Claude review) + deployability |
| Phase 34 (active) | Video category system | 7 YouTube video categories + scaffolding templates |

---

## Phase 34: Video Category System — Multi-Format Remotion Scaffolding

### Problem

All existing series share the same narrative/dialog-driven format:
- weapon-forger, my-core-is-boss, xianxia-system-meme → character dialog + battle FX
- galgame-meme-theater → galgame VN dialog

But YouTube has many popular video formats: tech explainers, data stories, listicles, tutorials, shorts/memes. The current system has no concept of **video format** — only **story genre** (xianxia_comedy, galgame_meme).

**Key insight: Category ≠ Genre.**
- **Genre** = story content style (xianxia_comedy, galgame_meme) — defined in `series-config.ts`
- **Category** = video format/structure (narrative_drama, tech_explainer) — defined in `category-types.ts`
- A series has BOTH: `weapon-forger → xianxia_comedy + narrative_drama`

### 7 Video Categories

| Category | zh_TW | Projects | Dialog System |
|----------|-------|----------|---------------|
| Narrative Drama | 敘事劇情 | weapon-forger, my-core-is-boss, xianxia-system-meme | dialogLines[] |
| Galgame VN | 美少女遊戲風 | galgame-meme-theater, galgame-youth-jokes | dialogLines[] |
| Tech Explainer | 技術講解 | claude-code-intro, storygraph-intro (new) | narration_script |
| Data Story | 數據故事 | taiwan-stock-market | narration_script |
| Listicle | 盤點清單 | *(none yet)* | item_list |
| Tutorial | 教學指南 | *(none yet)* | step_guide |
| Shorts / Meme | 短影音迷因 | *(none yet)* | none (sfx only) |

### Architecture

```
category-types.ts                    scene-templates.ts
┌──────────────────┐                ┌──────────────────────────┐
│ VideoCategoryId   │                │ buildTechExplainerSpec() │
│ VideoCategory     │──── used by───→│ buildNarrativeDramaSpec()│
│   .scenes[]       │                │ buildGalgameVNSpec()     │
│   .components[]   │                │ buildListicleSpec()      │
│   .animationStyle │                │ buildTutorialSpec()      │
│   .audioMode      │                │ buildDataStorySpec()     │
│   .dialogSystem   │                │ buildShortsMemeSpec()    │
└──────────────────┘                └──────────┬───────────────┘
                                               │
                                    ┌──────────▼───────────────┐
                                    │ CompositionSpec           │
                                    │   .scenes: SceneSpec[]    │
                                    │   .totalFrames            │
                                    │   .fps, .width, .height   │
                                    └──────────┬───────────────┘
                                               │
                  ┌────────────────────────────┼────────────────────────────┐
                  │                            │                            │
        tech-explainer-presets.ts    (future: more presets)    scaffolding system
        storygraphIntroData         listicle-presets.ts       --category flag
                                    tutorial-presets.ts
```

### Files Created

| File | Purpose | Status |
|------|---------|--------|
| `bun_app/remotion_types/src/category-types.ts` | 7 category definitions, detection, helpers | ✅ Done |
| `bun_app/remotion_types/src/scene-templates.ts` | Composition spec builders for all 7 categories | ✅ Done |
| `bun_app/remotion_types/src/presets/tech-explainer-presets.ts` | storygraph intro preset + data | ✅ Done |

### What's Done (34-A)

- **34-A1: category-types.ts** — 7 VideoCategoryId types, scene structure per category, dirname detection, genre→category mapping
- **34-A2: scene-templates.ts** — 7 builders (buildTechExplainerSpec, buildNarrativeDramaSpec, etc.) with auto duration allocation
- **34-A3: tech-explainer-presets.ts** — storygraph intro data (pipeline, features, comparison)
- **34-A4: CLAUDE.md update** — Video Categories section added

### What's Next

#### 34-B: episodeforge Extension + storygraph Intro (POC, P0)

**Revised approach:** Extend episodeforge to support `--category tech_explainer` BEFORE scaffolding. This merges 34-C into 34-B.

**Full pipeline (every step is a hard dependency):**

```
scaffold → story → graphify → generate-images → generate-tts → implement scenes → render MP4
```

Each step produces outputs the next step requires:
- **scaffold** → workspace with scene stubs + package.json
- **story** → PLAN.md with dialog/narration content
- **graphify** → knowledge graph + quality gate (gate.json)
- **generate-images** → character sprites, backgrounds in assets/public/
- **generate-tts** → audio files + durations.json (drives scene timing)
- **implement scenes** → React components consuming images + audio
- **render** → MP4 output

1. **B0: Extend episodeforge** — Add category-aware scaffolding
   - `--category` flag on CLI (required for non-narrative series)
   - Category-specific template generators (scene files, PLAN.md, narration system)
   - Non-episode naming (no ch/ep required for standalone projects)
   - New series-config: `storygraph-intro` as tech_explainer

2. **B1: Scaffold workspace** — `bun run episodeforge --series storygraph-intro --category tech_explainer`
   - Creates `bun_remotion_proj/storygraph-intro/` with all scene files
   - 9 scenes from `storygraphIntroData` composition spec

3. **B2: Generate images** — Tech explainer needs: gradient backgrounds, pipeline diagram assets, icons
   - Tech explainer uses fewer images than narrative (no character sprites)
   - May use CSS/SVG-generated visuals instead of image files

4. **B3: Generate TTS** — Single narrator voice for narration_script
   - Edge TTS or MLX TTS for narrator
   - Produces audio files + durations.json

5. **B4-B8: Implement scenes** — Title, Problem, Architecture, Feature×3, Demo, Comparison, Outro

6. **B9: Render + verify** — Full render pipeline test

**Why scaffold-first:** Validates both the template AND the scaffolding system. Future categories (listicle, tutorial) reuse the same `--category` flow.

#### 34-D: Skill Documentation (P1)

Update remotion-best-practices skill:
- Add category detection to SKILL.md topic table
- Add topics/episode-setup/category-guide.md
- Update episode-creation.md with category selection step

### Design Decisions

1. **Category is orthogonal to genre** — A comedy can be narrative_drama (weapon-forger) or galgame_vn (meme-theater) or shorts_meme (quick meme). Format and content are independent axes.

2. **Scene templates are data-driven** — `buildTechExplainerSpec()` takes structured data and returns a `CompositionSpec` with exact start frames and durations. The scaffolding system reads this spec to generate scene files.

3. **Per-feature duration capping** — FeatureScene durations are capped at 10s max to prevent one scene type from eating all available time. Total duration may exceed the target if there are many features.

4. **Audio mode varies by category** — Narrative uses character voices, Tech Explainer uses single narrator, Shorts uses sfx-only. This affects TTS generation.

5. **Aspect ratio varies** — Shorts/Meme defaults to 9:16 (vertical). All others default to 16:9.

---

## Phase 35: Web UI Foundation — Bun + Hono + React SPA

### Problem

All video creation workflows currently run through Claude Code chat/skills:
- `/remotion-best-practices` for episode creation
- `/storygraph` for knowledge graph pipeline
- `/generate-tts` for voice generation
- Manual `bun run episodeforge` for workspace creation

This is powerful but requires Claude Code expertise. A Web UI makes the pipeline accessible to non-developers and provides visual feedback loops (preview scores, browse assets, watch renders).

### Architecture

```
bun_app/bun_webui/
├── package.json                 # @bun-remotion/webui
├── tsconfig.json
├── src/
│   ├── server/                  # Hono API server
│   │   ├── index.ts             # Entry point, Bun.serve()
│   │   ├── routes/
│   │   │   ├── projects.ts      # CRUD for Remotion projects
│   │   │   ├── pipeline.ts      # Graphify pipeline runner
│   │   │   ├── quality.ts       # Gate scores, quality review
│   │   │   ├── assets.ts        # Image/audio management
│   │   │   └── render.ts        # Render management
│   │   ├── services/
│   │   │   ├── scaffold.ts      # Wraps episodeforge as importable module
│   │   │   ├── graphify.ts      # Wraps storygraph scripts as module
│   │   │   └── render.ts        # Wraps remotion render
│   │   └── middleware/
│   │       ├── job-queue.ts     # Background job queue (for long tasks)
│   │       └── events.ts        # SSE for progress updates
│   ├── client/                  # React SPA
│   │   ├── index.tsx            # Mount point
│   │   ├── App.tsx              # Router + layout
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # Series overview, episode status
│   │   │   ├── ProjectCreate.tsx # Category wizard + scaffold
│   │   │   ├── StoryEditor.tsx  # PLAN.md structured editor
│   │   │   ├── Pipeline.tsx     # Run graphify, view results
│   │   │   ├── Quality.tsx      # Score dashboard, gate results
│   │   │   ├── Assets.tsx       # Character/background gallery
│   │   │   ├── TTS.tsx          # Voice generation + preview
│   │   │   └── Render.tsx       # Trigger + monitor + preview video
│   │   └── components/          # Shared UI components
│   └── shared/
│       └── types.ts             # Shared types (API request/response)
├── index.html                   # SPA entry
└── vite.config.ts               # Vite bundler for client
```

### API Design Principles

1. **Scripts are importable modules** — Each `bun_app/` script exports a main function callable from both CLI and Hono handler. No `child_process` spawning. Applies to: episodeforge, storygraph, generate-image, generate-tts.

2. **Job queue for long tasks** — Graphify pipeline, image generation, TTS generation, and renders run in background with SSE progress updates.

3. **Same Bun runtime** — Hono server + Vite dev + Remotion render all on Bun. No Node.js needed.

4. **Pipeline is linear with hard dependencies:**
   ```
   scaffold → story → graphify → generate-images → generate-tts → implement scenes → render MP4
   ```
   Each step produces outputs the next step consumes. Skipping a step breaks downstream steps.

### Dependency Graph

```
Phase 34 (category system) ──→ Phase 35 (Web UI foundation)
                                │
                                ├──→ Phase 36 (Project CRUD + scaffold UI)
                                ├──→ Phase 37 (Pipeline + quality UI)
                                ├──→ Phase 38 (Asset + render UI)
                                └──→ Phase 39 (Automation + monitoring)
```

### What's Out of Scope

- **Multi-user auth** — Single-user local tool initially
- **Docker deployment** — Bun native is sufficient
- **Database** — File-based (JSON configs, markdown PLANs). SQLite later if needed.
- **Mobile responsive** — Desktop-first, may add mobile later

---

## Phase 36: Project Management UI

### Scope

- Dashboard: list series, episodes, status badges
- Create project wizard: select category → fill preset data → scaffold
- Project detail: overview, scenes list, edit PLAN.md
- episodeforge integration via API (wraps `bun run episodeforge --category ...`)

### Key Flows

1. **Create narrative episode:** Select series → pick ch/ep → scaffold → land on story editor
2. **Create tech explainer:** Select category → fill features/pipeline → scaffold → land on scene editor
3. **Import existing:** Scan `bun_remotion_proj/` → auto-detect category → add to dashboard

---

## Phase 37: Pipeline & Quality UI

### Scope

- Pipeline runner: select episodes → run graphify → show progress → display results
- Quality dashboard: gate.json scores, quality_breakdown charts, AI scores
- Comparison view: cross-episode metrics, regression alerts
- Tier 2 review: trigger Claude review from UI (requires Claude Code session)

### Key Flows

1. **Run graphify:** Select series/episode → run pipeline → see gate.json result → accept/escalate
2. **Quality comparison:** Select 2+ episodes → side-by-side metrics → identify regressions
3. **Gate review:** View failed checks → read fix suggestions → re-run with adjustments

---

## Phase 38: Asset & Render UI

### Scope

- Asset gallery: browse character images, backgrounds, audio files
- Upload/manage assets with tagging
- TTS generation: select voice → generate → preview → download
- Render management: trigger render → monitor progress → preview output MP4
- Remotion Studio integration: deep-link to studio for live preview

### Key Flows

1. **Generate TTS:** Select episode → auto-detect narration → generate → preview audio
2. **Render video:** Select project → trigger render → watch progress bar → play result
3. **Manage assets:** Browse character gallery → tag → assign to series

---

## Phase 39: Full Pipeline Orchestration

### Scope

- Workflow templates: predefined pipelines (scaffold → story → graphify → gate → render)
- Automation rules: auto-run graphify on PLAN.md change, auto-render on quality pass
- Monitoring dashboard: series health, episode completion rate, quality trends
- CI/CD integration: webhook triggers, scheduled pipeline runs
- Export/import: project configs as JSON for reproducibility

### Key Flows

1. **One-click episode:** Plan → scaffold → graphify → quality check → render (automated pipeline)
2. **Quality monitoring:** Dashboard shows quality trend across episodes → alerts on regression
3. **Scheduled pipeline:** Cron to re-score all episodes weekly → detect quality drift
