# TODO — 誰讓他煉器的！ 第二章 第二集：低語洞窟

## Story

邏輯修正小組第一次正式任務——探索後山的低語洞窟。洞窟裡住著上古劍仙滄溟子的殘魂，已嚇跑十七批弟子。周墨把殘魂當成「離線終端」來修復，修好後發現——三千年前的長老煉了一把宗門至寶劍，但忘記加拔劍按鈕。

Characters: 周墨、陸陽、孟景舟、殘魂（滄溟子，使用 elder.png + 透明效果）
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (4 scenes: title, content1, content2, outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/WeaponForgerCh2Ep2.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (進入洞窟 + 遭遇殘魂)
- [x] Write src/scenes/ContentScene2.tsx (修復殘魂 + 家族遺傳)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md (episode guide)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with scripts
- [x] Run sync-images.sh to copy fixture images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:wf-ch2-ep2` to generate audio
- [x] Quick headless verify
- [x] Render final MP4

## Migration: @bun-remotion/shared (Pending)

- [ ] Update scene imports from `../../../fixture/components/X` to `@bun-remotion/shared`
- [ ] Change `pose` prop to `emotion` on CharacterSprite usage
- [ ] Add `characterConfig={CHARACTERS[character]}` prop to CharacterSprite
- [ ] Add `intensity="enhanced"` prop to CharacterSprite
- [ ] Update DialogBox to use `getCharacterConfig` callback
- [ ] Keep BattleEffects import from `../../../fixture/components/BattleEffects` (project-local)
- [ ] Verify in Remotion Studio after migration
- [ ] Remove legacy imports from fixture/components/
