# op: scaffold `<name>`

Create a new bun_app at `bun_app/<name>/`.

## Before Starting

- [ ] Verify the name doesn't already exist: `ls bun_app/<name>/` should fail
- [ ] Confirm the name is `snake_case` (no hyphens, no scope prefix)

## Steps

1. **Validate name** — must be `snake_case`, no hyphens, no scope prefix
2. **Create directory structure:**
   ```
   bun_app/<name>/
   ├── package.json
   ├── tsconfig.json
   ├── PLAN.md
   ├── TODO.md
   ├── src/
   │   ├── index.ts
   │   └── __tests__/
   │       └── index.test.ts
   ```
3. **Generate package.json** from template (see SKILL.md)
4. **Generate tsconfig.json** from template
5. **Write src/index.ts** — minimal entry with `--help` flag and CLI arg parsing
6. **Write src/__tests__/index.test.ts** — smoke test that imports index
7. **Write PLAN.md** — initial architecture doc (use template from `operations/plan.md`)
8. **Write TODO.md** — initial task list with baseline entry in Development History
9. **Run `bun install`** from repo root (workspace picks up new package)
10. **Run `bun run --cwd bun_app/<name> test`** — verify tests pass

## Template: src/index.ts

```typescript
const args = process.argv.slice(2);

for (const arg of args) {
  if (arg === "--help" || arg === "-h") {
    console.log("Usage: <name> [options]");
    console.log("");
    console.log("Options:");
    console.log("  --help, -h  Show this help");
    process.exit(0);
  }
}

console.log("Hello from <name>!");
```

## Template: src/__tests__/index.test.ts

```typescript
import { describe, test, expect } from "bun:test";

describe("<name>", () => {
  test("smoke test", () => {
    expect(true).toBe(true);
  });
});
```

## After scaffold

- Ask user what the app should do
- Suggest adding `config.ts` for env vars if needed
- Suggest adding `cli/` or `server/` directories based on use case
- Remind user that PLAN.md and TODO.md are living documents — update as the app grows

## Success Criteria

- `bun_app/<name>/` exists with: `package.json`, `tsconfig.json`, `PLAN.md`, `TODO.md`, `src/index.ts`
- `bun run --cwd bun_app/<name> test` passes (1 test, 0 failures)
- `bun install` succeeds from repo root
