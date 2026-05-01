---
name: develop_bun_app
description: Develop bun_app utilities — scaffold, test, build, and maintain Bun/TypeScript apps under bun_app/
trigger: /develop_bun_app
version: 1.6.0
---

# /develop_bun_app

Scaffold, test, build, and maintain Bun/TypeScript utility apps under `bun_app/`.

## Existing Apps

| App | Package Name | Purpose |
|-----|-------------|---------|
| `storygraph` | `storygraph` | Knowledge graph generator (AST + story KG) |
| `episodeforge` | `episodeforge` | Remotion episode scaffold generator |
| `remotion_types` | `remotion_types` | Shared category types + scene templates |
| `bun_pi_agent` | `bun_pi_agent` | Multi-agent coding assistant (ACP stdio + CLI + HTTP SSE, 32 tools, 13 agents) |
| `remotion_studio` | `remotion_studio` | Web UI for video production (15 pages, DAG workflow engine) |
| `bun_image` | `bun_image` | AI image generation via z.ai/Playwright CDP bridge |
| `bun_tts` | `bun_tts` | Text-to-speech via mlx_tts + Gemini API |

## Cross-App Status

Run `bun scripts/cross-app-status.ts` from repo root to get a health table of all bun_apps (version, tests, PLAN.md, TODO.md).

## Conventions

- All bun_apps live in `bun_app/<snake_case_name>/`
- Package `name` uses snake_case: `"storygraph"`, `"bun_pi_agent"`
- Every app has: `package.json`, `tsconfig.json`, `src/`, `src/index.ts`
- Every app should have: `PLAN.md` + `TODO.md` + `NEXT.md`
- Private packages: `"private": true`, ES modules: `"type": "module"`
- Tests: `bun test src/`
- Run from repo root: `bun run --cwd bun_app/<name> <script>`
- **Never `cd` into bun_app/** — use `--cwd` flag

## Mode Detection

| User says | Operation | Read |
|-----------|-----------|------|
| "create new bun_app", "scaffold" | `scaffold` | `operations/scaffold.md` |
| "test", "run tests" | `test` | `operations/test.md` |
| "build", "compile" | `build` | `operations/build.md` |
| "add feature", "refactor" | `develop` | `operations/develop.md` |
| "check", "audit", "status" | `status` | `operations/status.md` |
| "plan", "reflect", "retrospective", "next", "NEXT" | `plan` | `operations/plan.md` |
| "done", "finished", "post-run" | `post-run` | `operations/post-run.md` |

Read ONLY the operation file you need. Do NOT read all operation files.

## PLAN/TODO/NEXT Lifecycle

### PLAN.md — Architecture & State
- Current state header, architecture diagram, module reference table, dependencies, configuration
- Updated when: architecture changes, new modules added, dependencies change

### TODO.md — Tasks & History
- Status header, known issues, P0/P1/P2 tasks, phase sections, development history, done section
- Updated when: tasks completed, new issues found, development history entries

### NEXT.md — Forward-Looking Iteration Plan
- Version target, theme/goals, prioritized task list with estimated effort
- Task dependency graph, success criteria checklist
- Reflects on what was learned from previous iteration
- Updated when: completing a version, planning next iteration, after retrospectives
- Created with `operations/plan.md` when user says "plan", "reflect", "next", "NEXT"

### Self-Gating Rules
1. Before developing: Read PLAN.md + TODO.md P0 + NEXT.md goals
2. After changes: Run `bun test src/`, update TODO.md
3. After significant work: Add entry to Development History
4. Discovering issues: Add to Known Issues, not just fix silently
5. Architecture decisions: Update PLAN.md
6. Completed tasks: Move to Done section
7. Version milestone reached: Update NEXT.md with reflection + new goals

## On Demand

| Topic | File |
|-------|------|
| App anatomy, templates, directory structure | [references/anatomy.md](references/anatomy.md) |
| Skill's own architecture | [PLAN.md](PLAN.md) |
| Skill's own tasks | [TODO.md](TODO.md) |
