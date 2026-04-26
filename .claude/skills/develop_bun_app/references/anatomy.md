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
│   ├── tools/            # Tool definitions (optional)
│   ├── skills/           # Skill loading (optional)
│   └── __tests__/        # Test files (*.test.ts)
├── scripts/              # Build scripts (optional)
│   └── build.ts
└── dist/                 # Build output (gitignored)
```

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
