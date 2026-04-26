---
name: cross-skill-roadmap-update
description: After ANY development, update NEXT/TODO/PLAN in ALL related skills and bun_apps, not just the triggering skill
type: feedback
---

After ANY development step, update roadmap files across ALL related skills — not just the skill that triggered the work.

**Why:** bun_apps cross-reference each other. The workflow engine imports from storygraph (`pipeline-api.ts`), episodeforge (`scaffold.ts`), bun_tts (`tts-pipeline.ts`). Changing one affects the others. NEXT/TODO/PLAN in each skill tracks these dependencies.

**How to apply:**
1. Identify ALL skills involved (the triggering skill + any bun_app whose code was imported/modified)
2. For each: update that skill's NEXT.md (status + reflection), TODO.md (mark done), PLAN.md (if architecture changed)
3. Specific files to check:
   - `.claude/skills/remotion-best-practices/` — strategic roadmap (always)
   - `.claude/skills/storygraph/` — if pipeline-api.ts or storygraph scripts changed
   - `.claude/skills/develop_bun_app/` — managed apps table + architecture
   - `.claude/skills/generate-tts/` — if TTS pipeline changed
   - `.claude/skills/generate-image/` — if image generation changed
4. Cross-link: mention in each skill's TODO that the change affects other skills (e.g., "pipeline-api.ts is consumed by remotion_studio workflow engine")
