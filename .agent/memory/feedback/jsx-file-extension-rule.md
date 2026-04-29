---
name: jsx-file-extension-rule
description: Files containing JSX must use .tsx extension — Vite/esbuild refuses JSX in .ts files. Includes Vite cache clearing procedure.
type: feedback
---

Any file containing JSX syntax (`<Component>`, `<div>`, `<ThemeContext.Provider>`) MUST use the `.tsx` file extension. Vite/esbuild only processes JSX in `.tsx` files.

**Why:** esbuild parses `.ts` as plain TypeScript without JSX support. When it encounters `<X>` in a `.ts` file, it tries to parse it as a comparison operator and fails with `Expected ">" but found "value"`. This is not a TypeScript compiler error — it's an esbuild transform error that happens before TypeScript even sees the code.

**How to apply:**
- When creating React components, context providers, or any file that uses JSX → always use `.tsx`
- After renaming `.ts` → `.tsx`, clear Vite cache: `rm -rf node_modules/.vite`
- Files that are pure data/types/hooks (no JSX) should stay `.ts`
- Quick audit: `grep -rn "return\s*(\s*<" src/ --include="*.ts"` — if hits found, rename to `.tsx`

**Incident (2026-04-27):** `remotion_studio/src/client/theme/context.ts` contained `<ThemeContext.Provider>` JSX but had `.ts` extension. Caused `Transform failed: Expected ">" but found "value"`. Entire web UI was blank. Fix: rename to `context.tsx` + clear Vite cache.

**Vite cache gotcha:** After fixing the source file, the stale transform in `node_modules/.vite/` keeps serving the broken version. Must clear cache AND restart Vite dev server.
