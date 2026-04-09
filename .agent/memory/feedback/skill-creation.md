---
name: skill-creation
description: Patterns for creating Claude Code skills — SKILL.md structure, load-on-demand subdocs, env-check pattern
type: feedback
---

# Skill Creation Patterns

## v2 Pattern: Load-on-Demand (current preferred — approved 2026-04-10)

SKILL.md stays **lightweight** (entry point only). Detailed content lives in subdocs loaded on demand.

```
.claude/skills/<skill-name>/
  SKILL.md          ← YAML frontmatter + overview + "read X first" instructions
  env-check.md      ← auto-detect environment, run Bash checks, select strategy
  engines/          ← one .md per engine/backend (loaded only for selected engine)
    gemini.md
    edge-tts.md
  platforms/        ← one .md per OS (loaded only for detected platform)
    windows.md
    macos.md
    linux.md
```

**Why:** SKILL.md is always loaded into context. If it contains everything, it wastes tokens on irrelevant platform/engine content. Subdocs let Claude load only what's needed for the current machine.

**How to apply:** For any skill with multiple backends or OS-specific behavior, always split into this structure. SKILL.md should instruct Claude to "read env-check.md first" before proceeding.

### env-check.md pattern

Always include an env-check doc that:
1. Detects platform from system context (`Platform: win32/darwin/linux`)
2. Runs actual Bash commands to test tool availability (e.g. `python -m edge_tts --version`)
3. Checks API keys/credentials
4. Reports a summary: what's available, what engine was selected
5. Tells Claude which platform/ and engines/ doc to read next

### SKILL.md structure

```markdown
---
name: <skill-name>
description: >
  Trigger phrases for skill detection...
metadata:
  version: 2.0.0
---

## STEP 0 — Auto-test environment (ALWAYS do this first)
Read [env-check.md](env-check.md) and follow its instructions.

## Usage
...options table...

## Engine Selection Logic
...priority table...

## Load on Demand
- Platform: platforms/<os>.md
- Engine: engines/<engine>.md
```

---

## v1 Pattern (previous — still valid for simpler skills)

```
.claude/skills/<skill-name>/
  SKILL.md          ← full content including all steps
  references/       ← detailed setup/API docs (optional)
  scripts/          ← automation scripts (optional)
```

User confirmed this pattern with `/create-remotion-video` skill.

**When to use v1:** Skills with a single engine/platform where context cost isn't a concern.  
**When to use v2:** Skills with multiple backends (TTS engines), platform-specific behavior (playback commands), or complex environment detection.
