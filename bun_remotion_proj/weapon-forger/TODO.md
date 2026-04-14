# Weapon Forger — Series TODO

> **Related docs:**
> - [PLAN.md](PLAN.md) — Story arcs, characters, episode guide, KG stats
> - Skill TODO: `.claude/skills/bun_graphify/TODO.md` — Pipeline bugs, run history
> - Code TODO: `bun_app/bun_graphify/TODO.md` — Script-level implementation tasks

## Next Up — ch3-ep2 (智商測試)

- [ ] Write story draft → present zh_TW confirm block → user approval
- [ ] Scaffold episode directory (see PLAN.md "Adding a New Episode")
- [ ] narration.ts + scenes (import from `@bun-remotion/shared`)
- [ ] TTS generation
- [ ] Studio verify → render MP4
- [ ] Run `bun_graphify episode` to add to merged KG

## Remaining Episodes

### ch3-ep3 — 秘境逃脫
- [ ] Story draft → approval → scaffold → narration → TTS → render → KG

### ch4-ep1 — 飛舟事件
- [ ] Generate yunzhi character image (transparent BG, half-body)
- [ ] Story draft → approval → scaffold → narration → TTS → render → KG

### ch4-ep2 — 宗門大比
- [ ] Story draft → approval → scaffold → narration → TTS → render → KG

### ch4-ep3 — 師姐的評估
- [ ] Story draft → approval → scaffold → narration → TTS → render → KG

## Cross-Episode Issues

- [ ] Legacy imports: ch1-ep1 through ch2-ep2 still import from `assets/components/` — migrate to `@bun-remotion/shared`
- [ ] Tech term diversity: ch3 episodes have fewer tech terms (3) vs ch1 (8) — enrich narration when writing new episodes
- [ ] ch1-ep1 uses zh-CN (Simplified); all others use zh-TW (Traditional) — normalize when revisiting

## TTS Voice Config Migration

Centralize per-episode voice config (currently duplicated in each narration.ts VOICE_MAP/VOICE_DESCRIPTION) into `assets/voice-config.json`. Pattern established in my-core-is-boss.

- [ ] Create `assets/voice-config.json` with per-engine voice mapping (mlx_tts, gemini, edge_tts) + `defaultTtsModel` + `engines` section
- [ ] Update `assets/scripts/generate-tts.ts` to read from voice-config.json instead of importing VOICE_MAP from narration.ts
- [ ] Remove VOICE_MAP + VOICE_DESCRIPTION from all 7 episode narration.ts files (ch1-ep1 through ch3-ep1)
- [ ] Update PLAN.md character table with voice assignments from voice-config.json
- [ ] Regenerate TTS for all existing episodes (voices will change — zhoumo/elder/luyang/mengjingzhou/narrator all currently use uncle_fu)
- [ ] Update voiceover.md in remotion-best-practices skill if not already covered

## Character Assets

- [x] zhoumo.png + zhoumo-chibi.png
- [x] examiner.png + examiner-chibi.png
- [x] elder.png
- [x] luyang.png
- [x] mengjingzhou.png
- [ ] yunzhi.png (needed for ch4)
