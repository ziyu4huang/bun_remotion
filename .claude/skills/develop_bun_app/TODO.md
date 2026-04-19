# /develop_bun_app — Skill TODO

> **Cross-linked docs:**
> - Skill PLAN: `.claude/skills/develop_bun_app/PLAN.md` — Architecture, operations, design decisions
> - Skill TODO: `.claude/skills/develop_bun_app/TODO.md` — **(this file)** Tasks + history
> - Skill SKILL: `.claude/skills/develop_bun_app/SKILL.md` — Operational playbook

> **Status:** v1.2.0 — 7 operations (with post-run), pre-check lists + validation criteria added

## Known Issues

**Operations are documentation, not automation:**
- All 6 ops are markdown "how-to" files. Claude reads them then does the work manually.
- No scripts exist under this skill. storygraph has real scripts; this skill doesn't.
- **Impact:** Slower execution, more error-prone. Claude might skip steps.

**No self-gating enforcement:**
- SKILL.md lists 6 self-gating rules but they're honor-system.
- Nothing checks "did you read PLAN.md before developing?" or "did you update TODO.md after fixing?"
- **Impact:** Rules are ignored when context is tight or task is urgent.

**`develop` operation is too generic:**
- "Add features or refactor" covers everything. It's a cookbook of patterns (modules, CLI args, config, routes).
- No specific commands, no inputs/outputs definition, no validation criteria.
- Compare storygraph's `episode.md`: specific command, specific inputs, specific outputs, specific validation.
- **Impact:** Claude treats it as reference material, not a workflow.

**No `post-run.md` (knowledge capture):**
- storygraph has a post-run protocol: inspect output, record to TODO, capture lessons to memory, update SKILL.md.
- develop_bun_app has nothing equivalent. Lessons from developing one bun_app don't feed back.
- **Impact:** Same mistakes get made repeatedly across bun_apps.

**No dependency-aware scaffolding:**
- scaffold.md generates a generic template. No way to say "I need HTTP server" or "I need CLI + config".
- User has to manually add cli/, server/, config.ts after scaffold.
- **Impact:** Extra round-trips. Scaffold creates an app that doesn't match the user's intent.

## P0 — Fix next

- [ ] **Make `develop` op into a workflow** — Instead of a pattern cookbook, define a structured workflow: (1) read PLAN.md architecture, (2) identify where new code fits, (3) write code + tests, (4) update PLAN.md module table, (5) update TODO.md. Specific to the type of change (new module, new route, new config).

## P1 — Feature completeness

- [ ] **Parameterized scaffold** — Ask user what the app needs (CLI? server? config? tools?) before generating. Generate only the needed structure instead of a bare minimum template.
- [ ] **Add `scaffold.ts` script** — Move scaffold from pure-doc to executable script: `bun bun_app/<name>/scripts/scaffold.ts <name>` generates the full structure. More reliable than Claude following a markdown checklist.
- [ ] **Cross-app consistency check** — `status` op should compare all bun_apps: do they all have PLAN.md, TODO.md, passing tests? Flag outliers.

## P2 — Architecture improvements

- [ ] **Enforce PLAN/TODO freshness** — When `status` op runs, check: when was PLAN.md last modified vs. how many source files changed since? Flag stale docs.
- [ ] **Template versioning** — When app conventions change (e.g., new required scripts), detect apps using old conventions and suggest updates.
- [ ] **Integration with storygraph skill** — When developing storygraph itself, both skills could cooperate: develop_bun_app for code structure, storygraph for codebase analysis of the app being developed.

## Phase 2 — Script-backed Operations

### Goal
Convert key operations from pure documentation to executable scripts.

### P0 — Scaffold script
- [ ] `operations/scripts/scaffold.ts` — Generate bun_app structure from name + options
- [ ] Options: `--with-cli`, `--with-server`, `--with-config`, `--with-tools`
- [ ] Output: Full directory with all selected components + tests + PLAN.md + TODO.md

### P1 — Status script
- [ ] `operations/scripts/status.ts` — Collect metrics from a bun_app, output JSON report
- [ ] Metrics: test results, file count, dep list, PLAN/TODO existence, last history entry

