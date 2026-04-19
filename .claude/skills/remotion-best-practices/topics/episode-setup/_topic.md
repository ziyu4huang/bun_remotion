# Episode Setup

Scaffolding, episode creation, shared assets, code quality.
Read this when creating a new episode or video project.

---

## Workspace-First Gate (HARD BLOCK — run FIRST)

**Workspace PLAN.md + TODO.md MUST exist BEFORE any episode-level files.** No exceptions.

### Why strict order matters
1. **Agent guidance:** Workspace PLAN.md is the series bible — characters, arcs, commands, style. The Agent cannot write correct Remotion code without it.
2. **Storygraph input:** `/storygraph` pipeline reads workspace PLAN.md to extract character table, episode guide, story arcs for Knowledge Graph construction. Episode PLAN.md alone is insufficient.
3. **Cross-episode consistency:** TODO.md tracks phase ordering and prevents chapter-skipping.

### Gate procedure (30 seconds — ALWAYS run before episode work)

1. **Workspace PLAN.md exists?** → If NO: create it first (use my-core-is-boss as reference pattern)
2. **Workspace TODO.md exists?** → If NO: create it first (use template in `plan-todo-lifecycle.md`)
3. **Workspace PLAN.md has ALL required sections?** → Characters, Episode Guide, Story Arcs, Running Gags (if chapter-based), Commands. If missing sections → add them before proceeding
4. **Workspace TODO.md matches PLAN.md Episode Guide?** → Phase sections must reflect episode statuses. If drift → sync immediately
5. **Every non-Planned episode has a PLAN.md?** → If missing → create before doing any new episode work

