# TODO — 美少女梗圖劇場 第一集：美少女日常荒謬

## Story

小雪、小月和小樱的日常生活有多荒謬？從早起遲到的極限操作到減肥永遠明天開始，從認錯人的社死現場到購物車比人生計畫還長。每個場景都是真實生活的翻版。

Characters: 小雪, 小月, 小樱
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Write narration.ts (6 scenes: Title, Joke1-4, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/GalgameMemeTheater.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/JokeScene1.tsx (早八地獄)
- [x] Write src/scenes/JokeScene2.tsx (減肥騙局)
- [x] Write src/scenes/JokeScene3.tsx (認錯人)
- [x] Write src/scenes/JokeScene4.tsx (購物車)
- [x] Write src/scenes/OutroScene.tsx
- [x] Run sync-images.sh to copy assets images
- [x] Run `bun install` to link workspace
- [x] Generate TTS audio
- [x] Verify in Remotion Studio

## Notes

- EP1 uses simplified narration format (flat text, no per-character segments)
- Component naming: `GalgameMemeTheater.tsx` (no Ep1 suffix — differs from later episodes)
- Not yet rendered to MP4
