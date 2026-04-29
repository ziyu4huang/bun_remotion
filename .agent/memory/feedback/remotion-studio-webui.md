---
name: remotion-studio-webui
description: remotion_studio WebUI architecture — 13 pages, port layout, dev server commands, common pitfalls
type: feedback
---

remotion_studio WebUI runs two servers:
- **Port 5173** — Hono API server (`bun run src/server/index.ts`)
- **Port 3000** — Vite dev server, proxies `/api` → `localhost:5173`

**Start with Bun (not node):**
```bash
bun run --cwd bun_app/remotion_studio src/server/index.ts &
bunx --bun vite  # from bun_app/remotion_studio/
```

**Not node:** Use `bunx --bun vite` instead of `npx vite`. Vite runs under Bun runtime this way.

**Common pitfalls:**
1. `.ts` files with JSX → rename to `.tsx` (see `jsx-file-extension-rule.md`)
2. Stale Vite cache after source fixes → `rm -rf node_modules/.vite` then restart
3. Port conflicts → Vite auto-increments (3000→3001), but API proxy still points at 5173

**Page architecture:** 13 pages routed via `App.tsx` state (not react-router). Sidebar sections: Overview, Production, Analysis, AI, Assets.
