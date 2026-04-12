# TODO: Weapon Forger Ch1-Ep1 — 入宗考试：考试任务

## Status: [x] Complete

### Phase 1: Scaffold
- [x] package.json, tsconfig.json, src/index.ts
- [x] Copy 6 components from xianxia-system-meme-ep2
- [x] Create characters.ts (zhoumo + examiner)

### Phase 2: Scenes
- [x] TitleScene — 谁让他炼器的！第一章第一集
- [x] ContentScene1 — 周墨到达问道宗，考官布置炼器任务
- [x] ContentScene2 — 自动寻路飞剑锁定考官储物袋
- [x] OutroScene — credits + 下集预告

### Phase 3: Composition
- [x] Root.tsx with calculateMetadata
- [x] WeaponForgerCh1Ep1.tsx with TransitionSeries
- [x] Wire audio to each scene

### Phase 4: Audio (TTS)
- [x] Write narration.ts
- [x] Update generate-tts.ts
- [x] Generate TTS audio files
- [x] Verify durations.json
- [x] Run TTS verification: `python mlx_tts/verify_tts.py --project bun_remotion_proj/weapon-forger-ch1-ep1`

### Phase 5: Character Images
- [x] Write per-image manifest JSONs (zhoumo.json, zhoumo-chibi.json, examiner.json, examiner-chibi.json)
- [x] Generate normal + chibi sprites (transparent BG)
- [x] Verify all images

### Phase 6: Render
- [x] Test in Remotion Studio
- [x] Polish timing/effects
- [x] Render MP4

## Notes
- Characters: zhoumo (周墨) + examiner (考官)
- Voices: zhoumo → uncle_fu, examiner → serena
- No battle effects in this episode — just comic effects + system notification
