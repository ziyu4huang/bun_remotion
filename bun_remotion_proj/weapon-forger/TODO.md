# Weapon Forger — Series TODO

> **Related docs:**
> - [PLAN.md](PLAN.md) — Story arcs, characters, episode guide, KG stats
> - Skill TODO: `.claude/skills/storygraph/TODO.md` — Pipeline bugs, run history
> - Code TODO: `bun_app/storygraph/TODO.md` — Script-level implementation tasks

---

## Completed Episodes

All 7 existing episodes are fully rendered:

| Episode | Title | Characters | Status |
|---------|-------|------------|--------|
| ch1-ep1 | 入宗考試 | zhoumo, examiner | Complete |
| ch1-ep2 | 成績公布 | zhoumo, examiner, elder | Complete |
| ch1-ep3 | 丹爐修復 | zhoumo, elder | Complete |
| ch2-ep1 | 禍害成軍 | zhoumo, luyang, mengjingzhou | Complete |
| ch2-ep2 | 低語洞窟 | zhoumo, luyang, mengjingzhou, soul | Complete |
| ch2-ep3 | 三人成虎 | zhoumo, luyang, mengjingzhou, elder | Complete |
| ch3-ep1 | 秘境探索 | zhoumo, luyang, mengjingzhou, elder | Complete |

---

## Backfill: Episode PLAN.md Files

All 7 existing episodes lack individual PLAN.md (story contracts). Per lifecycle spec, every episode needs one with metadata, scene breakdown, story links.

- [x] Create `weapon-forger-ch1-ep1/PLAN.md` — 入宗考試
- [x] Create `weapon-forger-ch1-ep2/PLAN.md` — 成績公布
- [x] Create `weapon-forger-ch1-ep3/PLAN.md` — 丹爐修復
- [x] Create `weapon-forger-ch2-ep1/PLAN.md` — 禍害成軍
- [x] Create `weapon-forger-ch2-ep2/PLAN.md` — 低語洞窟
- [x] Create `weapon-forger-ch2-ep3/PLAN.md` — 三人成虎
- [x] Create `weapon-forger-ch3-ep1/PLAN.md` — 秘境探索

---

## Backfill: Assets Fixes

- [x] Migrate to centralized assets (remotion.config.ts + setPublicDir) — eliminates ~37 MB duplication
- [x] Move audio from public/audio/ to episode root audio/ + use require() instead of staticFile()
- [x] Delete per-episode public/images/ directories
- [x] Deprecate sync-images.sh
- [x] Update BackgroundLayer: `staticFile("images/...")` → `staticFile("backgrounds/...")`
- [x] Fix ch2-ep2 direct image refs: `staticFile("images/elder.png")` → `staticFile("characters/elder.png")`
- [x] Fix ch2-ep3 useSegmentTiming.ts: stale `public/audio/` path → `audio/`
- [x] Update PLAN.md (project structure, import convention, image serving, audio pattern)
- [x] Update TODO.md (replace sync-images items with migration tasks)
- [x] Update world-building.md (background mapping table + new serving note)
- [x] Generate new background images (forge-interior, cave, library, secret-realm)
- [x] Generate `yunzhi.png` (transparent BG, half-body) — needed before ch4-ep1
- [x] Add yunzhi to `assets/characters.ts` after image is ready

---

## Backfill: Legacy Import Migration

All 7 episodes now import from `@bun-remotion/shared`. Key changes:
- `characters.ts` delegates fonts/types/utils to shared
- Scene files import shared components via `@bun-remotion/shared` (resolved via root `node_modules/@bun-remotion/shared` symlink + workspace config)
- `characterConfig` prop added to all CharacterSprite instances
- `getCharacterConfig` callback added to all DialogBox instances
- Image paths updated to include `characters/` prefix (shared CharacterSprite uses direct `staticFile()` path)

