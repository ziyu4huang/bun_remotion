---
name: episode-creation
description: Episode creation workflow for multi-episode series — PLAN.md, confirm format, story writing, scaffolding order, quality gates
metadata:
  tags: episode, series, story, confirm, workflow, weapon-forger, galgame, PLAN, TODO
---

# Episode Creation Workflow

When creating a new episode for an existing series (e.g., weapon-forger, galgame-meme-theater),
follow this strict workflow. The key principle: **confirm the story in the user's language BEFORE writing any code**.

---

## Step 0: Read PLAN.md and validate chapter structure

**Before doing anything else**, read the series `PLAN.md`.

A PLAN.md is the series "bible" — it contains:
- Characters table (name, voice, color, image)
- Project structure (assets layout, episode dirs)
- **Chapter rules** (for chapter-based series — see below)
- Episode guide table (all episodes with title, theme, status)
- Story arcs (per-chapter/episode summaries)
- Commands (studio, render, TTS)
- Naming conventions
- Running gags tracker

**If PLAN.md doesn't exist, create it first.** Use existing series as reference:
- `bun_remotion_proj/weapon-forger/PLAN.md` — complex series with chapters, running gags, signature items
- `bun_remotion_proj/galgame-meme-theater/PLAN.md` — simpler flat series (ep1-epN), 4 jokes per episode

### Chapter-based series: validate before proceeding

If PLAN.md has a **Chapter Rules** section (e.g., weapon-forger), perform these checks:

1. **Enforce sequential chapter completion** — chapters MUST be completed in order. A chapter is "complete" when all its planned episodes are "Complete" status. You MUST NOT start a new chapter while the previous chapter has unfinished ("Planned") episodes. Target chapter = the earliest chapter that has room AND is not blocked by an earlier incomplete chapter.
2. **Count episodes per chapter** — parse the Episode Guide table. Each chapter MUST have **3-5 episodes**.
3. **Identify the target chapter** — the new episode goes into the first incomplete chapter (sequential order). Do NOT skip ahead.
4. **Check chapter arc** — read the story arcs section. The new episode must fit the current chapter's arc pattern (setup → escalation → cliffhanger).
5. **Check running gags** — read the "招牌梗追蹤" or equivalent table. Identify which gags need evolution in this episode.

**Validation results to surface to the user:**
```
Chapter status: Ch2 has 2/3 Complete (ch2-ep3 still Planned) → MUST complete Ch2 first
Target chapter: Ch2 — next episode is ch2-ep3 (sequential order required)
Arc position:   Ch2 arc is "與禍害三人組匯合" — ch2-ep3 is the cliffhanger finale
Running gags due: 忘加按鈕 (last: ch2-ep2 滄溟子忘加拔劍按鈕), 現代科技用語 (last: ch2-ep2 自動防禦系統)
```

**Hard stop conditions** — do NOT proceed without user decision if:
- A previous chapter has **unfinished (Planned) episodes** — must complete earlier chapters first. **NEVER skip chapters.**
- A chapter already has **5 episodes** — must plan a new chapter first
- A chapter has **1 episode** and the arc suggests it should be longer — discuss with user
- PLAN.md story arcs are missing for the target chapter — write them first

**Minimal PLAN.md template (flat series):**
```markdown
# <Series Name>

<One-line series description>. Tone: <tone>.

## Characters

| Character | Name | Voice | Color | Image |
|-----------|------|-------|-------|-------|
| <id> | <name> | <voice> (gender) | #<hex> | <file>.png |

## Episode Guide

| Episode | Title | Theme | Status |
|---------|-------|-------|--------|

## Commands

(Studio, Render, TTS commands for all episodes)

## Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Directory | `<series>-ep{N}/` | ... |
| Package | `@bun-remotion/<series>-ep{N}` | ... |
| Composition ID | `<PascalCase>Ep{N}` | ... |
```

