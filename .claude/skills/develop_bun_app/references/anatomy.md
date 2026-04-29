# App Anatomy & Templates

Reference file for bun_app structure and templates.

## Directory Structure

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
│   ├── client/           # React frontend (optional, Vite)
│   │   ├── index.tsx     # MUST be .tsx (entry has JSX)
│   │   ├── App.tsx       # Router/layout
│   │   ├── pages/        # Page components (.tsx)
│   │   ├── components/   # Shared components (.tsx)
│   │   ├── theme/        # Theme tokens + context
│   │   │   ├── tokens.ts # Pure data — no JSX
│   │   │   ├── context.tsx # MUST be .tsx (ThemeProvider uses JSX)
│   │   │   └── index.ts  # Re-exports
│   │   ├── hooks/        # Custom hooks (.ts)
│   │   └── api.ts        # API client (no JSX)
│   ├── tools/            # Tool definitions (optional)
│   ├── skills/           # Skill loading (optional)
│   └── __tests__/        # Test files (*.test.ts)
├── scripts/              # Build scripts (optional)
│   └── build.ts
└── dist/                 # Build output (gitignored)
```

## JSX File Extension Rule (CRITICAL)

**Any file containing JSX syntax (`<Component>`, `<div>`, etc.) MUST use `.tsx` extension.**

Vite/esbuild only processes JSX in `.tsx` files. A `.ts` file with JSX will fail at build time with:
```
ERROR: Expected ">" but found "value"
```

**Common trap:** Files like `context.ts` that "just have a Provider wrapper" — they contain JSX and must be `.tsx`.

**Quick check:** After creating/renaming any file in a React project:
```bash
grep -rn "return\s*(\s*<" src/ --include="*.ts" | grep -v node_modules
```
If this finds hits, rename those `.ts` files to `.tsx`.

## package.json template

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

## tsconfig.json template

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

## Running Commands

```bash
bun run --cwd bun_app/<name> start
bun run --cwd bun_app/<name> test
bun run --cwd bun_app/<name> build
bun bun_app/<name>/src/index.ts [args]
```
