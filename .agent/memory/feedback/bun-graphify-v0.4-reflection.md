---
name: bun-graphify-v0.4-reflection
description: Lessons from v0.4.0 pipeline run — regex gaps, PLAN.md data issues, character detection limits
type: feedback
---

## Rule: Regex pipeline gag detection depends on PLAN.md having a column for every episode

**Why:** ch2ep3 has 0 gag nodes because PLAN.md gag table has no `Ch2-Ep3` column. The regex pipeline matches gag columns by episode ID — missing column = no detection. The narration.ts text contains gag manifestations (e.g., 自動評價系統 but 忘加評價標準) but they're not detected without the PLAN.md column.

**How to apply:** Before running pipeline, verify PLAN.md gag table has columns for ALL existing episodes. If a column is missing, either add it to PLAN.md or implement text-based gag detection as fallback.

## Rule: Regex pipeline only detects speaking characters, not text-mentioned characters

**Why:** `soul` (滄溟子) appears in ch2ep3 narration text (2 mentions) but not as a `character:` dialog field. The regex pipeline only creates character_instance nodes from the `character:` field in narration segments. This means non-speaking characters are invisible to the graph.

**How to apply:** When analyzing episode coverage, check narration.ts for character names mentioned in text but not speaking. Consider adding text-mention character detection as a fallback in graphify-episode.ts.

## Rule: 8 WARN in consistency report are mostly false positives from regex trait detection

**Why:** The WARN items (zhoumo missing 萬物皆可修, elder missing traits) are because the regex trait patterns are predefined and limited. The characters DO have these traits in the story, but the specific dialog lines didn't match the regex patterns. A subagent-based analysis would catch these.

**How to apply:** When reviewing consistency reports, distinguish between: (1) regex limitations (false positive WARN) vs (2) real character drift. Regex limitations should not be treated as actionable issues — they're a pipeline limitation, not a story problem.

## Rule: Simplified merge (no canonical nodes) reduced WARN from 38 to 8

**Why:** v0.3.0 had 38 WARN partly because the check script was comparing against canonical character nodes (which had no traits). v0.4.0 removed canonical nodes and only compares episode instances via `same_character` links, producing more meaningful warnings.

**How to apply:** The simplified architecture produces cleaner, more actionable consistency reports. When adding new check types, ensure they compare like-for-like (episode instance vs episode instance) rather than against synthetic aggregate nodes.
