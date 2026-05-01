# remotion_studio — Web UI Plan

> **Cross-linked docs:**
> Code folder (this) | Skill folder
> ---|---
> `bun_app/remotion_studio/PLAN.md` — **(this file)** | `.claude/skills/develop_bun_app/SKILL.md`
> `bun_app/remotion_studio/TODO.md` — Tasks + history | `.claude/skills/develop_bun_app/operations/`

## Current State (v0.32.0)

**Focus: Responsive tables, toast alignment, error boundary. 9 tables wrapped for mobile.**

**Working (v0.32.0):**
- **Button component** — 6 variants, 3 sizes. All 17 pages + ErrorBoundary migrated
- **Card component** — 4 variants. 9 pages + ErrorBoundary migrated
- **StatusBadge** — 8 variants. Used in 10+ pages. All inline badges consolidated
- **InputField component** — styled input with label + error. 5 pages
- **Toast** — Uses theme tokens (radii, font sizes, colors, shadows)
- **Responsive tables** — 9 tables across 4 pages have horizontal scroll on mobile
- 316 remotion_studio tests, 0 fail, 21/21 smoke pass

**Continuing from v0.26.0):**
- **Structured Tool Results** — Typed `ToolResultDetails` discriminated union for all 25 tools across 6 groups. Runtime validation with `validateResult()`. Per-tool typed data interfaces.
- **Agent Consistency** — Dashboard agent buttons now use SSE streaming (`mode: "stream"`) instead of polling. Real-time streaming text with markdown rendering in `AgentResultPanel`. Streaming cursor indicator during response.
- **E2E Reliability** — Playwright config now uses `webServer` with built client (no Vite dev server). Eliminates resource exhaustion causing late-suite failures.
- **New E2E test** — `agent-streaming-parity.spec.ts` validates `/chat` SSE and `/tasks` endpoints return consistent shapes.
- 305 remotion_studio tests pass, 582 bun_pi_agent tests pass, 0 fail

**Continuing from v0.22.0:**
- **Global Jobs Panel** — Floating badge with active job count, expandable mini-panel with live SSE progress bars, cancel buttons, mobile bottom sheet
- **Command Palette** — Cmd+K/Ctrl+K opens searchable overlay for all 17 pages, keyboard nav, mobile touch-friendly
- **System Status** — Green/yellow/red dashboard indicator with status text and active job count
- **AI Accent Colour** — `#7c3aed` purple applied to all AI-triggering buttons (Storygraph, ImageGen, Benchmark, Dashboard agents, Advisor panels, AgentChat send)
- **17 pages** total, 305 remotion_studio tests pass, 526 bun_pi_agent tests pass, 21/21 smoke pass

**Continuing from v0.19.0:**
- Multi-turn advisor panels, agent prompt templates, structured tool context
- MockToolRegistry testing framework, async session store, agent bridge interface

**Continuing from v0.18.0:**
- **First-time onboarding** — Auto-redirect to Wizard for new visitors
- **Start Step buttons** — Current step shows prominent "Start" button
- **Mobile responsive** — Wizard stepper adapts to mobile

**Focus: First-time onboarding, Start Step buttons, mobile responsive polish.**

**Working (v0.18.0):**
- **First-time onboarding** — Auto-redirect to Wizard page for first-time visitors (localStorage flag). Welcome banner with "Don't show again" checkbox. Smoke tests use `addInitScript` to skip redirect.
- **Start Step buttons** — Current next step in Wizard shows prominent "Start" button. Other steps show "Go" badge.
- **Mobile responsive** — Wizard stepper adapts to mobile (smaller icons, truncated labels). Overview cards stack vertically. SeriesBreakdown hidden on mobile. File picker modals use `min(520px, 90vw)`.
- **17 pages** total, 299 unit tests pass, 21/21 smoke pass

**Continuing from v0.17.0:**
- **Pipeline Wizard page** — 17th page with 8-step visual stepper, series selector, per-step status, per-series breakdown table.
- **Advisor file attachment** — `useFilePicker` hook shared between AgentChat + AdvisorPanelBase.

**Continuing from v0.16.0:**
- **Agent context persistence** — Server-side session storage in `data/agent-sessions.json`. `SessionStore` service with CRUD. 4 API endpoints (`GET/PUT/DELETE /api/agent/sessions/:agentName/:sessionId` + `GET /sessions/:agentName`). Client auto-migrates localStorage history to server. `AgentChat` loads from server first, saves after streaming. `AdvisorPanelBase` also persists to server.
- **Agent→Job Bridge** (v0.15.0) — `POST /chat` creates tracking Job visible in Dashboard, SSE emits `job_id` + `job_update` events with live progress, `JobStatusCard` renders inline during chat streaming and in completed `AssistantBubble` messages
- **E2E modernization** (v0.15.0) — 13 tests updated. Full E2E: 129/141 pass
- **299 unit tests pass, 0 fail; 20/20 smoke pass, 0 console errors**

**Next:**
- E2E flaky test fixup — route interception cleanup, locale isolation, conditional agent bridge tests