**PLAN.md template with chapter structure (weapon-forger style):**
```markdown
# <Series Name>

<N>-ep series description. Tone: <tone>.

## Chapter Rules

- **Episode count:** Each chapter MUST have **3-5 episodes**. No single-episode chapters.
- **Running gags:** Every episode MUST evolve at least 2 running gags.
- **Original artifact:** Each chapter should introduce at least one new 法寶 with absurd logic.
- **Arc closure:** Each chapter has a mini-arc with setup → escalation → cliffhanger into next chapter.

## Characters

| Character | Name | Voice | Color | Images |
|-----------|------|-------|-------|--------|
| <id> | <name> | <voice> (gender) | #<hex> | <file>.png |

## Episode Guide

| Episode | Title | Language | Characters | Status |
|---------|-------|----------|------------|--------|
| ch1-ep1 | <title> | zh-TW | <chars> | Complete |

**Chapter summary:** Ch1 = N eps, Ch2 = N eps. Total: N eps.

## Story Arcs

### 第一章：<chapter title>

**Ep1 — <title>：** <story summary>
**Ep2 — <title>：** <story summary>

## Running Gags

| Gag | Ep1 | Ep2 | Ep3+ |
|-----|-----|-----|------|
| <gag name> | <evolution> | <evolution> | TBD |

## Commands

(Studio, Render, TTS commands for all episodes)
```

---

## Step 1: Read context + parse chapter state

1. Read the series `PLAN.md` for episode guide, characters, and story arcs
2. **Parse chapter structure** — identify:
   - Which chapter the new episode belongs to (next incomplete chapter)
   - Current episode count within that chapter (must be < 5)
   - Arc position within the chapter (setup → escalation → cliffhanger)
   - Previous episode's cliffhanger/teaser that this episode must resolve
3. Read the previous episode's `scripts/narration.ts` to understand the dialog style and current story state
4. Read the previous episode's outro scene to get the teaser text for the current episode
5. Check the series memory file in `.agent/memory/project/` for style rules
6. If chapter-based: check the running gags table in PLAN.md — identify which gags need evolution
7. If chapter-based: read the full story arc for the target chapter to ensure continuity

---

## Step 2: Write story draft + present confirm block

Write the story and present it for user confirmation using the **stable confirm template** below.
All content MUST be in the series locale (zh_TW for weapon-forger and galgame-meme-theater).

### Stable Confirm Template

Present this as a single markdown block. Do NOT proceed to code until user approves.

**For chapter-based series** (weapon-forger), include the chapter status block:
```markdown
## 新集數確認 — [系列名] 第[X]章 第[Y]集

### 章節狀態

| 項目 | 內容 |
|------|------|
| 章節 | 第[X]章：[章節標題] |
| 章節進度 | 第[Y]集 / 共[N]集（本集後剩餘[M]集） |
| 故事弧位置 | [setup / escalation / cliffhanger] |
| 前集預告 | [上一集 OutroScene 的預告文字] |

### 基本資訊

| 項目 | 內容 |
|------|------|
| 標題 | [集數標題，zh_TW] |
| 語言 | zh-TW |
| 角色 | [角色1], [角色2], ... |
| 場景數 | [N] scenes |

### 故事摘要

[2-3 句 zh_TW 故事大綱]

### 對話腳本

**TitleScene（旁白）**
> [旁白內容]

**ContentScene1（[場景描述]）**
> [角色1]：[對話]
> [角色2]：[對話]
> ...

**ContentScene2（[場景描述]）**
> [角色1]：[對話]
> [角色2]：[對話]
> ...

**OutroScene（旁白 + 預告）**
> [旁白總結]
> [下集預告]

### 視覺效果計畫

| 場景 | 主要效果 | 備註 |
|------|---------|------|
| Content1 | [效果列表] | [說明] |
| Content2 | [效果列表] | [說明] |

### 招牌梗延續

| 梗 | 本集延續 | 與前集對比 |
|----|---------|-----------|
| 忘加按鈕 | [本集的具體表現] | 前集：[前集的表現] |
| 現代科技用語 | [本集用到的術語] | 前集：[前集的術語] |
| 法寶反噬 | [本集的反噬效果] | 前集：[前集的效果] |

### 章節規則檢查

- [x] 章節集數：本集後第[X]章共[N]集（符合 3-5 集規則）
- [x] 故事弧：本集為 [setup/escalation/cliffhanger]，符合章節弧線設計
- [x] 招牌梗：本集延續 [N] 個招牌梗（最低要求 2 個）
- [x] 前集連接：承接上集預告「[預告文字]」

---
請確認以上內容，或告訴我需要修改的地方。
```

