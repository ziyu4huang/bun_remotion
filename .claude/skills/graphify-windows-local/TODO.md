# TODO - graphify-windows-local Improvements

## Phase 1: Scripts & Output

- [x] Fix SKILL_DIR path (graphify-windows → graphify-windows-local) — 2026-04-10
- [x] Implement explain/query/path commands in SKILL.md — 2026-04-10
- [x] Add graph.json Format Reference section (links vs edges, node ID convention) — 2026-04-10
- [x] Add Node ID Convention docs to SKILL.md — 2026-04-10
- [x] Persist labels to graphify-out/.labels.json — 2026-04-10
- [x] Create feedback memory: graphify-query-explain-lessons.md — 2026-04-10
- [x] Create scripts/explain.py — one-shot node explanation — 2026-04-10
- [x] Create scripts/codebase_map.py — compact agent-readable CODEBASE_MAP.md — 2026-04-10
- [x] Wire codebase_map.py into Step 9 of pipeline — 2026-04-10
- [x] Wire explain.py into explain command (replace inline Python) — 2026-04-10
- [x] Save CODEBASE_MAP.md to .agent/memory/project/ for agent auto-loading — 2026-04-10
- [x] Add --summarize flag (skip pipeline, regenerate CODEBASE_MAP.md from existing graph.json only) — 2026-04-10

## Phase 2: Incremental & Quick Modes

- [x] Add --quick flag (use graphify.cache to skip unchanged files, merge only new extractions) — 2026-04-10
- [x] Wire --update to actually use cache module (currently a stub) — 2026-04-10

## Phase 3: Integration

- [x] Graph diff between runs (use graphify.analyze.graph_diff()) — 2026-04-10
- [x] Auto-suggest CLAUDE.md updates when new god nodes appear — 2026-04-10 (via graph_diff.py CLAUDE.md suggestions)
- [x] Fuzzy semantic node search (match node labels/IDs with typos) — 2026-04-10 (explain.py uses difflib.SequenceMatcher)
- [x] Export CODEBASE_MAP.md section suitable for pasting into CLAUDE.md — 2026-04-10 (--claudemd flag on codebase_map.py)
