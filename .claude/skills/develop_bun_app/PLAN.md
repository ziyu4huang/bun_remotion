# /develop_bun_app — Skill PLAN

> **Cross-linked docs:**
>
> This file | Related
> ---|---
> `.claude/skills/develop_bun_app/PLAN.md` — **(this file)** Skill architecture, operations, state | `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook
> `.claude/skills/develop_bun_app/TODO.md` — Skill tasks + history | `.claude/skills/develop_bun_app/operations/` — 6 operation docs
> — | `bun_app/storygraph/PLAN.md` + `TODO.md` — Reference bun_app with mature lifecycle
> — | `bun_app/bun_pi_agent/PLAN.md` + `TODO.md` — Second bun_app, first adopter of skill-created PLAN/TODO
> — | `.claude/skills/remotion-best-practices/PLAN.md` + `TODO.md` — bun_webui strategic roadmap (Web UI phases 35-39)

## Current State (v1.2.0)

**Working:**
- 7 operation docs: scaffold, test, build, develop, status, plan, post-run
- Pre-check lists in all 6 core operations (enforce reading PLAN/TODO before work)
- Validation criteria in all 6 core operations (explicit "success = X")
- PLAN/TODO lifecycle conventions defined in SKILL.md
- Self-gating rules documented (honor-system, not enforced)
- Template-driven scaffold: generates package.json, tsconfig, PLAN.md, TODO.md, src/index.ts, smoke test
- App anatomy diagram + convention set (snake_case, --cwd, ES modules)
- Cross-linked doc pattern from storygraph
- Post-run knowledge capture protocol (update TODO, PLAN, feedback memory)

**Managed Apps:**

| App | Has PLAN.md | Has TODO.md | Tests | Notes |
|-----|------------|------------|-------|-------|
| storygraph | ✅ mature (v0.7+) | ✅ run history | — | Reference implementation, skill existed before develop_bun_app |
| bun_pi_agent | ✅ skill-created | ✅ skill-created | 93 pass | First app to get PLAN/TODO from this skill |
| bun_webui | ✅ (in remotion-best-practices) | ✅ (in remotion-best-practices) | 64 pass | Hono API + React SPA, 8 pages, workflow engine |

## Architecture

```
SKILL.md (always loaded by Claude on /develop_bun_app)
    │
    ├─ Mode detection: user intent → operation name
    │
    ├─ operations/          ← loaded on demand (read 1 file only)
    │   ├── scaffold.md     — Create new bun_app from templates
    │   ├── test.md         — Run tests, diagnose failures, fix
    │   ├── build.md        — Compile standalone binary
    │   ├── develop.md      — Add features / refactor patterns
    │   ├── status.md       — Audit: files, tests, deps, PLAN/TODO
    │   └── plan.md         — Create/update PLAN.md + TODO.md
    │
    ├─ PLAN.md              — (this file) Skill's own architecture
    └─ TODO.md              — Skill's own task tracking

Managed bun_apps (each has own PLAN/TODO):
    bun_app/storygraph/
        PLAN.md — Architecture, node types, edge relations
        TODO.md — Pipeline tasks, run history, known issues
    bun_app/bun_pi_agent/
        PLAN.md — Agent architecture, modules, HTTP API
        TODO.md — Tasks, known issues, dev history
    bun_app/bun_webui/
        PLAN/TODO in .claude/skills/remotion-best-practices/
        8 pages: Dashboard, Projects, Pipeline, Quality, Assets, TTS, Render, Workflows
        Workflow engine chains storygraph + episodeforge + bun_tts + remotion-renderer
```

## Operations Reference

| Op | File | What it does | Type | Validation |
|----|------|-------------|------|-----------|
| scaffold | `operations/scaffold.md` | 10-step template generation | Document | test passes + PLAN/TODO exist |
| test | `operations/test.md` | Run + fix test workflow | Document | 0 failures |
| build | `operations/build.md` | Compile binary pattern | Document | Binary `--help` works |
| develop | `operations/develop.md` | Module/config/route patterns | Cookbook | Tests pass + PLAN updated |
| status | `operations/status.md` | 9-point audit checklist | Document | Report generated |
| plan | `operations/plan.md` | PLAN/TODO create/update templates | Document + templates | PLAN.md + TODO.md exist |
| post-run | `operations/post-run.md` | Knowledge capture after changes | Protocol | TODO history entry added |

## Design Decisions

### Why load-on-demand operations
- SKILL.md is loaded into context on every invocation. Keeping it short saves tokens.
- Operations are only read when needed. A `test` invocation doesn't load `scaffold.md`.
- Mode: storygraph uses the same pattern successfully.

### Why no scripts (unlike storygraph)
- storygraph has actual TypeScript scripts that do work. develop_bun_app is pure documentation.
- **Trade-off:** Docs are easier to maintain but require Claude to execute each step manually. Scripts would be more reliable but need maintenance.
- **Future:** Could add a `scaffold.ts` script for automated app generation.

### Why honor-system self-gating
- Claude can't enforce pre-conditions (read PLAN.md before developing) automatically.
- The rules document *intent*. Claude follows them most of the time but may forget.
- **Future:** Could add a pre-check list at the top of each operation that reminds Claude what to read first.

## Key Patterns (from storygraph experience)

1. **Two-level docs**: Skill-level (this) for architecture + code-level (`bun_app/<name>/PLAN.md`) for implementation
2. **Priority gates**: P0 (fix now) / P1 (features) / P2 (architecture) — gives immediate next-task direction
3. **Development History**: Dated metrics tables prevent knowledge loss between sessions
4. **Cross-linking**: Every doc references related docs with clear scope rules
5. **Known Issues from reality**: Observations from actual runs, not theoretical bugs