**HARD BLOCK:** If steps 1-2 fail (workspace files don't exist), do NOT create any episode files. Stop and create the workspace files first. This is non-negotiable.

### Creation order enforcement

```
CORRECT ORDER:
  1. Create workspace PLAN.md  (series bible)
  2. Create workspace TODO.md  (phase tracker)
  3. THEN create episode PLAN.md    (story contract)
  4. THEN create episode TODO.md    (after gate passes)

WRONG (NEVER do this):
  - Creating episode PLAN.md when workspace PLAN.md doesn't exist
  - Creating episode TODO.md when workspace TODO.md doesn't exist
  - Skipping workspace files "because the episode story is clear"
```

### Reference pattern: my-core-is-boss

The my-core-is-boss workspace (`bun_remotion_proj/my-core-is-boss/`) demonstrates the correct structure:
- `PLAN.md` — full sections: Characters, Story Reference Files, Project Structure, Import/Image/Audio Convention, Episode Guide, Commands, Adding a New Episode, Style Notes
- `TODO.md` — phased: Phase 1 (Foundation), Phase 2 (Ch1-EP1), Phase 2.5+ (subsequent episodes), remaining chapters
- Each episode has both `PLAN.md` and `TODO.md` with parent cross-references (`> Parent: [../PLAN.md](../PLAN.md)`)

When creating workspace files for a new series, model after my-core-is-boss.

---

## episode-creation -- Multi-episode workflow

- **Determine category first** -- category = video format (narrative_drama, tech_explainer, etc.). Genre = story content. Read `category-guide.md` for decision tree.
- **Read PLAN.md first** -- series bible. Create if absent.
- **Confirm zh_TW story before code** -- stable confirm template, await approval.
- **Chapters: sequential, 3-5 eps** -- never skip. >= 2 gags/ep.
- **Scaffold order (STRICT — workspace-first)**: (1) verify/create workspace PLAN.md → (2) verify/create workspace TODO.md → (3) narration.ts → (4) episode PLAN.md (draft) → (5) **`/storygraph` pipeline + subagent gate** → (6) user approves → (7) episode TODO.md → (8) configs → (9) scenes → (10) update workspace PLAN.md → (11) dev.sh → (12) root pkg → (13) sync-images → (14) bun install → (15) TTS.
- **Graphify quality gate** -- run `/storygraph <series-dir>` (pipeline mode: episode → merge → check), then **subagent** analyzes narration.ts + consistency report → appends gate summary section to episode PLAN.md. User reviews complete PLAN.md → PROCEED/NEEDS-FIX. TODO.md created only AFTER gate passes.
- **Episode PLAN.md** -- story contract per episode with metadata, scene breakdown, running gags, and subagent-generated Graphify Quality Gate section.
- **Naming**: weapon-forger `ch{N}-ep{M}/`/`WeaponForgerCh{N}Ep{M}`; galgame `ep{N}/`/`GalgameMemeTheaterEp{N}`.
- Read `episode-creation.md` for full workflow.

## category-guide -- Video category selection

- **Category ≠ Genre.** Category = video format (7 types). Genre = story content (xianxia_comedy, galgame_meme).
- **7 categories:** narrative_drama, galgame_vn, tech_explainer, data_story, listicle, tutorial, shorts_meme.
- **Each category defines:** scene template, components, animation style, audio mode, dialog system.
- **Scaffolding:** `bun run episodeforge --series <name> --category <id>`.
- Read `category-guide.md` for full reference with decision tree, component matrix, and animation styles.

## scaffolding -- Project structure

- `bun_remotion_proj/<app>/`: package.json, tsconfig, src/{index.ts,Root.tsx,scenes/}, scripts.
- **Repo root commands** via `pwsh scripts/dev.ps1 studio <app>`. Never `cd` subdirs.
- **No Node imports in src/** -- webpack targets browser. Use scripts/ + `require()`.
- Remotion + @remotion/cli same version (4.0.290). durations via `require()`.
- Read `scaffolding.md` for reference.

## shared-assets-images -- Cross-episode assets

- Source: `assets/{characters,backgrounds}/`. `sync-images.sh` copies to each ep `public/images/`.
- **`staticFile()` only** -- webpack imports outside ep dir = 404.
- **Copy, never symlink** -- Remotion 404s symlinks. Verify no `->`.
- New images to assets, re-run sync.
- Read `shared-assets-images.md` for details.

## code-quality -- Code conventions

- 2+ scenes use a utility = export from `assets/`, no local copies.
- `CHARACTERS[id].position`, not ternary chains.
- Repeated visuals at 2+ scenes = extract to `assets/components/`.
- **`name` on every Sequence** for Studio timeline.
- `import React` for `React.FC`.
- Read `code-quality.md` for guidelines.

## plan-todo-lifecycle -- PLAN/TODO file management

- **Three files track every series:** workspace PLAN.md, workspace TODO.md, episode TODO.md.
- **PLAN.md is source of truth** — TODOs reflect PLAN status, never the reverse.
- **Fixed section order** — never reorder, never delete completed items.
- **Sync invariant:** PLAN status ↔ workspace TODO checkmarks ↔ episode TODO checkmarks must agree.
- **Update triggers:** new episode → all three files; status change → PLAN + workspace TODO.
- Read `plan-todo-lifecycle.md` for templates, section order, and sync pipeline.

## deploy-mode -- Streamlined pipeline for established series

- **Use when:** ≥ 3 completed episodes, gate v2.0, previous blended ≥ 70.
- **Replaces Steps 3a-3b** with `storygraph pipeline` + `storygraph write-gate` CLI commands.
- **Falls back to full workflow** if `requires_claude_review === true`.
- Read `episode-creation.md` §Deploy Mode for command reference and comparison table.

## hybrid-mode -- Dual-LLM architecture

- **GLM (free):** structural extraction, quality scoring, cross-link discovery.
- **Claude (paid):** creative writing, subagent analysis, Tier 2 review.
- **`--mode hybrid` (default):** regex + AI extraction combined → community-rich graphs.
- **Never use `--mode regex`** for production — flat star topology, no communities.
- Read `episode-creation.md` §Hybrid Mode for LLM task assignment table.

---

## Cross-References

- `../narrative/galgame.md` -- character images
- `../media/voiceover.md` -- TTS setup
- `../config/compositions.md` -- Composition registration
