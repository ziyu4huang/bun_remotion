# TODO — 美少女梗圖劇場 第七集：AI 時代求生

## Story

AI 幫我們寫作業、AI 幫我們回訊息、但人類的不完美才是最可愛的。小雪、小月和小樱面對 AI 時代的全面入侵，發現人類的生存危機不是 AI 太聰明，而是自己太依賴 AI。

Characters: 小雪, 小月, 小樱
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Write narration.ts (6 scenes: Title, Joke1-4, Outro) — per-character segment format
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/GalgameMemeTheaterEp7.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/JokeScene1.tsx (AI代寫作業)
- [x] Write src/scenes/JokeScene2.tsx (AI回訊息)
- [x] Write src/scenes/JokeScene3.tsx (深度偽造)
- [x] Write src/scenes/JokeScene4.tsx (人類存在的意義)
- [x] Write src/scenes/OutroScene.tsx
- [x] Create src/scenes/useSegmentTiming.ts
- [x] Run sync-images.sh to copy assets images
- [x] Run `bun install` to link workspace
- [x] Generate TTS audio
- [x] Render final MP4

## Notes

- Rendered to out/galgame-meme-theater-ep7.mp4
- First episode to use per-character segments format in narration.ts
- Has segment-durations.json + voice-manifest.json for proportional audio-text sync
