# TODO — 誰讓他煉器的！ 第三章 第一集：秘境探索

## Story

低語洞窟的任務完成後，長老派邏輯修正小組參加五年一次的宗門秘境探索。別家宗門在破解上古禁制，周墨掏出了「雷射切割陣法」——效率很高，但把整座秘境的禁制全切斷了，觸發了自毀倒數。招牌缺陷延續：雷射筆沒有方向限制，出口也被切斷了。

Characters: zhoumo, luyang, mengjingzhou, elder, narrator
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (4 scenes: Title, Content1, Content2, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/WeaponForgerCh3Ep1.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/ContentScene1.tsx (秘境入口 — 各宗門準備)
- [x] Write src/scenes/ContentScene2.tsx (雷射切割 vs 上古禁制)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md (episode guide + story arcs)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with scripts
- [x] Run sync-images.sh to copy assets images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:wf-ch3-ep1` to generate audio
- [x] Fix narrator character crash (narrator not in CHARACTERS map → changed to zhoumo/luyang in dialogLines)
- [x] Render final MP4 (9512 frames, 184.4 MB)

## Bug Fixes

- ContentScene2 used `character: "narrator"` in dialogLines, but `narrator` isn't in the CHARACTERS map → DialogBox crashed with `Cannot read properties of undefined (reading 'color')`. Fixed by changing narrator lines to `zhoumo` and `luyang` respectively.
