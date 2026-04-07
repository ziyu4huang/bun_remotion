---
name: feedback-skill-creation
description: User prefers structured SKILL.md files with references/ and scripts/ subdirectories
type: feedback
---

User approved the skill creation approach for `/create-remotion-video`.

**Why:** User explicitly confirmed the skill structure with "good".

**How to apply:** When creating new Claude Code skills for this user, follow this pattern:
- `.claude/skills/<skill-name>/SKILL.md` with YAML frontmatter (name, description trigger phrases, metadata version)
- `references/` subdirectory for detailed setup docs
- `scripts/` subdirectory for automation scripts (when applicable)
- SKILL.md should include: quick invocation, prerequisites, commands reference, API cheat sheet, common patterns, error troubleshooting
