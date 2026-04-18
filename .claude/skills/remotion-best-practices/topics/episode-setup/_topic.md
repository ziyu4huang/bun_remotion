# Episode Setup

Scaffolding, episode creation, shared assets, code quality.
Read this when creating a new episode or video project.

---

## Sync Invariant Check (run FIRST)

Before any episode-setup work, verify the series PLAN/TODO state:

1. **Workspace PLAN.md** must have these sections: Characters, Episode Guide, Story Arcs, Running Gags (if chapter-based), Commands
2. **Every Complete/Scaffolding episode** must have a PLAN.md file in its directory
3. **Workspace TODO.md** phases must match PLAN.md Episode Guide statuses
4. If any check fails → fix it before proceeding (create missing files, add missing sections)

This check takes 30 seconds and prevents the most common pipeline drift.

---

## episode-creation -- Multi-episode workflow

- **Read PLAN.md first** -- series bible. Create if absent.
- **Confirm zh_TW story before code** -- stable confirm template, await approval.
- **Chapters: sequential, 3-5 eps** -- never skip. >= 2 gags/ep.
- **Scaffold order**: narration.ts → episode PLAN.md (draft) → **`/bun_graphify` pipeline + subagent gate** → user approves → TODO.md → configs → scenes → workspace PLAN.md → dev.sh → root pkg → sync-images → bun install → TTS.
- **Graphify quality gate** -- run `/bun_graphify <series-dir>` (pipeline mode: episode → merge → check), then **subagent** analyzes narration.ts + consistency report → appends gate summary section to episode PLAN.md. User reviews complete PLAN.md → PROCEED/NEEDS-FIX. TODO.md created only AFTER gate passes.
- **Episode PLAN.md** -- story contract per episode with metadata, scene breakdown, running gags, and subagent-generated Graphify Quality Gate section.
- **Naming**: weapon-forger `ch{N}-ep{M}/`/`WeaponForgerCh{N}Ep{M}`; galgame `ep{N}/`/`GalgameMemeTheaterEp{N}`.
- Read `episode-creation.md` for full workflow.

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

---

## Cross-References

- `../narrative/galgame.md` -- character images
- `../media/voiceover.md` -- TTS setup
- `../config/compositions.md` -- Composition registration
