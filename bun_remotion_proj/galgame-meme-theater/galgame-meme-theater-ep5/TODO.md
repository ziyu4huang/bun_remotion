# TODO — 美少女梗圖劇場 第五集：職場求生指南

## Story

小雪、小月、小樱三人各自在職場中摸爬滾打，從面試時的誇張履歷到老闆畫大餅的藝術，從開會廢話大全到加班文化的真實面貌，每一幕都是打工人的血淚寫照。

Characters: 小雪, 小月, 小樱
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [x] Create TODO.md
- [x] Write narration.ts (6 scenes: Title, Joke1-4, Outro)
- [x] Create package.json
- [x] Create tsconfig.json
- [x] Create src/index.ts
- [x] Create src/Root.tsx
- [x] Create src/GalgameMemeTheaterEp5.tsx
- [x] Write src/scenes/TitleScene.tsx
- [x] Write src/scenes/JokeScene1.tsx (面試現場)
- [x] Write src/scenes/JokeScene2.tsx (老闆畫大餅)
- [x] Write src/scenes/JokeScene3.tsx (開會廢話大全)
- [x] Write src/scenes/JokeScene4.tsx (加班文化)
- [x] Write src/scenes/OutroScene.tsx
- [x] Update PLAN.md (episode guide)
- [x] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [x] Update root package.json with meme5 scripts
- [x] Run sync-images.sh to copy fixture images
- [x] Run `bun install` to link workspace
- [x] Run `bun run generate-tts:meme5` to generate audio
- [x] Quick headless verify (playwright-cli snapshot/screenshot)
- [x] Render final MP4 (94MB, 5232 frames, ~2:54)

## Reflections

### What went well
- PLAN.md created upfront gave a clear series bible — episode guide, naming conventions, commands all in one place
- TODO.md task tracker kept scaffolding organized — no steps missed
- Copying from ep4 as template was fast — same structure, only dialog/backgrounds/effects changed
- TTS generated on first try with mlx_tts (serena voice)

### Visual effects by scene
| Scene | Background | Accent Color | Special Effect |
|-------|-----------|-------------|----------------|
| JokeScene1 (面試現場) | classroom-morning | #F472B6 (pink) | Warm study lamp glow |
| JokeScene2 (老闆畫大餅) | cafe | #FBBF24 (gold) | Golden "大餅" glow |
| JokeScene3 (開會廢話大全) | school-corridor | #818CF8 (indigo) | Meeting room fluorescent + REC timer |
| JokeScene4 (加班文化) | bedroom-night | #60A5FA (blue) | Night monitor glow + moon |

### Headless Verification (playwright-cli)

Used playwright-cli for quick headless verification instead of Remotion Studio:
- `playwright-cli open http://localhost:3000 --browser=chrome-for-testing`
- `playwright-cli goto "http://localhost:3000/GalgameMemeTheaterEp5"`
- `playwright-cli snapshot --depth=5` — check DOM structure (TransitionSeries, 6 Sequences, audio refs)
- `playwright-cli screenshot` — visual check of title and content scenes
- Both screenshots confirmed: title scene (gradient, text, kanji, particles) and content scene (background, characters, dialog box, scene indicator) rendered correctly
- Note: canvas brightness check doesn't work — Remotion Studio uses WebGL internally, not accessible via DOM canvas
- Note: `playwright-cli` requires `chrome-for-testing` browser installed (`playwright-cli install-browser chrome-for-testing`)
- Note: Studio must be started from the correct episode directory (not the root or another app)

### Lessons for next episode
- Each joke scene uses a different background to match the theme (classroom for interview, cafe for boss, corridor for meeting, bedroom-night for overtime)
- The REC timer indicator in JokeScene3 was a nice touch — adds visual variety beyond the standard scene indicator
- OutroScene subtitles match the 4 joke themes — keeps the episode's identity coherent
