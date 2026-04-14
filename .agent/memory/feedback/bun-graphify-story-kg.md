---
name: bun-graphify-story-kg
description: Lessons from building federated story knowledge graph for weapon-forger series — subagent for NL, pipeline architecture, HTML rendering bugs
type: feedback
---

## Rule: Story KG must be built from natural language content, not code structure

**Why:** The narration.ts files contain the actual story (dialog, plot, emotions). Regex pattern matching on code produces shallow graphs with wrong node types (AST nodes instead of story elements). Subagent analysis of dialog/narration produces rich story KG with plot_event, relationship, artifact, emotional_beat, theme nodes.

**How to apply:** When running `/bun_graphify` on a Remotion episode series, the primary extraction path is:
1. Parse `narration.ts` → extract dialog segments per character
2. Use Claude subagent to analyze the natural language content → produce story KG JSON
3. Feed story KG JSON into graphology + Louvain → generate graph.html

## Rule: Never put TypeScript syntax in HTML template strings

**Why:** `const tc: Record<string, number> = {};` inside a template literal produces valid TypeScript but crashes the browser with "Missing initializer in const declaration". The graph showed empty/blank until fixed to `const tc = {};`.

**How to apply:** When generating HTML from TypeScript template literals, ensure all embedded JavaScript is pure ES (no type annotations, no Record<>, no interface). Test by searching for `: Record<` or `: string` patterns in the template.

## Rule: Always verify HTML output with Playwright

**Why:** Opening in browser manually is not reliable — empty pages can look like "loading". Playwright catches JS errors immediately: `page.on('pageerror')` and `page.on('console', msg => msg.type() === 'error')`. The graph.html was "empty" but only Playwright revealed the actual JS error.

**How to apply:** After generating graph.html, run Playwright headless check:
```
page.goto(file://...graph.html, { waitUntil: 'load' })
await page.waitForTimeout(8000)  // wait for vis.js physics
check: graph children > 0, canvas exists, no console errors
```

## Rule: Subagent output JSON needs robust extraction

**Why:** Claude subagents sometimes produce JSON with single quotes, trailing commas, or unescaped characters in Chinese text (e.g., `'技術宅不懂人情世故'`). These break JSON.parse. 5 of 7 episodes parsed cleanly, 2 needed manual fixing.

**How to apply:** When extracting JSON from subagent output:
1. Find last assistant message in JSONL output
2. Extract raw JSON between first `{` and last `}`
3. Try parse → try fixing trailing commas → try fixing missing quotes → re-run subagent if all fail
4. Validate node count matches expected range before writing

## Architecture: Federated Story KG Pipeline

The pipeline for a Remotion series:
```
narration.ts (per episode)
  → subagent: analyze story content → graph.json (per episode)
  → graphify-merge.ts: merge all episodes + link edges → merged-graph.json
  → graphify-check.ts: consistency checking → consistency-report.md
  → gen-story-html.ts: graph.json → graph.html (per episode + merged)
```

Key node types for story KG:
- episode_plot, scene, character_instance, plot_event, artifact
- running_gag, character_trait, relationship, theme

Key edge relations:
- appears_in, part_of, involves, creates, uses, exhibits
- leads_to (event chain), frustrates (comedy), illustrates (event→theme)

## Script locations

- `bun_app/bun_graphify/src/scripts/gen-story-html.ts` — reads graph.json, builds graphology graph, runs Louvain, generates vis.js HTML
- `bun_app/bun_graphify/src/scripts/graphify-episode.ts` — regex-based narrative extraction (backup/quick mode)
- `bun_app/bun_graphify/src/scripts/graphify-merge.ts` — combines per-episode graphs with cross-episode link edges
- `bun_app/bun_graphify/src/scripts/graphify-check.ts` — consistency checking
- `bun_app/bun_graphify/src/scripts/graphify-pipeline.ts` — orchestrates all steps