**For flat series** (galgame-meme-theater, no chapters), use the simpler template:
```markdown
## 新集數確認 — [系列名] 第[X]集

### 基本資訊

| 項目 | 內容 |
|------|------|
| 標題 | [集數標題，zh_TW] |
| 語言 | zh-TW |
| 角色 | [角色1], [角色2], ... |
| 場景數 | [N] scenes |

### 故事摘要

[2-3 句 zh_TW 故事大綱]

### 對話腳本

**TitleScene（旁白）**
> [旁白內容]

**ContentScene1（[場景描述]）**
> [角色1]：[對話]
> [角色2]：[對話]
> ...

**ContentScene2（[場景描述]）**
> [角色1]：[對話]
> [角色2]：[對話]
> ...

**OutroScene（旁白 + 預告）**
> [旁白總結]
> [下集預告]

### 視覺效果計畫

| 場景 | 主要效果 | 備註 |
|------|---------|------|
| Content1 | [效果列表] | [說明] |
| Content2 | [效果列表] | [說明] |

---
請確認以上內容，或告訴我需要修改的地方。
```

### Writing quality checklist

Before presenting, verify:

- [ ] **Series tone consistency** — weapon-forger = deadpan absurd (一本正經胡說八道), galgame-meme-theater = relatable everyday absurdity
- [ ] **Dialog is punchy** — short lines, rapid back-and-forth, no monologues
- [ ] **One big laugh per scene** — a clear punchline or absurd escalation
- [ ] **Character voice consistency** — re-read previous episode narration before writing
- [ ] **Outro teaser plants the hook** — makes viewer want to see the next episode
- [ ] **zh_TW text is natural** — not machine-translated from zh_CN, uses proper TW phrasing
- [ ] **Teaser matches PLAN.md** — the outro teaser should align with the next episode in PLAN.md story arcs
- [ ] (weapon-forger) **Running gags continue** — check PLAN.md "招牌梗追蹤" table
- [ ] (weapon-forger) **Modern tech in ancient setting** — 模組, 系統, 演算法, 使用者體驗

**Chapter rules validation** (chapter-based series only):
- [ ] **Sequential order** — all earlier chapters must be fully Complete. If Ch2 has Planned episodes, do NOT create Ch3 episodes
- [ ] **Episode count check** — after adding this episode, the chapter must have ≤ 5 episodes. If this would make 6, stop and discuss with user
- [ ] **Arc position matches** — if chapter has 3 episodes, position = setup/escalation/cliffhanger. If 4-5, distribute arc beats appropriately
- [ ] **Running gags ≥ 2** — this episode must evolve at least 2 of the tracked running gags from PLAN.md
- [ ] **Previous episode connection** — the story must acknowledge or resolve the previous episode's cliffhanger/teaser
- [ ] **Chapter arc closure** — if this is the last episode of a chapter, the outro must contain a cliffhanger that sets up the next chapter

---

## Step 3: User confirms → scaffold episode

Only after user approval, proceed to code generation in this exact order:

