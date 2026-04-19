---
name: web-ui-vision
description: Web UI long-term plan: Bun + Hono + React SPA to replace Claude Code skill interactions for full pipeline orchestration
type: project
---

# Web UI Vision — Phase 35-39

**Architecture:** Bun + Hono (API) + React SPA (client) + Vite (bundler)
**Scope:** Full pipeline orchestration — replace all Claude Code skill interactions

## Phases

| Phase | What | Key Deliverable |
|-------|------|----------------|
| 35 | Foundation | Hono server + React SPA + module exports |
| 36 | Project CRUD | Category wizard → scaffold → story editor |
| 37 | Pipeline + Quality | Graphify runner + score dashboard |
| 38 | Assets + Render | Image gallery + TTS + render management |
| 39 | Orchestration | Workflow templates + automation + monitoring |

## Key Design Decisions

- **Scripts as importable modules** — episodeforge, storygraph export main() callable from API, not child_process
- **Job queue for long tasks** — Graphify, renders, TTS run in background with SSE progress
- **Single Bun runtime** — Hono server + Vite dev + Remotion render all on Bun
- **File-based storage** — JSON configs, markdown PLANs. SQLite later if needed
- **Desktop-first** — No mobile responsive initially
- **Single-user** — No auth, local tool

## Prerequisite

Phase 34-B complete (category-aware scaffold validated end-to-end).

## Why

**Why:** Current workflow requires Claude Code expertise. Web UI makes pipeline accessible and provides visual feedback loops (preview scores, browse assets, watch renders).
