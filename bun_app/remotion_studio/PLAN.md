# remotion_studio — Web UI Plan

> **Cross-linked docs:**
> Code folder (this) | Skill folder
> ---|---
> `bun_app/remotion_studio/PLAN.md` — **(this file)** | `.claude/skills/develop_bun_app/SKILL.md`
> `bun_app/remotion_studio/TODO.md` — Tasks + history | `.claude/skills/develop_bun_app/operations/`

## Current State (v0.64.0)

- **598 tests**, 0 fail, 4443 expect(). **472KB** bundle, 32 chunks. **22/22** smoke pass.
- 18 pages, 50+ components, 60+ API methods.
- Full pipeline: scaffold → [image ‖ pipeline → check → score] → TTS → render (7 steps, DAG parallel).
- DAG workflow engine, agent bridge (SSE), i18n (en + zh_TW), theme (light + dark).
- Category-aware workflow templates, cross-episode continuity check, voice manager, expression sheet.

---

## Navigation Structure

```
Sidebar
├── Overview
│   ├── Wizard          — Guided pipeline stepper (new users)
│   ├── Dashboard       — Server health + job queue
│   ├── Monitoring      — Series health cards + trends
│   ├── Progress        — Per-episode pipeline status table
│   ├── Kanban          — Episode pipeline-stage board
│   └── Series Overview — Series cards with progress bars
├── Production
│   ├── Projects        — Series/episode CRUD + one-click Build
│   ├── Story Editor    — Plan markdown editor (sections/edit/preview/arcs/reorder)
│   └── Workflows       — Category-aware template trigger + task tree
├── Analysis
│   ├── Storygraph      — KG extraction (regex/hybrid/ai) + quality gate
│   ├── Quality         — Cross-series comparison + continuity check
│   └── Benchmark       — Quality benchmark + baselines
├── AI
│   └── Agent Chat      — Multi-agent SSE chat
└── Assets
    ├── Assets          — Character/background/audio browser
    ├── TTS             — Per-episode TTS generation + voice manager
    ├── Render          — Episode → MP4 render
    └── Image           — Character/background image generation + expression sheet
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Pages    │  │Components│  │  api.ts  │  │ Theme   │ │
│  │ (18)     │→ │ (50+)    │→ │ (60+ fn) │→ │Provider │ │
│  └──────────┘  └──────────┘  └────┬─────┘  └─────────┘ │
│                                    │ fetch/SSE            │
└────────────────────────────────────┼──────────────────────┘
                                     │
                            ┌────────▼────────┐
                            │  Hono Server     │
                            │  (src/server/)   │
                            │  24 route groups │
                            └──┬─────┬────┬───┘
                               │     │    │
                    ┌──────────▼┐ ┌──▼──┐ ┌▼──────────┐
                    │ Workflow   │ │Job  │ │ Agent     │
                    │ Engine     │ │Store│ │ Bridge    │
                    │ (DAG exec) │ │     │ │ (SSE)     │
                    └───────────┘ └─────┘ └───────────┘
```

---

## Pipeline Flow

```
Story Plan → Scaffold → [Image ‖ Pipeline → Check → Score] → TTS → Render
                              ↑ PARALLEL after scaffold          ↑
                              └──────────────┬───────────────────┘
                                             TTS waits for ALL 3
```

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

---

## Persistence

| Component | Persisted? | Location | Survives restart? |
|-----------|-----------|----------|:-:|
| **Jobs** (JobService) | Yes | `data/jobs.json` | YES (7-day TTL) |
| **Task Trees** | Yes | `data/task-trees.json` | YES |
| **Agent Sessions** | Yes | `data/agent-sessions.json` | YES |
| **Config** | Yes | `data/config.json` | YES |

---

## Server Route Groups

| Prefix | Key Operations |
|--------|---------------|
| `/api/health` | GET |
| `/api/jobs` | CRUD + SSE stream |
| `/api/projects` | List, get |
| `/api/scaffold` | POST |
| `/api/pipeline` | Status, run, check, score |
| `/api/quality` | Get, compare, regression, history |
| `/api/assets` | List, get, file serving |
| `/api/tts` | Status, generate, voices, characters, preview |
| `/api/render` | Status, trigger, preview |
| `/api/workflows` | Templates, trigger, retry, tree, categories |
| `/api/agent` | Status, agents, chat (SSE), tasks |
| `/api/batch` | Multi-episode operations + cancel |
| `/api/config` | GET config, POST api-keys, POST default-model |
| `/api/plans` | Get, get raw, put raw, revisions |
| `/api/image` | Status, characters, generate |
| `/api/continuity` | GET per-series cross-episode report |
| `/api/style-guide` | GET/PUT/DELETE per-series |

---

## Configuration

| Var | Default | Purpose |
|-----|---------|---------|
| `PORT` | `5173` | Server port |
| `RENDER_DIR` | `./renders` | Rendered video output |
| `ASSETS_DIR` | `./assets` | Static assets |
| `JOB_TTL_DAYS` | `7` | Job retention period |
