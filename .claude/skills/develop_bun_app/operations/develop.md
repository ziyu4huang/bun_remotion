# op: develop `<name>`

Add features, modules, or refactor a bun_app.

## Before Starting

- [ ] Read `bun_app/<name>/PLAN.md` — understand current architecture and module relationships
- [ ] Read `bun_app/<name>/TODO.md` P0 section — identify the next task to work on
- [ ] Run tests: `bun run --cwd bun_app/<name> test` — establish baseline

## Step 1: Identify Change Type

Determine what kind of change you're making:

| Change Type | When | Core Action |
|-------------|------|-------------|
| `new-module` | Adding a new export file to `src/` | Create file + test + wire into index.ts |
| `new-route` | Adding HTTP endpoint(s) | Create route handler + wire into server |
| `new-cli-flag` | Adding `--flag` to CLI arg parsing | Edit `src/index.ts` arg loop |
| `new-config` | Adding env var or config field | Edit/create `src/config.ts` |
| `new-tool` | Adding agent tool definition | Create tool in `src/tools/` + register |
| `bugfix` | Fixing a known issue | Write regression test + fix |
| `refactor` | Restructuring existing code | Move code, update imports, verify tests |

Multiple types may apply (e.g., `new-module` + `new-config`). Process them in the order listed.

## Step 2: Plan the Change

Before writing code, state concisely:

1. **Files to create** — full paths of new files
2. **Files to edit** — full paths + what changes
3. **Exports affected** — new/removed/renamed exports
4. **Tests to add** — test file path + test names
5. **PLAN.md impact** — does the module reference table need a new row?

If the change spans 3+ files, write the plan to the user for confirmation before proceeding.

## Step 3: Implement

Follow the recipe for your change type. Each recipe lists exact files to touch and the order to touch them.

### new-module

1. Create `bun_app/<name>/src/<module>.ts` — write exports
2. Create `bun_app/<name>/src/__tests__/<module>.test.ts` — write tests
3. If the module is a public entry point: wire into `src/index.ts`
4. Imports use `.js` extension: `import { foo } from "./module.js"`

### new-route

1. Create `bun_app/<name>/src/server/routes/<route>.ts` — named handler functions
2. Wire into `bun_app/<name>/src/server/index.ts` route dispatch
3. Add route test in `src/__tests__/`
4. Add route type to `src/shared/types.ts` (if types file exists)

### new-tool

1. Create `bun_app/<name>/src/tools/<tool-name>.ts` — tool definition with `description`, `parameters`, `execute`
2. Register in `bun_app/<name>/src/tools/index.ts` — add to tool array/map
3. Add tool test in `src/__tests__/`
4. Verify total tool count matches PLAN.md module table

### new-cli-flag

Edit `bun_app/<name>/src/index.ts` arg parsing loop:
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

### new-config

Edit or create `bun_app/<name>/src/config.ts`:
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

### bugfix

1. Write a regression test that fails with the current code
2. Fix the code
3. Verify the regression test passes

### refactor

1. Identify all importers of the code being moved (grep for the import path)
2. Move the code
3. Update all import paths
4. Run tests to verify nothing broke

## Step 4: Test

```bash
bun run --cwd bun_app/<name> test
```

If tests fail:
1. Read the error output carefully
2. Fix the issue (code bug, not test bug)
3. Re-run tests
4. Repeat until 0 failures

## Step 5: Update Docs

Update these files in order:

1. **`bun_app/<name>/PLAN.md`** — Add new row to module reference table (if new file), update version line (if significant)
2. **`bun_app/<name>/TODO.md`** — Check `[x]` on completed task, add result note. If new issue found: add to Known Issues.

## Import Convention

ES module imports use `.js` extension:
```typescript
import { getConfig } from "../config.js";   // ✅ correct
import { getConfig } from "../config";       // ❌ may fail
import { getConfig } from "../config.ts";    // ❌ wrong
```

## Success Criteria

- Tests pass: `bun run --cwd bun_app/<name> test` returns 0 failures
- New/changed module listed in PLAN.md module reference table
- TODO.md updated: task checked or new issue added

## UI State Management Rules (remotion_studio)

When working on `remotion_studio` React pages, follow these navigation/state rules:

### Multi-Entry-Point Navigation
Views reachable from multiple origins (e.g., "create" from both list and detail) MUST track `prevView` state. Back button returns to the origin view, not a hardcoded target.

```tsx
// ✅ Correct — track origin, return there
const goToCreate = (seriesId?: string) => {
  setPrevView(view);       // remember where we came from
  setView("create");
};
const goBack = () => {
  setView(prevView === "detail" ? "detail" : "list");
};

// ❌ Wrong — hardcoded back target loses context
onBack={() => setView("list")}  // always goes to list even from detail
```

### Silent Refresh
When a child view triggers `onCreated` / `onCompleted`, the parent MUST NOT set `loading: true` (which unmounts the child). Use a `silentRefresh` pattern:

```tsx
// ✅ Correct — silent refresh keeps child mounted
const silentRefresh = () => load(false);

// ❌ Wrong — loading=true unmounts child, losing its state
const load = () => { setLoading(true); ... };
onCreated={load}
```

### Fast-Completing Jobs
Some operations (scaffold dryRun) complete in <1ms, faster than SSE can connect. Use immediate first poll:

```tsx
const poll = async () => {
  const status = await api.getJob(job.id);
  if (status.data) setJob(status.data);
  if (terminal(status.data?.status)) { onCreated(); return; }
  setTimeout(poll, 500);
};
poll();  // call immediately, don't wait for SSE
```
