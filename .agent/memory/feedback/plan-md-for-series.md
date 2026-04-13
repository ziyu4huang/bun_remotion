---
name: plan-md-for-series
description: Every multi-episode series needs a PLAN.md as its bible — learned from creating galgame-meme-theater ep5
type: feedback
---

# PLAN.md is required for every multi-episode series

**Rule:** Before creating any new episode, check if the series parent directory has a `PLAN.md`. If not, create it as Step 0 before anything else.

**Why:** When creating galgame-meme-theater ep5, the series had no PLAN.md (unlike weapon-forger which had one from the start). This meant there was no central reference for episode guide, naming conventions, commands, or story arcs. Creating it upfront for ep5 made scaffolding much smoother and gives future episodes a clear reference.

**How to apply:**
- Check `bun_remotion_proj/<series>/PLAN.md` exists before starting any episode
- If missing, create it with: characters table, episode guide, project structure, commands, naming conventions
- Reference weapon-forger/PLAN.md (complex) or galgame-meme-theater/PLAN.md (simple) as templates
- The episode-creation.md skill now includes this as Step 0

**Related:** episode-creation.md skill rule was updated to include Step 0 (ensure PLAN.md exists) and generalize from weapon-forger-specific to series-agnostic