**Working (new in v0.14.0):**
- **16 pages** (added Settings), 22+ components, 50+ API functions
- **PipelineToolCard** — 25 agent tool names mapped to 10 pipeline op types with icons, status badges, parsed metrics
- **Agent file attachment** — file picker modal (series browse + attach/detach), server-side path traversal protection, 200KB limit, extension whitelist
- **Global Settings page** — default model/API provider selector (Agent/GLM/DeepSeek), persisted to localStorage, used by all advisor panels and AgentChat
- **Agent advisor improvements** — `studio-advisor` prompt strengthened (MUST call tools before advice, structured zh_TW output), global model now propagates to `useAgentTask` hook and `AdvisorPanelBase`
- **JobStatusCard** — inline job status with progress bar + live polling (now wired to agent→job bridge)

**Playwright validation (2026-04-29 sweep):**
- Smoke tests: 20/20 pass, 0 console errors across all 16 pages
- Full E2E: 116 pass, 25 pre-existing failures (outdated Benchmark/FormInteraction tests don't match refactored agent-only UI)
- Bugs fixed during sweep: Assets React hooks #310, Benchmark infinite loading, unicode escapes in JSX

**Continuing from v0.13.0:**
- Full pipeline: scaffold → [image ‖ pipeline → check → score] → TTS → render (7 steps, DAG parallel)
- DAG workflow engine with task tree visualization + AbortSignal cancellation
- JobStore persistence, TaskStore, agent bridge (SSE), advisor panels, i18n (zh_TW), theme
- Pipeline progress, Kanban, batch ops, asset search, revision history, section editor

**Known issues (unfixed):**
- No onboarding/help tour for new users

---

## 0. Retrospective (2026-04-29)

### What Went Well
- PipelineToolCard + file attachment + Settings page were implemented cleanly and all 20 smoke tests pass
- Playwright validation caught 3 real bugs that unit tests missed (React hooks #310, Benchmark infinite loading, esbuild unicode rejection)
- Agent advisor prompts and model propagation now unified — one global setting feeds all advisor panels

### What Went Wrong / Root Causes
| Issue | Root Cause | Prevention |
|-------|-----------|------------|
| Build broken (unicode escapes in JSX) | `\u{1F4CE}` works in JS strings but esbuild rejects it in JSX | Added to skill: Step 4b mandatory rebuild + smoke test |
| Assets page crash (React #310) | `useMemo` called after `if (loading) return` — hooks order violation | Added to skill: check all hooks before any early return |
| Benchmark page stuck loading | `setLoading(false)` never called — missing `useEffect` | Discovered by Playwright: page renders error boundary |
| 25 E2E tests fail | Tests written for old Benchmark UI (form controls, mode selector) — UI refactored to agent-only buttons | Tests must be updated when UI is refactored |
| Agent advisors "useless" | Global model not passed to `useAgentTask`/`AdvisorPanelBase`; `studio-advisor` prompt didn't require tool calls | Model propagation + stronger system prompts |
| `bunx vite` resolves to latest global Vite | Bun's `bunx` fetches latest, not project version | Always use `bun run --cwd ... build` for project Vite |

### Process Changes Applied
- **Skill `develop.md` Step 4b**: mandatory rebuild + restart server + Playwright smoke for any client change
- **Memory files**: `feedback_validation.md`, `feedback_jsx_unicode.md`, `feedback_bunx.md`
- **Validation rhythm**: unit tests → Vite build → restart server → Playwright smoke → report

---

## 0.7 Current Focus: AI Agent Integration & E2E UX

### AI Agent Integration

The Agent Chat page bridges to `bun_pi_agent` via SSE. Current state:
- Multi-agent selector with capability cards and conversation starters
- SSE streaming with ChatBubble + ToolCallCard + ThinkingIndicator
- Advisor panels on 6 pages (Storygraph, Projects, StoryEditor, Workflows, ImageGen, TTS)

**Improvements needed:**
1. **Agent → Job bridge** — When agent triggers pipeline jobs, show inline status in chat (not separate Dashboard)
2. **Agent context persistence** — Verify multi-turn context survives page navigation
3. **Agent error recovery** — Clear "agent unavailable" state with actionable steps
4. **Agent file context** — Allow selecting files from Assets/Projects as chat context

### Interactive E2E Tests

Current E2E coverage: 23 spec files covering page rendering, i18n, empty states. But most tests verify *rendering*, not *interactions*.

**Needed:**
1. **Pipeline flow E2E** — Scaffold → pipeline → check → score → TTS → render (real API calls against test server)
2. **Agent chat E2E** — Mock SSE responses, verify tool calls render, verify chat persistence
3. **Workflow DAG E2E** — Trigger workflow, verify task tree updates, test cancel
4. **Error recovery E2E** — Server unreachable, job failure, timeout scenarios
5. **Mobile responsive E2E** — Sidebar, forms, tables at mobile width

### Pending (deferred)
- Video preview (low-res) — requires Remotion still infrastructure
- Export to platform formats — requires per-platform FFmpeg pipeline

---

## 0. Job Persistence Architecture

### Current State (v0.2.0)

```
Server starts → JobStore loads from data/jobs.json
               ↓
          Mark interrupted jobs as failed
               ↓
          Jobs created, run, persisted on mutation
               ↓
          Server restarts → jobs survive, interrupted ones marked failed
```

| Component | Persisted? | Location | Survives restart? |
|-----------|-----------|----------|:-:|
| **Jobs** (job-store.ts) | Yes | `data/jobs.json` | YES (7-day TTL, `JOB_TTL_DAYS` env var) |
| **Task Trees** (task-store.ts) | Yes | `data/task-trees.json` | YES |
| **Schedules** | Yes | `data/schedules.json` | YES |
| **Automation Rules** | Yes | `data/automation-rules.json` | YES |
| **Webhook Secrets** | Yes | `data/webhook-secrets.json` | YES |
| **Agent Chat History** | Yes | `data/agent-sessions.json` + localStorage | YES (server-side, migrated from localStorage) |

### JobStore (persisted, mirrors TaskStore pattern)

- Loads on first access (lazy, idempotent)
- Saves after every mutation (set, delete, markInterrupted)
- 24h TTL eviction for terminal jobs (completed/failed)
- 200 max cap with LRU eviction
- `markInterrupted()`: marks running/pending jobs as failed on server restart

---

## 0.5 Pipeline Dependency Tree

### Current: DAG execution (routes use `runWorkflowDAG()` for templates with `TEMPLATE_DEPS`)

```
Scaffold → Pipeline → Check → Score → TTS → Render
    1          2         3       4       5      6
```

All steps run one after another. Check and Score are sequential even though they could run in parallel.

### Available: DAG execution (`runWorkflowDAG()` + `TEMPLATE_DEPS`)

The code already defines proper dependency edges:

```typescript
// workflow-engine.ts — TEMPLATE_DEPS
TEMPLATE_DEPS = {
  "full-pipeline": {
    scaffold: [],
    image: ["scaffold"],            // ← parallel with pipeline
    pipeline: ["scaffold"],
    check: ["pipeline"],
    score: ["pipeline"],            // ← parallel with check
    tts: ["check", "score", "image"],  // ← waits for ALL 3
    render: ["tts"],
  },
  "quality-gate": {
    pipeline: [],
    check: ["pipeline"],
    score: ["pipeline"],
  },
  "image-tts-render": {
    image: [],
    tts: [],
    render: ["image", "tts"],
  },
};
```

### Correct DAG for Full Pipeline (7 steps):

```
        ┌──────────┐
        │ Scaffold  │
        └────┬──────┘
        ┌────┴──────┐
        ▼           ▼
  ┌──────────┐ ┌──────────┐
  │ Pipeline  │ │  Images   │  ← PARALLEL after scaffold
  └────┬─────┘ └────┬─────┘
       │             │
  ┌────┴────┐        │
  ▼         ▼        │
┌──────────┐┌────────┐│
│  Check    ││  Score  ││  ← PARALLEL
└────┬─────┘└───┬─────┘│
     │           │      │
     └─────┬─────┘──────┘
           │
     ┌─────▼──────┐
     │    TTS      │
     └─────┬──────┘
           │
     ┌─────▼──────┐
     │   Render    │
     └─────────────┘
```

### How routes use DAG (v0.3.0):

The workflow route (`routes/workflows.ts`) checks `TEMPLATE_DEPS[templateId]`. If the template has DAG dependencies defined, it calls `runWorkflowDAG()` (parallel) with an AbortSignal for cancellation. Otherwise, it falls back to `runWorkflow()` (sequential). Cancellation via `POST /jobs/:id/cancel` aborts the signal.

---

## 1. Navigation Structure

```
Sidebar
├── Overview
│   ├── Wizard          — Guided pipeline stepper (new users)
│   ├── Dashboard       — Server health + job queue
│   ├── Monitoring      — Series health cards + trends
│   ├── Progress        — Per-episode pipeline status table
│   └── Kanban          — Episode pipeline-stage board
├── Production
│   ├── Projects        — Series/episode CRUD + one-click Build
│   ├── Story Editor    — Plan markdown editor (sections/edit/preview)
│   └── Workflows       — Template-based pipeline trigger + task tree
├── Analysis
│   ├── Storygraph      — KG extraction (regex/hybrid/ai) + quality gate
│   ├── Quality         — Cross-series comparison + regression alerts
│   └── Benchmark       — Quality benchmark + baselines
├── AI
│   └── Agent Chat      — Multi-agent SSE chat
└── Assets
    ├── Assets          — Character/background/audio browser
    ├── TTS             — Per-episode TTS generation
    ├── Render          — Episode → MP4 render
    └── Image           — Character/background image generation
```

---

## 2. Page-by-Page Function Inventory

### 2.1 Dashboard (`pages/Dashboard.tsx`, ~420 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Dashboard()` | Main component | "Server status and job queue" |
| SSE health polling | Auto-refresh server status | None |
| `handleCreateDemo()` | Create test job | Button label only: "Run Demo Job" |
| `handleCancel(id)` | Cancel running job | None |
| `handleDelete(id)` | Delete job | None |
| `handleClearCompleted()` | Bulk clear | "Clear Completed" |
| Task tree display | DAG visualization for workflow jobs | None |
| Agent advisor panel | Story-health prompts via `studio-advisor` | "AI Story Advisor" with bridge-down indicator |

**Agent integration (v0.12.1):** Dashboard agent buttons now send story-health prompts (Health Check, Content Gaps, Quality Audit) with real series names as context. Uses `useAgentTask("studio-advisor")` with ref-based bridge status, 30s periodic re-check, and visible "Agent offline" badge when bridge is down.

### 2.2 Monitoring (`pages/Monitoring.tsx`, 169 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Monitoring()` | Health overview | "Series health overview" |
| Trend indicators | improving/stable/declining/new | Color-coded, no text explanation |
| Activity log | Recent events | None |

**Naming issues:** None.

**Missing help:** Trend indicators lack text explanation. No legend for activity types.

### 2.3 Projects (`pages/Projects.tsx`, 654 lines)

| Component | Purpose | Help/Tooltip |
|-----------|---------|-------------|
| `Projects` | List/detail/create router | "Manage series and episodes" |
| `ProjectTable` | Sortable series table | Column headers only |
| `ProjectDetail` | Episode list + build panel | Category label, status badges |
| `BuildPanel` | Build progress steps | Step labels (scaffold → pipeline → ...) |
| `CreateProject` | Episode scaffold form | "Scaffold a new episode for a series" |
| `ScaffoldResultPreview` | Show scaffold output | Field labels (Directory, Package, ...) |
| `AdvisorPanel` | Story advisor sidebar | "Ask about story, characters, pacing" |
| `ScoreBadge` | Gate score display | Numeric only, no threshold legend |

**Naming issues:**
- `CreateProject` is misleading — it creates an **episode**, not a project. Should be `CreateEpisode` or `ScaffoldEpisode`.
- `handleBuild()` → really `triggerEpisodeBuild()`.
- `goToCreate()` → `goToScaffoldEpisode()`.

**Missing help:**
- "Build" button has no tooltip explaining the full-pipeline workflow.
- No guidance on what chapter/episode numbers mean.
- "Dry run" checkbox lacks explanation.
- `ScoreBadge` has no threshold legend (what's good/bad).

### 2.4 Story Editor (`pages/StoryEditor.tsx`, 382 lines)

| Component | Purpose | Help/Tooltip |
|-----------|---------|-------------|
| `StoryEditor` | Plan editor | "Edit and preview story plans for your series" |
| `ViewToggle` | sections/edit/preview tabs | Tab labels only |
| `SectionsView` | Parsed plan tables | Section titles (Characters, Episode Guide, ...) |
| `SectionCard` | Card wrapper | Title only |
| `MarkdownEditor` | Textarea | None |
| `MarkdownPreview` | Simple markdown render | None |
| `autoSave()` | 1.5s debounce save | "Saving..." / "Saved" status |

**Naming issues:** Clean.

**Missing help:**
- No documentation of plan format/syntax.
- No guidance on what sections are expected (characters, episode_guide, etc.).
- No link between plan sections and downstream pipeline steps.
- "Sections" view shows raw parsed data — no editing from this view.

### 2.5 Workflows (`pages/Workflows.tsx`, 404 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Workflows()` | Template selector + runner | "Trigger and monitor production pipelines" |
| `handleTrigger()` | Run workflow | Button: "Run Workflow" |
| `loadTree()` / `startTreePolling()` | DAG task tree | "Task Tree" heading, "Refresh" button |
| `handleRetryNode()` | Retry failed task | Via `TaskTreeView.onRetry` |
| Step flow display | "Steps: scaffold → pipeline → ..." | No explanation of what each step does |
| Image list editor | filename + prompt pairs | Placeholder text only |

**Naming issues:** Clean and descriptive.

**Missing help:**
- Template descriptions come from server but no per-step explanation.
- No progress time estimates.
- No "what happens next" after workflow completes.
- Image step needs per-field guidance (filename format, prompt tips).

### 2.6 Storygraph (`pages/Storygraph.tsx`, 260 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Storygraph()` | KG extraction | "Extract and analyze story knowledge graphs" |
| `HelpTip` | `?` tooltip component | Used for mode + action help |
| `handleRun(action)` | pipeline/check/score | Button labels + HelpTip |
| `MODE_HELP` | Mode descriptions | Good: regex/hybrid/ai explanations |
| `ACTION_HELP` | Action descriptions | Good: pipeline/check/score explanations |
| Advisor panel | KG advisor sidebar | "Ask about knowledge graph quality..." |

**Naming issues:** Clean — best example of help integration in the app.

**This page is the gold standard** for help text. Other pages should follow this pattern.

### 2.7 Quality (`pages/Quality.tsx`, 454 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Quality()` | Cross-series comparison | "Cross-series quality comparison and analysis" |
| Quality dimensions | Multi-factor display | Dimension names only |
| Gate checks | Pass/fail with suggestions | "Suggestions" array shown |
| Score history | Timeline chart | None |

**Naming issues:** Clean.

**Missing help:** No explanation of what quality dimensions mean. No guidance on how to improve scores.

### 2.8 Benchmark (`pages/Benchmark.tsx`, 275 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Benchmark()` | Quality benchmarking | "Quality benchmark execution and regression checking" |
| Mode selector | regex/hybrid/ai | Mode labels only |
| Baseline management | List + update | None |
| Agent toggle | Enhanced analysis | None |

**Naming issues:** Clean.

**Missing help:** No explanation of benchmark vs quality vs storygraph differences.

### 2.9 Agent Chat (`pages/AgentChat.tsx`, 343 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `AgentChat()` | Multi-agent chat | None (no PageHeader description!) |
| Agent selector | Dropdown | Agent names only |
| Chat streaming | SSE display | None |
| Export | Download markdown | None |
| Error states | Bridge unavailable | Good error message |

**Naming issues:** Clean.

**Missing help:** No page description. No explanation of what agents can do. No chat formatting guide.

### 2.10 Assets (`pages/Assets.tsx`, 196 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Assets()` | Asset browser | "Browse and preview series assets" |
| Tab navigation | characters/backgrounds/audio | Tab labels only |
| Image preview | Modal | None |
| Audio player | Play button | File info display |

**Naming issues:** Clean.

**Missing help:** No upload instructions. No asset naming convention guide.

### 2.11 TTS (`pages/TTS.tsx`, 162 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `TTS()` | TTS generation | "Generate TTS audio for episodes" |
| Voice mapping | Show voice assignments | None |
| Audio player | Play generated files | None |

**Naming issues:** Clean.

**Missing help:** No explanation of TTS engines (MLX vs Gemini). No voice customization guide.

### 2.12 Render (`pages/Render.tsx`, 153 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `Render()` | Video rendering | "Render episodes to MP4 video" |
| Episode selector | Dropdown | None |
| Video player | Preview | None |

**Naming issues:** Clean.

**Missing help:** No render settings (resolution, fps, codec). No file size estimate.

### 2.13 ImageGen (`pages/ImageGen.tsx`, 339 lines)

| Function | Purpose | Help/Tooltip |
|----------|---------|-------------|
| `ImageGen()` | Character/background gen | "Generate character and background images" |
| Profile selector | Character dropdown | None |
| Facing selector | LEFT/RIGHT | None |
| Prompt enhancer | Auto-add metadata | None |
| Variant gallery | Existing images | None |
| Aspect ratio | Select | None |

**Naming issues:** Clean.

**Missing help:** No prompt writing tips. No style guide. No aspect ratio recommendations per asset type.

---

## 3. API Function Naming Review

### Current naming patterns in `api.ts`:

| Domain | Pattern | Count | Assessment |
|--------|---------|-------|------------|
| Jobs | `listJobs`, `getJob`, `createDemoJob`, `cancelJob`, `deleteJob`, `streamJob` | 6 | Consistent REST-verb pattern |
| Projects | `listProjects`, `getProject` | 2 | Clean |
| Scaffold | `scaffold(body)` | 1 | Verb, clear |
| Pipeline | `pipeline.*` (namespaced) | 4 | Clean — namespaced (v0.3.0) |
| Quality | `getQuality`, `getQualityComparison`, `getRegressionAlerts`, `getScoreHistory` | 4 | Good prefix `get*` |
| Assets | `listAssets`, `getAssets`, `assetFileUrl` | 3 | Clean |
| TTS | `getTTSStatus`, `generateTTS` | 2 | Clean — consistent casing (v0.3.0) |
| Render | `getRenderStatus`, `triggerRender`, `renderPreviewUrl` | 3 | Clean |
| Image | `getImageStatus`, `getCharacterProfiles`, `generateImages` | 3 | Clean |
| Workflows | `listWorkflowTemplates`, `triggerWorkflow`, `getWorkflowJob`, `retryWorkflow` | 4 | Clean |
| Task Tree | `getWorkflowTree`, `getWorkflowTreeNode`, `retryTreeNode` | 3 | Clean |
| Monitoring | `getMonitoringOverview`, `getSeriesHealth` | 2 | Clean |
| Benchmark | `benchmark.*` (namespaced) | 5 | Clean |
| Agent | `agent.*` (namespaced) | 4 | Clean |

---

## 4. Help/Instruction Text Audit

### Pages with good help text:
- **Storygraph** — `MODE_HELP`, `ACTION_HELP`, `HelpTip` component. Gold standard.
- **Projects** — Category labels, status indicators, scaffold preview details.

### Pages with minimal help text (improved v0.6.0):
- **Dashboard** — "What's Next" guided panel + server status
- **Monitoring** — Trend legend added (v0.6.0)
- **AgentChat** — Full description added (v0.6.0)
- **TTS** — Engine info panel added (v0.6.0)
- **Render** — Output specs info panel added (v0.6.0)
- **ImageGen** — Prompt tips panel added (v0.6.0)

### Help text pattern to standardize:

Every page should have:
1. **PageHeader description** — one sentence (already mostly done)
2. **Contextual help** — `HelpTip` component (only Storygraph uses this)
3. **Empty state guidance** — what to do when nothing exists (partially done)
4. **Error recovery hints** — what to try when something fails (partially done)

---

## 5. Pipeline Usage Flow

### Full production pipeline:

```
Story Plan (Story Editor)
    ↓
Scaffold Episode (Projects → Scaffold Episode)
    ↓
Extract KG (Storygraph → Extract KG)
    ↓
Quality Gate (Storygraph → Quality Gate)
    ↓
AI Score (Storygraph → AI Score)
    ↓
Generate Images (ImageGen)
    ↓
Generate TTS (TTS)
    ↓
Render Video (Render)
```

### How functions map to this pipeline:

| Step | Page | API call | Workflow step kind |
|------|------|----------|-------------------|
| 1. Write plan | Story Editor | `PUT /api/plans/:id/raw` | N/A |
| 2. Scaffold | Projects → Create | `api.scaffold()` | `scaffold` |
| 3. Extract KG | Storygraph | `api.runPipeline()` | `pipeline` |
| 4. Quality gate | Storygraph | `api.runCheck()` | `check` |
| 5. AI score | Storygraph | `api.runScore()` | `score` |
| 6. Images | ImageGen | `api.generateImages()` | `image` |
| 7. TTS | TTS | `api.generateTTS()` | `tts` |
| 8. Render | Render | `api.triggerRender()` | `render` |

### Workflow templates that automate this:

| Template | Steps |
|----------|-------|
| `full-pipeline` | scaffold → pipeline → check → score → tts → render |
| `scaffold-and-pipeline` | scaffold → pipeline |
| `quality-gate` | check → score |
| Custom (user selects) | Any combination |

### Pipeline gaps:
1. **No image step in full-pipeline** — images must be done separately
2. **No script/outline step** — plan → scaffold gap has no intermediate writing step
3. **No preview/review step** — no way to preview video before final render
4. **Scene-level workflow** — everything is episode-level, no scene-by-scene

---

## 6. Chinese Novel Studio Author Needs Analysis

### Persona: Chinese web novel author using Remotion Studio to create animated series

#### What authors currently CAN do:

| Capability | Page | Quality |
|-----------|------|---------|
| Write story plans | Story Editor | Basic markdown textarea, no structured input |
| Create episodes | Projects → Create | Good: auto-detect ch/ep, dry-run preview |
| Track episode status | Project Detail | Good: scaffold/TTS/render/gate columns |
| Build full pipeline | Workflows | Good: one-click, DAG visualization |
| Extract story graph | Storygraph | Good: 3 modes, help tips |
| Check quality | Quality / Storygraph | Good: gate + score |
| Generate TTS | TTS | Basic: trigger only |
| Generate images | ImageGen | Basic: prompt + variant gallery |
| Render video | Render | Basic: trigger only |
| Chat with AI advisor | Agent Chat | Good: streaming, export |

#### What authors NEED but DON'T HAVE:

##### A. Writing & Content Creation (創作)

| Need | Priority | Description |
|------|----------|-------------|
| **Script/Outline Editor** | P0 | Structured editor for dialog, scene descriptions, stage directions. Current Story Editor is a raw markdown textarea — authors need per-scene, per-character editing. |
| **Character Voice Manager** | P0 | UI to assign voices, test them, adjust pitch/speed. Current TTS page just shows mapping, no edit capability. |
| **Dialog Preview** | P1 | Play back dialog with assigned voices BEFORE full TTS generation. "Test line" button. |
| **Scene Reorder** | P1 | Drag-and-drop scene ordering within an episode. |
| **Story Arc Tracker** | P1 | Visual timeline of arcs across chapters. Story Editor shows arcs as text only. |
| **Chinese Input Support** | P0 | zh_TW labels, tooltips, placeholder text. Currently all English. |

##### B. Visual Asset Management (視覺資產)

| Need | Priority | Description |
|------|----------|-------------|
| **Character Design Brief** | P1 | Structured form for character appearance (hair, eyes, outfit, accessories) → auto-generates image prompt. |
| **Style Guide per Series** | P1 | Define art style (anime/watercolor/chibi/etc) once, apply to all image generation. |
| **Expression Sheet** | P2 | Generate character in multiple expressions (happy, angry, sad, surprised). |
| **Background Variants** | P2 | Same location at different times of day. |
| **Asset Library Search** | P1 | Search/filter across all series assets. Current Assets page has no search. |

##### C. Production Workflow (製作流程)

| Need | Priority | Description |
|------|----------|-------------|
| **Guided Pipeline Walkthrough** | P0 | Step-by-step wizard: "You've written the plan → Next: scaffold episode → Next: generate images..." Current workflow requires knowing the full pipeline. |
| **Episode Status Dashboard** | P0 | Kanban-style view: Writing → Scaffolded → KG'd → TTS'd → Rendered → Published. Current Project Detail is a flat table. |
| **Batch Operations** | P1 | "Generate TTS for all episodes in chapter 3" or "Render all pending episodes". Currently one-by-one. |
| **Template Library** | P1 | Pre-built episode templates by category (narrative_drama, galgame_vn, etc). Current Workflows has templates but they're pipeline-only, not content templates. |
| **Revision History** | P2 | Track plan/story changes over time. Current Story Editor has no version history. |

##### D. Quality & Review (品質審核)

| Need | Priority | Description |
|------|----------|-------------|
| **Inline Quality Hints** | P1 | Show quality suggestions while editing (like Grammarly). Currently quality is a separate page. |
| **Video Preview Before Render** | P1 | Low-res preview of episode composition. Currently must render full MP4. |
| **Review Checklist** | P1 | Per-episode checklist: "Dialog complete? Characters consistent? Audio synced?" |
| **Cross-episode Continuity Check** | P2 | Detect inconsistencies (character names, voice changes, plot holes). |

##### E. Collaboration & Publishing (協作與發布)

| Need | Priority | Description |
|------|----------|-------------|
| **Export to Platforms** | P2 | One-click export to YouTube, Bilibili, TikTok formats. |
| **Series Overview Page** | P1 | Public-facing series summary with episode list. |
| **Progress Sharing** | P2 | "Chapter 3 is 60% complete" status for stakeholders. |

---

## 7. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Pages    │  │Components│  │  api.ts  │  │ Theme   │ │
│  │ (13)     │→ │ (20+)    │→ │ (50+ fn) │→ │Provider │ │
│  └──────────┘  └──────────┘  └────┬─────┘  └─────────┘ │
│                                    │ fetch/SSE            │
└────────────────────────────────────┼──────────────────────┘
                                     │
                            ┌────────▼────────┐
                            │  Hono Server     │
                            │  (src/server/)   │
                            │  17 route groups │
                            └──┬─────┬────┬───┘
                               │     │    │
                    ┌──────────▼┐ ┌──▼──┐ ┌▼──────────┐
                    │ Workflow   │ │Job  │ │ Agent     │
                    │ Engine     │ │Store│ │ Bridge    │
                    │ (DAG exec) │ │     │ │ (SSE)     │
                    └───────────┘ └─────┘ └───────────┘
```

---

## 8. Module Reference

### Client (`src/client/`)

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| `App.tsx` | `App`, `NAV_SECTIONS`, `PageRouter` | ~290 | Updated (v0.22.0) — GlobalJobsPanel + CommandPalette + Cmd+K |
| `index.tsx` | Entry point | 12 | Stable |
| `api.ts` | `api` (55+ methods) | 271 | Updated (v0.16.0) — session API methods |
| `pages/Dashboard.tsx` | `Dashboard`, `SystemStatus`, `DashboardAgentBtn` | ~470 | Updated (v0.28.0) — Button migration (10 buttons) |
| `pages/Projects.tsx` | `Projects`, `ProjectTable`, `ProjectDetail`, `CreateProject`, `BuildPanel`, `AdvisorPanel`, `ScoreBadge` | 654 | Updated (v0.28.0) — Button migration (9+ buttons) |
| `pages/Workflows.tsx` | `Workflows` | 404 | Updated (v0.28.0) — Button migration (5 buttons) |
| `pages/StoryEditor.tsx` | `StoryEditor`, `SectionsView`, `MarkdownEditor`, `MarkdownPreview` | 382 | Updated (v0.28.0) — Button migration (7 buttons) |
| `pages/Storygraph.tsx` | `Storygraph`, `HelpTip` | 260 | Updated (v0.29.0) — Card migration (1 card) |
| `pages/Quality.tsx` | `Quality` | 454 | Updated (v0.29.0) — Card migration (4 cards) |
| `pages/Benchmark.tsx` | `Benchmark` | 275 | Updated (v0.28.0) — Button migration (1 button) |
| `pages/PipelineWizard.tsx` | `PipelineWizard` | ~540 | Updated (v0.30.0) — StatusBadge migration (1 badge) |
| `pages/AgentChat.tsx` | `AgentChat`, `AgentDirectory` | ~830 | Updated (v0.29.0) — Card migration (1 card) |
| `pages/Assets.tsx` | `Assets` | 220 | Updated (v0.28.0) — Button migration (4 buttons) |
| `pages/TTS.tsx` | `TTS` | 162 | Updated (v0.29.0) — Card migration (1 card) |
| `pages/Render.tsx` | `Render` | 153 | Updated (v0.28.0) — Button migration (1 button) |
| `pages/ImageGen.tsx` | `ImageGen` | 339 | Updated (v0.28.0) — Button migration (7 buttons) |
| `pages/Settings.tsx` | `Settings`, `loadGlobalModel`, `saveGlobalModel` | ~130 | Updated (v0.27.0) — Card migration |
| `pages/Monitoring.tsx` | `Monitoring` | 169 | Updated (v0.29.0) — Card migration (2 cards) |
| `pages/PipelineProgress.tsx` | `PipelineProgress` | ~280 | Updated (v0.28.0) — Button migration (5 buttons) |
| `pages/EpisodeKanban.tsx` | `EpisodeKanban` | ~170 | Updated (v0.30.0) — StatusBadge migration (1 badge) |
| `components/index.ts` | Re-exports (Button, Card, InputField, etc.) | ~30 | Updated (v0.28.0) — Button exported to all 17 pages |
| `components/Button.tsx` | `Button`, `ButtonProps` | ~60 | New (v0.27.0) — 6 variants, 3 sizes |
| `components/AdvisorPanelBase.tsx` | `AdvisorPanelBase` | ~380 | Updated (v0.17.0) — file attachment UI + modal |
| `components/ChatBubble.tsx` | `ChatBubble`, `UserBubble` | ~80 | Stable |
| `components/ToolCallCard.tsx` | `ToolCallCard` | ~60 | Stable |
| `components/PipelineToolCard.tsx` | `PipelineToolCard`, `getPipelineOp`, `PipelineToolInfo` | ~145 | New (v0.13.1) |
| `components/JobStatusCard.tsx` | `JobStatusCard` | ~100 | New (v0.13.1) |
| `components/TaskTreeNode.tsx` | `TaskTreeNode`, `TaskTreeView` | ~150 | Stable |
| `components/MarkdownText.tsx` | `MarkdownText` | ~40 | Stable |
| `components/ThinkingIndicator.tsx` | `ThinkingIndicator` | ~20 | Stable |
| `components/SectionEditor.tsx` | `SectionEditor`, `TableSectionEditor`, `TextSectionEditor` | ~220 | New (v0.10.0) |
| `utils/markdown-table.ts` | `parseMarkdownTable`, `serializeMarkdownTable`, `replaceSectionInMarkdown` | ~70 | New (v0.10.0) |
| `hooks/useAgentTask.ts` | `useAgentTask` | ~170 | Updated (v0.12.1) — ref-based bridge status, 30s re-check |
| `hooks/useFilePicker.ts` | `useFilePicker` | ~80 | New (v0.17.0) |
| `hooks/useJobStream.ts` | `useJobStream` | ~80 | New (v0.22.0) — shared job SSE subscription |
| `components/GlobalJobsPanel.tsx` | `GlobalJobsPanel` | ~210 | New (v0.22.0) — floating badge + mini panel |
| `components/CommandPalette.tsx` | `CommandPalette`, `PaletteItem` | ~170 | New (v0.22.0) — Cmd+K searchable palette |
| `theme/` | `ThemeProvider`, `useTheme`, `scoreColor` | ~270 | Updated (v0.22.0) — aiAccent colour tokens |

### Server (`src/server/`)

| Route Group | Prefix | Key Operations |
|-------------|--------|---------------|
| `health` | `/api/health` | GET |
| `jobs` | `/api/jobs` | CRUD + SSE stream |
| `projects` | `/api/projects` | List, get |
| `scaffold` | `/api/scaffold` | POST |
| `pipeline` | `/api/pipeline` | Status, run, check, score, graph-html |
| `quality` | `/api/quality` | Get, compare, regression, history |
| `assets` | `/api/assets` | List, get, file serving |
| `tts` | `/api/tts` | Status, generate |
| `render` | `/api/render` | Status, trigger, preview |
| `workflows` | `/api/workflows` | Templates, trigger, retry, tree |
| `agent` | `/api/agent` | Status, agents, chat (SSE), tasks |
| `monitoring` | `/api/monitoring` | Overview, series health |
| `episode-progress` | `/api/episode-progress` | Per-episode pipeline status |
| `batch` | `/api/batch` | Multi-episode TTS/render operations |
| `benchmark` | `/api/benchmark` | Run, check, regression, baselines |
| `plans` | `/api/plans` | Get, get raw, put raw |
| `image` | `/api/image` | Status, characters, generate |
| `automation` | `/api/automation` | Rules CRUD |
| `webhooks` | `/api/webhooks` | Handler |
| `schedules` | `/api/schedules` | CRUD |
| `export` | `/api/export` | Import/export |

### Services (`src/server/services/`)

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| `job-store.ts` | `JobStore` class (set, get, list, delete, markInterrupted) | 108 | Stable |
| `session-store.ts` | `SessionStore` class (save, load, listSessions, deleteSession) | ~100 | New (v0.16.0) |
| `task-store.ts` | `TaskStore` class (createTree, addNode, updateNode, getTree) | 209 | Stable |
| `workflow-engine.ts` | `runWorkflow`, `runWorkflowDAG`, `TEMPLATE_DEPS`, step builders | 915 | Updated (v0.2.0) |
| `dag-executor.ts` | `executeTaskTree`, `StepExecutor` | 138 | Stable |

### Middleware (`src/server/middleware/`)

| File | Exports | Status |
|------|---------|--------|
| `job-queue.ts` | `createJob`, `getJob`, `listJobs`, `cancelJob`, `deleteJob`, `sseStream`, `markInterruptedJobs` | Updated (v0.2.0) |

### Shared (`src/shared/`)

| File | Content |
|------|---------|
| `types.ts` | All TypeScript interfaces |

---

## 9. Dependencies

| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI framework |
| `hono` | HTTP server framework |
| `@hono/node-server` | Node adapter for Hono |

---

## 10. Configuration

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `3210` | Server port |
| `RENDER_DIR` | `./renders` | Rendered video output |
| `ASSETS_DIR` | `./assets` | Static assets |

---

## 11. Priority Action Items

### P1 — Author Productivity (updated)
10. ~~Add image step to full-pipeline~~ (Done v0.3.0)
11. ~~Cancel workflow~~ (Done v0.3.0)
12. ~~API namespace cleanup~~ (Done v0.3.0)
13. Episode Kanban board (status pipeline view)
14. Batch operations (multi-episode TTS, render)
15. Character design brief → auto-prompt
16. Quality inline hints
17. Asset library search

### P1 — Author Productivity
6. Episode Kanban board (status pipeline view)
7. Batch operations (multi-episode TTS, render)
8. Character design brief → auto-prompt
9. Quality inline hints
10. Asset library search

### P2 — Polish
11. API namespace cleanup (`pipeline.*`)
12. Video preview before render
13. Revision history for plans
14. Export to platform formats
15. Expression sheet generation
