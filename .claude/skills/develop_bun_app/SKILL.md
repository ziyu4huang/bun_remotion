---
name: develop_bun_app
description: Develop bun_app utilities — scaffold, test, build, and maintain Bun/TypeScript apps under bun_app/
trigger: /develop_bun_app
version: 1.2.0
---

# /develop_bun_app

Scaffold, test, build, and maintain Bun/TypeScript utility apps under `bun_app/`.

## Existing Apps

| App | Package Name | Purpose |
|-----|-------------|---------|
| `storygraph` | `storygraph` | Knowledge graph generator (AST + story KG) |
| `episodeforge` | `episodeforge` | Remotion episode scaffold generator |
| `remotion_types` | `remotion_types` | Shared category types + scene templates |
| `bun_pi_agent` | `bun_pi_agent` | Coding assistant agent (CLI + HTTP SSE) |

## Conventions

- All bun_apps live in `bun_app/<snake_case_name>/`
- Package `name` uses snake_case (no scope): `"storygraph"`, `"bun_pi_agent"`
- Every app has: `package.json`, `tsconfig.json`, `src/`, `src/index.ts`
- Every app should have: `PLAN.md` (architecture) + `TODO.md` (tasks + run history)
- Private packages: `"private": true`
- ES modules: `"type": "module"`
- Tests use Bun test runner: `bun test src/`
- Run commands from repo root: `bun run --cwd bun_app/<name> <script>`
- **Never `cd` into bun_app/** — use `--cwd` flag

## Mode Detection

Detect operation from the user's request:

| User says | Operation | Read |
|-----------|-----------|------|
| "create new bun_app", "scaffold" | `scaffold` | `operations/scaffold.md` |
| "test", "run tests" | `test` | `operations/test.md` |
| "build", "compile" | `build` | `operations/build.md` |
| "add feature", "refactor" | `develop` | `operations/develop.md` |
| "check", "audit", "status" | `status` | `operations/status.md` |
| "plan", "reflect", "retrospective" | `plan` | `operations/plan.md` |
| "done", "finished", "post-run", "wrap up" | `post-run` | `operations/post-run.md` |

Read ONLY the operation file you need. Do NOT read all operation files.

## Operations (Load on Demand)

### scaffold — Create a new bun_app
Read `operations/scaffold.md` — generates `bun_app/<name>/` with package.json, tsconfig.json, PLAN.md, TODO.md, src/index.ts, and initial tests.

### test — Run and fix tests
Read `operations/test.md` — runs `bun test src/` and helps fix failures.

### build — Compile standalone binary
Read `operations/build.md` — builds distributable binary using `bun build --compile`.

### develop — Add features or refactor
Read `operations/develop.md` — patterns for adding modules, tests, CLI args, HTTP routes.

### status — Audit existing app
Read `operations/status.md` — shows test results, dependency list, file tree, code stats.

### plan — Reflect and plan
Read `operations/plan.md` — PLAN/TODO lifecycle: create, update, self-gate development with run history.

### post-run — Knowledge capture
Read `operations/post-run.md` — capture what changed, what was learned, update TODO.md and PLAN.md. Run after develop, test fixes, or any significant change.

## PLAN/TODO Lifecycle

Every bun_app should maintain two living documents:

### PLAN.md — Architecture & State
- **Current state header**: version, what's working, what's not
- **Architecture diagram**: module relationships, data flow
- **Module reference table**: file → exports → lines → status
- **Dependencies**: what packages and why
- **Configuration**: env vars, defaults, purpose
- **Cross-links**: reference TODO.md and skill docs

### TODO.md — Tasks & History
- **Status header**: current version + test status
- **Known Issues**: from real runs and testing, grouped by area
- **P0 / P1 / P2 priority tasks**: with checkbox tracking
- **Phase sections**: future work organized as phases
- **Development History**: dated entries with metrics tables
- **Done section**: checked items with brief descriptions

### Self-Gating Rules

1. **Before developing**: Read PLAN.md to understand architecture, read TODO.md P0 for next tasks
2. **After changes**: Run tests (`bun test src/`). If tests pass, update TODO.md with what changed
3. **After significant work**: Add entry to Development History with metrics table
4. **When discovering issues**: Add to Known Issues in TODO.md, not just fix silently
5. **When architectural decisions are made**: Update PLAN.md, not just code
6. **When tasks are completed**: Move from P0/P1/P2 to Done section

### When to create PLAN/TODO

- **Scaffold**: Created automatically with the new app
- **Missing**: If an existing app lacks PLAN.md or TODO.md, offer to create them
- **Stale**: If PLAN.md hasn't been updated in 5+ commits, flag it for review

## App Anatomy

Every bun_app follows this structure:

```
bun_app/<name>/
├── package.json          # name, scripts (start, test, build), dependencies
├── tsconfig.json         # extends ../../tsconfig.json or standalone
├── PLAN.md               # Architecture, module reference, current state
├── TODO.md               # Tasks, known issues, run history
├── .env.example          # required env vars (if any)
├── src/
│   ├── index.ts          # Entry point (CLI arg parsing → mode dispatch)
│   ├── config.ts         # Env var parsing, defaults
│   ├── cli/              # CLI mode (optional)
│   │   ├── index.ts      # Interactive loop or one-shot
│   │   └── renderer.ts   # Output formatting
│   ├── server/           # HTTP mode (optional)
│   │   ├── index.ts      # Server startup
│   │   └── routes/       # Route handlers
│   ├── tools/            # Tool definitions (optional)
│   ├── skills/           # Skill loading (optional)
│   └── __tests__/        # Test files (*.test.ts)
├── scripts/              # Build scripts (optional)
│   └── build.ts
└── dist/                 # Build output (gitignored)
```

## Key Patterns

### package.json template
```json
{
  "name": "<snake_case>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "start": "bun src/index.ts",
    "test": "bun test src/",
    "build": "bun run scripts/build.ts"
  }
}
```

### tsconfig.json template
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

### Running Commands
```bash
# Run app
bun run --cwd bun_app/<name> start

# Run tests
bun run --cwd bun_app/<name> test

# Build binary
bun run --cwd bun_app/<name> build

# Direct execution
bun bun_app/<name>/src/index.ts [args]
```

## Important Notes

- **Paths must be absolute** when passing directory arguments to scripts
- **dist/ and node_modules/ are gitignored** — never commit build artifacts
- **Always run `bun install`** after adding new dependencies
- **Test before committing** — `bun test src/` should pass with 0 failures
- **Keep apps independent** — bun_apps should not import from each other; share code via root workspace or npm packages
- **Update PLAN.md/TODO.md** when architecture changes or tasks are completed — they are living documents

## See Also

- [PLAN.md](PLAN.md) — Skill's own architecture, operations reference, design decisions
- [TODO.md](TODO.md) — Skill's own tasks, known issues, development history
- [storygraph PLAN.md](../../bun_app/storygraph/PLAN.md) — Reference PLAN.md for a mature bun_app
- [storygraph TODO.md](../../bun_app/storygraph/TODO.md) — Reference TODO.md with run history pattern
- [bun_pi_agent PLAN.md](../../bun_app/bun_pi_agent/PLAN.md) — PLAN.md for agent architecture
- [bun_pi_agent TODO.md](../../bun_app/bun_pi_agent/TODO.md) — TODO.md with development history