### P2 — Test runner with TODO update
- [ ] `operations/scripts/test-and-update.ts` — Run tests, if pass: prompt to update TODO.md
- [ ] Auto-detect: what files changed since last TODO.md history entry?

---

## Development History

### 2026-04-16 v1.2.0 — Pre-check lists, validation criteria, post-run op

| Metric | Before (v1.1.0) | After (v1.2.0) |
|--------|-----------------|----------------|
| Operations | 6 | **7 (+ post-run)** |
| Operations with pre-check | 0 | **6** |
| Operations with validation criteria | 0 | **6** |
| Knowledge capture protocol | None | **post-run.md** |

**Changes applied:**
- Added "Before Starting" checklist to all 6 existing operations
- Added "Success Criteria" section to all 6 existing operations
- Created `operations/post-run.md` — knowledge capture protocol after changes
- Added post-run to SKILL.md mode detection table and operations section
- Bumped version to 1.2.0

### 2026-04-16 v1.1.0 — PLAN/TODO lifecycle, plan operation, skill's own PLAN/TODO

| Metric | Before (v1.0.0) | After (v1.1.0) |
|--------|-----------------|----------------|
| Operations | 5 (scaffold, test, build, develop, status) | **6 (+ plan)** |
| Managed apps with PLAN/TODO | 1 (storygraph, pre-existing) | **2 (+ bun_pi_agent)** |
| Self-gating rules | None | **6 rules documented** |
| Skill's own PLAN/TODO | None | **This + PLAN.md** |
| post-run.md | None | Missing (P0) |

**Changes applied:**
- Created `operations/plan.md` — PLAN/TODO lifecycle management operation
- Added PLAN/TODO lifecycle section to SKILL.md (v1.0.0 → v1.1.0)
- Added self-gating rules: before develop, after changes, after significant work, on issues, on arch decisions, on completion
- Updated `operations/scaffold.md` — PLAN.md + TODO.md now included in scaffolded structure
- Updated `operations/status.md` — checks PLAN/TODO existence and freshness
- Created `bun_app/bun_pi_agent/PLAN.md` — first app to get PLAN/TODO from this skill
- Created `bun_app/bun_pi_agent/TODO.md` — with known issues, P0/P1/P2, dev history
- Created this file (skill's own PLAN.md and TODO.md)

**Reflections from bun_pi_agent rename experience:**
- Renaming bun-pi-agent → bun_pi_agent touched 6 source files + root package.json + memory file + CLAUDE.md. Each was found by grep, fixed, verified by tests.
- PLAN.md would have helped *before* the rename: a module reference table would list all files that reference the app name, making the rename checklist automatic.
- TODO.md captured the rename as a history entry. Next session will know it happened and why.

### 2026-04-16 v1.0.0 — Initial skill creation

| Metric | Value |
|--------|-------|
| Operations | 5 (scaffold, test, build, develop, status) |
| Operation files | 5 markdown docs |
| Conventions | snake_case, --cwd, ES modules, bun test |
| Templates | package.json, tsconfig.json, src/index.ts, smoke test |

**Created from:** storygraph skill pattern study + bun_pi_agent rename experience

## Done

- [x] v1.2.0: Pre-check lists added to all 6 operations
- [x] v1.2.0: Validation criteria added to all 6 operations
- [x] v1.2.0: `operations/post-run.md` — knowledge capture protocol
- [x] v1.1.0: PLAN/TODO lifecycle section in SKILL.md
- [x] v1.1.0: `operations/plan.md` — create/update PLAN/TODO for any bun_app
- [x] v1.1.0: Self-gating rules documented
- [x] v1.1.0: Scaffold includes PLAN.md + TODO.md generation
- [x] v1.1.0: Status checks PLAN/TODO existence
- [x] v1.1.0: bun_pi_agent PLAN.md + TODO.md created
- [x] v1.1.0: Skill's own PLAN.md + TODO.md created
- [x] v1.0.0: SKILL.md with mode detection + load-on-demand
- [x] v1.0.0: 5 operation docs (scaffold, test, build, develop, status)
- [x] v1.0.0: App anatomy + convention set
- [x] v1.0.0: See Also links to managed app PLAN/TODO files
