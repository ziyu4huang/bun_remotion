# op: develop `<name>`

Add features, modules, or refactor a bun_app.

## Before Starting

- [ ] Read `bun_app/<name>/PLAN.md` — understand current architecture and module relationships
- [ ] Read `bun_app/<name>/TODO.md` P0 section — identify the next task to work on
- [ ] Run tests: `bun run --cwd bun_app/<name> test` — establish baseline

## Patterns

### Adding a new module

1. Create `src/<module>.ts` with exports
2. Create `src/__tests__/<module>.test.ts` with tests
3. Import from `./<module>.js` (note: `.js` extension for ES module resolution)
4. Wire into `src/index.ts` if needed

### Adding CLI arguments

Edit `src/index.ts` arg parsing loop:
```typescript
const args = process.argv.slice(2);
let mode = "default";

for (const arg of args) {
  if (arg === "--server") mode = "server";
  else if (arg === "--cli") mode = "cli";
  else if (arg.startsWith("--port=")) port = parseInt(arg.split("=")[1]);
  else if (arg === "--help" || arg === "-h") { /* show help */ process.exit(0); }
}
```

### Adding config/env vars

Edit or create `src/config.ts`:
```typescript
export interface AppConfig {
  // fields with defaults from process.env
}

export function getConfig(): AppConfig {
  return {
    field: process.env.APP_FIELD || "default",
  };
}
```

### Adding HTTP routes

1. Create `src/server/routes/<route>.ts` with handler functions
2. Export named handler functions that take `Request` and return `Response`
3. Wire into `src/server/index.ts` route dispatch

### Adding test fixtures

Create `src/__tests__/fixtures/<name>/` with test data files. Keep fixtures minimal.

## Development Loop

1. Write the feature code
2. Write tests for the feature
3. Run `bun run --cwd bun_app/<name> test`
4. Fix any failures
5. Repeat

## Import Convention

ES module imports use `.js` extension:
```typescript
import { getConfig } from "../config.js";        // ✅ correct
import { getConfig } from "../config";             // ❌ may fail
import { getConfig } from "../config.ts";          // ❌ wrong
```

## Success Criteria

- Tests pass: `bun run --cwd bun_app/<name> test` returns 0 failures
- New/changed module listed in PLAN.md module reference table
- TODO.md updated: task moved to Done or new issue added to Known Issues
