# remotion_studio — Plan

> Full specs → GitHub issue #2 (PRD)

## Quick Reference

- **Version:** v0.69.0 — 683 tests, 487KB bundle, 22/22 smoke pass
- **Purpose:** Web UI for Remotion video production pipeline
- **Stack:** React 18 + Hono + Bun, i18n (en + zh_TW), theme (light + dark)
- **18 pages, 50+ components, 60+ API methods**

## Architecture

```
Browser (React) → api.ts (60+ fn) → Hono Server (24 route groups)
                                     ├── Workflow Engine (DAG exec)
                                     ├── Job Store (data/jobs.json)
                                     └── Agent Bridge (SSE)
```

## Pipeline Flow

```
Plan → Scaffold → [Image ‖ Pipeline → Check → Score] → TTS → Render
                       ↑ PARALLEL after scaffold
```

## Navigation

- **Overview:** Wizard, Dashboard, Monitoring, Progress, Kanban, Series Overview
- **Production:** Projects, Story Editor, Workflows
- **Analysis:** Storygraph, Quality, Benchmark
- **AI:** Agent Chat
- **Assets:** Assets, TTS, Render, Image

## Key Config

| Var | Default |
|-----|---------|
| `PORT` | `5173` |
| `RENDER_DIR` | `./renders` |
| `JOB_TTL_DAYS` | `7` |
