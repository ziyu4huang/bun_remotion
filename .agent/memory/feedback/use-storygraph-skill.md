---
name: use-storygraph-skill
description: Episode pipeline must run /storygraph BEFORE subagent analysis — never skip or fabricate data
type: feedback
---

Episode pipeline must run `/storygraph <series-dir>` (pipeline mode) as Step 3a **before** any subagent analysis in Step 3b. The subagent reads real graphify output (consistency-report.md, merged-graph.json) — never fabricate data.

**Why:** In ch2-ep2, Step 3a was skipped entirely. The subagent fabricated plausible numbers (claimed "22 nodes, 30 edges") with zero real data. When `/storygraph` was actually run later, the real numbers were 13 nodes, 19 edges — and it caught 3 WARNS the subagent missed (linyi/zhaoxiaoqi zero trait coverage, xiaoelder missing core trait). Real graphify data provides signal that manual analysis cannot.

**How to apply:**
1. After narration.ts is written, run `/storygraph <series-dir>` first
2. Verify output files exist: `consistency-report.md`, `merged-graph.json`
3. Only then spawn subagent — feed it the REAL consistency-report.md and merged data
4. The doc (`episode-creation.md`) now has a verification gate in Step 3a that blocks 3b until output files exist
5. Record real pipeline metrics to skill TODO run history
