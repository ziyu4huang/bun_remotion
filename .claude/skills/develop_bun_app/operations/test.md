# op: test `<name>`

Run tests for a bun_app and help fix failures.

## Before Starting

- [ ] Read `bun_app/<name>/TODO.md` — check Known Issues for expected test gaps
- [ ] Verify dependencies installed: `bun install`

## Commands

```bash
# Run all tests
bun run --cwd bun_app/<name> test

# Run specific test file
bun run --cwd bun_app/<name> test src/__tests__/config.test.ts

# Run tests matching pattern
bun run --cwd bun_app/<name> test -t "test name pattern"
```

## Workflow

1. **Run tests** — `bun run --cwd bun_app/<name> test`
2. **If all pass** — report count and duration
3. **If failures exist** — for each failure:
   - Read the failing test file
   - Read the source file being tested
   - Identify root cause (wrong import, logic error, missing export, etc.)
   - Fix the source or test file
   - Re-run tests to confirm fix
4. **After fixes** — re-run full suite to check for regressions

## Test Conventions

- Test files: `src/__tests__/*.test.ts` or `src/**/__tests__/*.test.ts`
- Import from `bun:test`: `describe`, `test`, `expect`, `beforeAll`, `afterAll`, `mock`
- For server tests: test route handlers directly (no HTTP server needed)
- For CLI tests: mock `console.log` or capture process output
- For external APIs: mock with `mock()` from `bun:test` or use env var guards

## Tips

- Use `--bail` to stop on first failure: `bun test --bail src/`
- Tests requiring API keys should be guarded: `if (!process.env.API_KEY) return;`
- Keep tests fast — no real network calls in unit tests

## Success Criteria

- `bun run --cwd bun_app/<name> test` exits with 0 failures
- If fixes were applied: TODO.md updated with what was fixed in Development History