1. **Create TODO.md** in episode folder (use template below)
2. **Write narration.ts** — confirmed dialog becomes the narration script
3. **Create config files** — package.json, tsconfig.json, index.ts, Root.tsx, main component
4. **Write scene components** — TitleScene, ContentScenes, OutroScene
5. **Update PLAN.md** — all relevant sections:
   - Episode guide table (add new row, update status)
   - Chapter summary line (update episode count: "Ch3 = 2 eps")
   - Story arcs section (add this episode's summary under the correct chapter)
   - Running gags table (add new column with this episode's gag evolution — replace "TBD" with actual content)
   - Commands section (add studio/render/TTS commands)
   - **New characters table** (if this episode introduces a new character — add to Characters table with voice/color/image)
6. **Update dev.sh** — ALL_APPS list + get_comp_id() case
7. **Update root package.json** — start/build/generate-tts scripts
8. **Run sync-images.sh** — copy assets images (if series uses assets pattern). **CRITICAL:** Verify files are actual copies, NOT symlinks. Remotion's static server returns 404 for symlinks. Check with `ls -la public/images/` — no `->` arrows. See [shared-assets-images.md](shared-assets-images.md) for the full pattern and why webpack imports don't work.
9. **Run bun install** — link workspace
10. **Generate TTS** — `bun run generate-tts:<alias>`
11. **Quick headless verify** — playwright-cli snapshot/screenshot (Studio only for visual bug debugging)

---

## Step 4: Verify consistency

After scaffolding, check against the series style lock:

- Title scene: same gradient, spring configs, glow effect — only episode number + subtitle change
- Font imports: consistent across episodes
- Dialog box: same style (white semi-transparent for galgame, themed for xianxia)
- Character colors: fixed per character across ALL episodes (see PLAN.md Characters table)
- Background: thematic per scene, consistent quality
- Transitions: TransitionSeries with varied types (clockWipe, wipe, slide, fade, flip)

---

## Templates

### TODO.md Template (series-agnostic)

For full template details, update rules, and sync pipeline, see [plan-todo-lifecycle.md](plan-todo-lifecycle.md).

```markdown
# TODO — <系列名> 第[X]集：[標題]

## Story

[2-3 句 zh_TW 故事摘要]

Characters: [角色列表]
Language: zh-TW (Traditional Chinese)
Chapter: 第[N]章：[章節標題]（第[M]/[K]集）

## Setup Tasks

- [x] Create TODO.md
- [ ] Write narration.ts ([N] scenes: ...)
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create src/<MainComponent>.tsx
- [ ] Write src/scenes/TitleScene.tsx
- [ ] Write src/scenes/<ContentScene1>.tsx ([場景描述])
- [ ] Write src/scenes/<ContentScene2>.tsx ([場景描述])
- [ ] Write src/scenes/OutroScene.tsx
- [ ] Update PLAN.md (episode guide)
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with scripts
- [ ] Run sync-images.sh to copy assets images (if applicable)
- [ ] Run `bun install` to link workspace
- [ ] Run `bun run generate-tts:<alias>` to generate audio
- [ ] Quick headless verify (playwright-cli snapshot/screenshot)
- [ ] Render final MP4
```

### narration.ts Template (galgame-meme-theater style — single voice)

```typescript
/**
 * Narration scripts for <系列名> 第[X]集 (EP<N>).
 *
 * Each scene narration reads the ACTUAL dialog lines so voice matches subtitles.
 * Audio is generated via MLX TTS (Qwen3-TTS) or Gemini TTS fallback.
 */

export interface NarrationScript {
  scene: string;
  file: string;
  text: string;
}

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    text: "[旁白內容]",
  },
  {
    scene: "JokeScene1",
    file: "02-joke1.wav",
    text: "[對話合併文字]",
  },
  // ... more scenes
  {
    scene: "OutroScene",
    file: "06-outro.wav",
    text: "[感謝收看 + 本集總結 + 下集預告]",
  },
];
```

### narration.ts Template (weapon-forger style — per-character voice)

```typescript
/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第[X]章 第[Y]集：[標題]
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)    → uncle_fu  — male
 *   [其他角色]        → [voice]   — [gender]
 *   narrator         → uncle_fu  — male narrator
 */

export type VoiceCharacter = "zhoumo" | "elder" | "examiner" | "narrator";

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export const NARRATOR_LANG = "zh-TW";

export const VOICE_MAP: Record<VoiceCharacter, string> = {
  zhoumo: "uncle_fu",
  elder: "uncle_fu",
  examiner: "serena",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  elder: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  examiner: { voice: "serena", gender: "female", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  // ... scenes with per-character segments
];
```

### package.json Template (series-agnostic)

```json
{
  "name": "@bun-remotion/<series>-ep<N>",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render <CompositionId> out/<series>-ep<N>.mp4",
    "upgrade": "remotion upgrade",
    "generate-tts": "bun run <path-to-shared-generate-tts.ts>"
  },
  "dependencies": {
    "@bun-remotion/shared": "workspace:*",
    "@remotion/cli": "4.0.290",
    "@remotion/google-fonts": "4.0.290",
    "@remotion/transitions": "4.0.290",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

---

## Series-Specific Naming Conventions

### weapon-forger (chapter-based)

| Item | Pattern | Example |
|------|---------|---------|
| Directory | `weapon-forger-ch{N}-ep{M}/` | `weapon-forger-ch1-ep3/` |
| Package name | `@bun-remotion/weapon-forger-ch{N}-ep{M}` | `@bun-remotion/weapon-forger-ch1-ep3` |
| Composition ID | `WeaponForgerCh{N}Ep{M}` | `WeaponForgerCh1Ep3` |
| Component file | `WeaponForgerCh{N}Ep{M}.tsx` | `WeaponForgerCh1Ep3.tsx` |
| Root script alias | `wf-ch{N}-ep{M}` | `wf-ch1-ep3` |
| Audio files | `01-title.wav`, `02-content1.wav`, `03-content2.wav`, `04-outro.wav` | Same every episode |
| Scene files | `TitleScene.tsx`, `ContentScene1.tsx`, `ContentScene2.tsx`, `OutroScene.tsx` | Same every episode |

### galgame-meme-theater (flat episode numbering)

| Item | Pattern | Example |
|------|---------|---------|
| Directory | `galgame-meme-theater-ep{N}/` | `galgame-meme-theater-ep5/` |
| Package name | `@bun-remotion/galgame-meme-theater-ep{N}` | `@bun-remotion/galgame-meme-theater-ep5` |
| Composition ID | `GalgameMemeTheaterEp{N}` | `GalgameMemeTheaterEp5` |
| Component file | `GalgameMemeTheaterEp{N}.tsx` | `GalgameMemeTheaterEp5.tsx` |
| Root script alias | `meme{N}` | `meme5` |
| Audio files | `01-title.wav` ... `06-outro.wav` | Same every episode |
| Scene files | `TitleScene.tsx`, `JokeScene1-4.tsx`, `OutroScene.tsx` | Same every episode |

---

## Reflection questions (self-check before presenting)

1. Does this episode advance the overall story arc?
2. Is the humor consistent with the series tone?
3. Would a viewer who just watched the previous episode feel continuity?
4. Does the outro teaser set up the next episode properly?
5. Are there enough visual effects to keep the runtime engaging?
6. Does PLAN.md need updating? (episode guide, story arcs, commands)
7. (weapon-forger) Does the 招牌梗追蹤 table get updated with this episode's gag evolution?
8. **(chapter-based) Does adding this episode keep the chapter within 3-5 episodes?**
9. **(chapter-based) Does the episode's arc position (setup/escalation/cliffhanger) fit the chapter's narrative flow?**
10. **(chapter-based) If this is the chapter finale, does the outro cliffhanger set up the next chapter?**

---

## Common pitfalls

| Pitfall | Fix |
|---------|-----|
| No PLAN.md for the series | Create PLAN.md in series parent dir as Step 0 — it's the series bible |
| **Exceeding 5 episodes per chapter** | Count existing episodes in PLAN.md Episode Guide. If chapter has 5, plan a new chapter |
| **Skipping chapters (out of order)** | Ch2 must be fully Complete before starting Ch3. Check PLAN.md — if any earlier chapter has Planned episodes, complete them first |
| **Single-episode chapter** | Chapter Rules require minimum 3 episodes. Plan at least 2 more before proceeding |
| **Skipping running gag evolution** | Check PLAN.md running gags table. Every episode must evolve ≥ 2 gags |
| **Outro doesn't connect to next chapter** | If chapter finale, the cliffhanger must set up the next chapter's arc |
| **Not updating chapter summary** | After adding an episode, update "ChN = M eps" line in PLAN.md |
| Presenting English summary for confirmation | Always present zh_TW dialog verbatim |
| Writing code before user confirms story | Wait for explicit approval |
| Inconsistent character voices | Re-read previous episode narration before writing |
| Missing running gags (weapon-forger) | Check PLAN.md "招牌梗追蹤" table |
| Outro teaser doesn't match next episode plan | Read PLAN.md story arcs section |
| Copy-pasting previous episode without updating dialog | Each scene's dialogLines[] must be new content |
| Forgetting to update PLAN.md | Update episode guide + story arcs + running gags + chapter summary + commands |
| Forgetting to update dev.sh | ALL_APPS + get_comp_id() must include new episode |
| Wrong composition ID format | Follow series naming convention (PascalCase, no hyphens) |
| Wrong tsconfig extends path | Must be correct relative depth (count `../` from episode to repo tsconfig) |
| Not creating TODO.md per episode | Always create TODO.md — it's the task tracker and reflection log |
| Symlinks in public/ instead of copies | Remotion's static server can't follow symlinks — always `cp`, never `ln -sf` |
| Not verifying images after sync | Run `ls -la public/images/` — should show regular files, no `->` arrows |
| Using webpack imports for assets images | `import img from '../assets/bg.png'` resolves to raw path (404) because Remotion sets webpack context to the episode dir. Always use `staticFile()` + `sync-images.sh` instead |