- [x] ch1-ep1: migrate imports, `characterConfig`, image paths, verify render
- [x] ch1-ep2: migrate imports, `characterConfig`, image paths, verify render
- [x] ch1-ep3: migrate imports, `characterConfig`, image paths (needs TTS + re-render)
- [x] ch2-ep1: migrate imports, `characterConfig`, image paths (needs TTS + re-render)
- [x] ch2-ep2: migrate imports, `characterConfig`, image paths (needs TTS + re-render)
- [x] ch2-ep3: migrate imports, `characterConfig`, image paths, `overrideLineIndex` preserved (needs TTS + re-render)
- [x] ch3-ep1: migrate imports, `characterConfig`, image paths (needs TTS + re-render)
- [ ] Re-render ch1-ep3 through ch3-ep1 after TTS regeneration

---

## Backfill: TTS Voice Config

All characters currently use `uncle_fu` — indistinguishable in shared scenes.

- [ ] Create `assets/voice-config.json` with per-engine voice mapping (mlx_tts, gemini, edge_tts)
- [ ] Update `assets/scripts/generate-tts.ts` to read from voice-config.json
- [ ] Remove VOICE_MAP + VOICE_DESCRIPTION from all 7 episode narration.ts files
- [ ] Update PLAN.md character table with voice assignments
- [ ] Regenerate TTS for all existing episodes
- [ ] Re-render all episodes with new voices

---

## Backfill: Language Normalization

- [ ] ch1-ep1: convert narration.ts + scenes from zh-CN to zh-TW (align with rest of series)
- [ ] Update workspace PLAN.md Episode Guide: ch1-ep1 language → zh-TW

---

## Next Episode: Ch3-Ep2 — 智商測試

Pipeline per lifecycle spec (episode-creation workflow):

- [ ] Read context (PLAN.md + ch3-ep1 narration.ts + ch3-ep1 OutroScene teaser)
- [ ] Run graphify generation prompt for KG constraints
- [ ] Write story draft → present zh_TW confirm block → user approval
- [ ] Write narration.ts + episode PLAN.md (draft)
- [ ] Run graphify quality gate (`/storygraph` pipeline + subagent analysis)
- [ ] User approves gate results
- [ ] Create TODO.md (Quality Gate already [x])
- [ ] Scaffold episode (configs + scenes + main component)
- [ ] Update workspace PLAN.md (episode guide + story arcs + running gags + commands)
- [ ] Update scripts/dev.sh (ALL_APPS + get_comp_id)
- [ ] Update root package.json (start/build/generate-tts scripts)
- [ ] Run `bun install`
- [ ] Generate TTS
- [ ] Verify in Remotion Studio
- [ ] Render MP4
- [ ] Re-run `/storygraph` to update merged KG

---

## Remaining Episodes

- [ ] ch3-ep3 — 秘境逃脫 (zhoumo, luyang, mengjingzhou)
- [ ] ch4-ep1 — 飛舟事件 (zhoumo, luyang, mengjingzhou, yunzhi) — requires yunzhi.png
- [ ] ch4-ep2 — 宗門大比 (zhoumo, luyang, mengjingzhou, yunzhi)
- [ ] ch4-ep3 — 師姐的評估 (zhoumo, yunzhi, elder)

---

## Cross-Episode Watch Items

- [x] Legacy imports: ch1-ep1 through ch2-ep2 → tracked in Backfill: Legacy Import Migration
- [x] Tech term diversity: ch3 episodes have fewer tech terms (3) vs ch1 (8) — enrich narration in new episodes
- [x] ch1-ep1 zh-CN issue → tracked in Backfill: Language Normalization
- [x] Voice indistinguishability → tracked in Backfill: TTS Voice Config

## Character Assets

- [x] zhoumo.png + zhoumo-chibi.png
- [x] examiner.png + examiner-chibi.png
- [x] elder.png
- [x] luyang.png
- [x] mengjingzhou.png
- [x] yunzhi.png → tracked in Backfill: Assets Fixes
