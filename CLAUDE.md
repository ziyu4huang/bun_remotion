# CLAUDE.md - Project Knowledge Index

Knowledge base is organized in `.agent/memory/` by category. Read relevant files before working.

## Quick Reference

- **Project:** bun-remotion — AI video generation using Remotion + Bun
- **Tech stack:** Bun + Remotion v4.0.290 + React 18 + TypeScript 5.8
- **Output:** MP4 (1920x1080, 30fps) via FFmpeg
- **JS runtime:** Always use Bun (not npm). `bun install`, `bun run`
- **No config needed:** No remotion.config.ts — defaults work with Bun

## Commands

All commands run from the **repo root**. Do NOT `cd` into `bun_remotion_proj/` — scripts handle directory changes internally via `scripts/dev.sh` (macOS/Linux) or `scripts/dev.ps1` (Windows).

| Command | What It Does |
|---------|-------------|
| `bun install` | Install all workspace dependencies |
| `bun start` | Open ClaudeCodeIntro in Remotion Studio |
| `bun start:claude` | Open ClaudeCodeIntro in Remotion Studio |
| `bun start:stock` | Open TaiwanStockMarket in Remotion Studio |
| `bun run build` | Render ClaudeCodeIntro to MP4 |
| `bun run build:stock` | Render TaiwanStockMarket to MP4 |
| `bun run build:all` | Render all projects |
| `bun run upgrade` | Update Remotion packages |

Direct script usage (bypasses package.json):
```
bash scripts/dev.sh studio <app-name>
bash scripts/dev.sh render <app-name>
bash scripts/dev.sh render-all
```

## Video Categories

Every Remotion project has a **category** that determines scene structure, animation style, and audio mode.
Defined in `bun_app/remotion_types/src/category-types.ts`.

| Category | zh_TW | Projects | Dialog System |
|----------|-------|----------|---------------|
| **Narrative Drama** | 敘事劇情 | weapon-forger, my-core-is-boss, xianxia-system-meme | dialogLines[] |
| **Galgame VN** | 美少女遊戲風 | galgame-meme-theater, galgame-youth-jokes | dialogLines[] |
| **Tech Explainer** | 技術講解 | claude-code-intro, storygraph-explainer | narration_script |
| **Data Story** | 數據故事 | taiwan-stock-market | narration_script |
| **Listicle** | 盤點清單 | *(none yet)* | item_list |
| **Tutorial** | 教學指南 | *(none yet)* | step_guide |
| **Shorts / Meme** | 短影音迷因 | *(none yet)* | none (sfx only) |

**Category ≠ Genre.** Genre = story content style (xianxia_comedy). Category = video format (narrative_drama).
A series has BOTH: `weapon-forger → xianxia_comedy + narrative_drama`.

## Post-clone setup

After a fresh clone, weapon-forger episodes need symlinks to shared images:
```bash
bash bun_remotion_proj/weapon-forger/fixture/scripts/sync-images.sh
```

## CRITICAL: Never `cd` into subdirectories

Claude Code's Bash tool persists the working directory across calls. Once you `cd bun_remotion_proj/xxx`, **all subsequent commands run from that directory** — including `bun run build:stock` which expects to be at the repo root. This causes silent failures and wrong-context bugs.

**Rules:**
- NEVER run `cd bun_remotion_proj/<name>` in Bash commands — not standalone, not with `&&`
- ALWAYS run commands from the repo root
- Use `scripts/dev.sh` for studio/render (macOS) or `scripts/dev.ps1` (Windows)
- For sub-app scripts, use `bun run --cwd bun_remotion_proj/<name> <script>` — sets CWD only for the spawned process, agent CWD stays at repo root
- For file operations, use absolute paths or Read/Write/Edit tools instead of `cd`

**Approved patterns:**
```bash
# studio/render
bash scripts/dev.sh studio claude-code-intro
bash scripts/dev.sh render claude-code-intro

# sub-app scripts (generate-tts, etc.)
bun run --cwd bun_remotion_proj/claude-code-intro generate-tts
bun run generate-tts:claude   # root package.json shortcut (also uses --cwd)

# direct script by path (no cd needed; __dirname resolves correctly)
bun bun_remotion_proj/claude-code-intro/scripts/generate-tts.ts

# NEVER — persists CWD
cd bun_remotion_proj/claude-code-intro && bun run generate-tts
```

## Memory (project-based, in `.agent/memory/`)

All memory — project knowledge, user feedback, preferences — lives in `.agent/memory/`. Checked into git so it persists across machines.

### On-Demand Reference Files

Read these when the topic is relevant — don't load them every turn:

| File | When to Read |
|------|-------------|
| `project/project-structure.md` | Need to find where a file lives or understand directory layout |
| `project/remotion-api-reference.md` | Using Remotion APIs, configuring package.json for new projects |
| `feedback/_index.md` | Starting any task — lists 39 lesson files organized by topic |

### Convention

- Types: `project`, `feedback`, `user`, `reference`
- Each note: self-contained, with YAML frontmatter (name, description, type)
- New files: `.agent/memory/<category>/<kebab-case-name>.md`
- Do NOT use `~/.claude-glm/.../memory/` — this project uses project-based memory only
