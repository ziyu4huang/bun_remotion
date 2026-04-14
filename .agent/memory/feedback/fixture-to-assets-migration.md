---
name: fixture-to-assets-migration
description: SOP for migrating Remotion series from fixture/ to assets/ with story guides and presets. Applies to my-core-is-boss (done), weapon-forger (done), galgame-meme-theater (pending).
type: feedback
---

# fixture → assets Migration SOP

**Why:** `fixture` is ambiguous (implies test data). `assets` is clearer and the restructure adds novel-writing guides + visual presets for genre support.

## Completed Migrations

| Series | Date | Notes |
|--------|------|-------|
| my-core-is-boss | 2026-04-15 | 590→171 line PLAN.md, 5 story files, 2 preset files |
| weapon-forger | 2026-04-15 | 272→214 line PLAN.md, 4 story files, 2 preset files |
| galgame-meme-theater | 2026-04-15 | 149→164 line PLAN.md (added Story Reference section), 5 story files, 1 preset file, 57 files updated |

## Migration Checklist (per series)

### Phase 1: Rename & Update References
1. `mv {series}/fixture {series}/assets`
2. Update all import paths in episode `src/scenes/*.tsx`: `../../../fixture/` → `../../../assets/` (replace_all)
3. Update each episode's `package.json`: `../fixture/scripts/` → `../assets/scripts/`
4. Update `assets/scripts/sync-images.sh`: rename `FIXTURE` var → `ASSETS`, update comments/echo
5. Update `assets/scripts/generate-tts.ts`: update comment referencing path
6. Update `PLAN.md`: all `fixture/` → `assets/`
7. Update `TODO.md` files: `fixture` → `assets` in completed task notes
8. `grep -r "fixture" {series}/` → verify 0 results
9. `bash {series}/assets/scripts/sync-images.sh` → verify works

### Phase 2: Create `assets/story/` (Novel Writing Guides)
Extract story content from PLAN.md into focused context files for AI agent.

**Universal files (all series):**
- `world-building.md` — world setting, location→background map, visual style
- `characters.md` — character profiles, emotion/pose guides, dialog style
- `plot-arcs.md` — per-chapter/episode summaries with beats and effects needed
- `plot-lines.md` — running gags, tracked threads, evolution table

**Genre-specific files:**
- `system-skills.md` — (system novel only) skill unlock, system versions, GameUI mapping
- `meme-topics.md` — (meme comedy only) joke categories, cultural references

**How to apply:** Read PLAN.md, extract story/lore sections (not technical conventions) into focused files. Keep PLAN.md as slim technical reference (~120-170 lines).

### Phase 3: Create `assets/presets/` (Visual Configs)
Genre-specific TypeScript preset files.

**How to apply:**
- TypeScript (not JSON) so they can import types from `characters.ts`
- Factory functions + curated objects (PRESETS, BATTLE_EFFECTS)
- Reference existing component props

### Phase 4: Slim Down PLAN.md
- Keep: title, character table, project structure, import convention, image sync, episode guide, commands, style notes
- Remove: story background, character descriptions, emotion system, full story arcs, running gags
- Add: "Story Reference Files" section listing new files

### Phase 5: Verify
- `grep -r "fixture" {series}/` → 0 results
- `bash {series}/assets/scripts/sync-images.sh` → works
- `bun run --cwd {series}/{episode} start` → Studio loads

---

## Completed: galgame-meme-theater (2026-04-15)

**Scale:** 7 episodes, 3 characters (1 image each), 8 backgrounds, 7 components, 47 fixture-importing files
**Genre:** Galgame meme/comedy — needs `reaction-effects.ts` preset (not battle effects)
**Unique:** TitleCard.tsx component, single-image characters (no emotion variants), gag-based structure (4 jokes/ep)
**Story files needed:** world-building.md, characters.md, plot-arcs.md, plot-lines.md, meme-topics.md
