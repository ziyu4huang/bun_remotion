# op: build `<name>`

Build a standalone binary for a bun_app.

## Before Starting

- [ ] Run tests: `bun run --cwd bun_app/<name> test` — don't build with failing tests
- [ ] Read `bun_app/<name>/PLAN.md` — check Dependencies section for build requirements

## Commands

```bash
# If app has a build script
bun run --cwd bun_app/<name> build

# Manual compile
bun build bun_app/<name>/src/index.ts --outfile bun_app/<name>/dist/<name> --compile --target bun
```

## Build Script Pattern

Apps that need asset bundling use `scripts/build.ts`:

```typescript
import { cpSync, mkdirSync, rmSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";

const ROOT = import.meta.dir;
const APP = dirname(ROOT);
const DIST = join(APP, "dist");

// Clean dist
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// Compile
execSync(
  `bun build ${join(APP, "src/index.ts")} --outfile ${join(DIST, "binary-name")} --compile --target bun --minify`,
  { stdio: "inherit" }
);

// Copy assets if needed
// cpSync(sourceDir, join(DIST, "assets"), { recursive: true });

// Write minimal package.json for runtime metadata
writeFileSync(join(DIST, "package.json"), JSON.stringify({
  name: "<name>",
  version: "0.1.0",
  private: true,
}, null, 2));
```

## After Build

1. Verify binary exists: `ls -la bun_app/<name>/dist/`
2. Test binary: `./bun_app/<name>/dist/<name> --help`
3. **dist/ is gitignored** — never commit build output

## Success Criteria

- Binary exists at `bun_app/<name>/dist/<name>` (or configured output path)
- Binary runs: `./bun_app/<name>/dist/<name> --help` exits 0
- Binary size is reasonable (< 100MB for typical apps)
