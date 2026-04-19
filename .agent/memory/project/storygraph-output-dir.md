---
name: storygraph-output-dir
description: storygraph output is storygraph_out/ (renamed from bun_graphify_out/), excluded from git via .gitignore
type: project
---

storygraph (renamed from bun_graphify) outputs to `storygraph_out/` directory. Added to `.gitignore` alongside the old `bun_graphify_out/` pattern.

**Why:** Output directory contains generated HTML/JSON/reports that are regenerated each run — not source code.
**How to apply:** Never commit `storygraph_out/` contents. If referencing graph output, look in `storygraph_out/`.
