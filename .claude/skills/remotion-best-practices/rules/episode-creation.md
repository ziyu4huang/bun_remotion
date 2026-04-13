---
name: episode-creation
description: Episode creation workflow for multi-episode series — confirm format, story writing, scaffolding order, quality gates
metadata:
  tags: episode, series, story, confirm, workflow, weapon-forger, galgame
---

# Episode Creation Workflow

When creating a new episode for an existing series (e.g., weapon-forger, galgame-meme-theater),
follow this strict workflow. The key principle: **confirm the story in the user's language BEFORE writing any code**.

---

## Step 1: Read context

1. Read the series `PLAN.md` for episode guide, characters, and story arcs
2. Read the previous episode's `scripts/narration.ts` to understand the dialog style and current story state
3. Read the previous episode's outro scene to get the teaser text for the current episode
4. Check the series memory file in `.agent/memory/project/` for style rules
5. Check the "招牌梗追蹤" (running gags) table in PLAN.md to continue the series' identity

---

## Step 2: Write story draft + present confirm block

Write the story and present it for user confirmation using the **stable confirm template** below.
All content MUST be in the series locale (zh_TW for weapon-forger).

### Stable Confirm Template

Present this as a single markdown block. Do NOT proceed to code until user approves.

```markdown
## 新集數確認 — [系列名] 第[X]章 第[Y]集

### 基本資訊

| 項目 | 內容 |
|------|------|
| 標題 | [集數標題，zh_TW] |
| 語言 | zh-TW |
| 角色 | [角色1], [角色2], ... |
| 場景數 | Title + 2 Content + Outro |

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
> [下集/下章預告]

### 視覺效果計畫

| 場景 | 主要效果 | 備註 |
|------|---------|------|
| Content1 | [效果列表] | [說明] |
| Content2 | [效果列表] | [說明] |

### 招牌梗延續
- [系列招牌笑話的延續，例如「忘加停止按鈕」]

---
請確認以上內容，或告訴我需要修改的地方。
```

### Writing quality checklist

Before presenting, verify:

- [ ] **Deadpan absurd tone** (一本正經胡說八道) — Zhou Mo speaks logically about absurd things
- [ ] **Modern tech in ancient setting** — uses terms like 模組, 系統, 演算法, 使用者體驗
- [ ] **Running gags continue** — check PLAN.md "招牌梗追蹤" table
- [ ] **Dialog is punchy** — short lines, rapid back-and-forth, no monologues
- [ ] **One big laugh per scene** — a clear punchline or absurd escalation
- [ ] **Character voice consistency** — Zhou Mo = tech-nerd calm, Elder = wise but exasperated, Examiner = furious
- [ ] **Outro teaser plants the hook** — makes viewer want to see the next episode
- [ ] **zh_TW text is natural** — not machine-translated from zh_CN, uses proper TW phrasing
- [ ] **Teaser matches PLAN.md** — the outro teaser should align with the next episode/chapter in PLAN.md story arcs

---

## Step 3: User confirms → scaffold episode

Only after user approval, proceed to code generation in this exact order:

1. **Create TODO.md** in episode folder (use template below)
2. **Write narration.ts** — confirmed dialog becomes the narration script (use template below)
3. **Create config files** — package.json, tsconfig.json, index.ts, Root.tsx, main component (use templates below)
4. **Write scene components** — TitleScene, ContentScene1, ContentScene2, OutroScene
5. **Update PLAN.md** — episode guide table + story arcs section + commands section + 招牌梗追蹤 table
6. **Update dev.sh** — ALL_APPS list + get_comp_id() case
7. **Update root package.json** — start/build/generate-tts scripts
8. **Run sync-images.sh** — copy fixture images
9. **Run bun install** — link workspace
10. **Generate TTS** — `bun run generate-tts:<alias>`
11. **Open in Studio** — verify visuals

---

## Step 4: Verify consistency

After scaffolding, check against the series style lock:

- Title scene: same gradient, spring configs, glow effect — only episode number + subtitle change
- Font imports: NotoSansTC, MaShanZheng, ZCOOLKuaiLe, ZhiMangXing
- Dialog box: white semi-transparent, dark border, colored name plate, typewriter effect
- Character colors: fixed per character across ALL episodes (see PLAN.md Characters table)
- Background: same base image with gradient overlay
- Transitions: TransitionSeries with varied types (clockWipe, wipe, slide, fade)

---

## Templates

### TODO.md Template

```markdown
# TODO — 誰讓他煉器的！ 第[X]章 第[Y]集：[標題]

## Story

[2-3 句 zh_TW 故事摘要]

Characters: [角色列表]
Language: zh-TW (Traditional Chinese)

## Setup Tasks

- [ ] Create TODO.md
- [ ] Write narration.ts (4 scenes: Title, Content1, Content2, Outro)
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create src/WeaponForgerChNEpM.tsx
- [ ] Write src/scenes/TitleScene.tsx
- [ ] Write src/scenes/ContentScene1.tsx
- [ ] Write src/scenes/ContentScene2.tsx
- [ ] Write src/scenes/OutroScene.tsx
- [ ] Update PLAN.md (episode guide + story arcs + commands + 招牌梗追蹤)
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with wf-chN-epM scripts
- [ ] Run sync-images.sh to copy fixture images
- [ ] Run `bun install` to link workspace
- [ ] Run `bun run generate-tts:wf-chN-epM` to generate audio
- [ ] Open in Remotion Studio and verify visuals
- [ ] Render final MP4
```

### narration.ts Template

```typescript
/**
 * Narration scripts with per-character voice assignment for
 * 誰讓他煉器的！ 第[X]章 第[Y]集：[標題]
 *
 * Voices (mlx_tts):
 *   周墨 (zhoumo)    → uncle_fu  — male
 *   [其他角色]        → [voice]   — [gender]
 *   narrator         → uncle_fu  — male narrator
 *
 * All dialog text is in Traditional Chinese (zh_TW).
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
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "[旁白]" },
      { character: "narrator", text: "[旁白]" },
    ],
    fullText: "[合併文字]",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      // Copy confirmed dialog lines here
    ],
    fullText: "[合併文字]",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      // Copy confirmed dialog lines here
    ],
    fullText: "[合併文字]",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "[感謝收看]" },
      { character: "narrator", text: "[本集總結]" },
      { character: "narrator", text: "[下集預告]" },
    ],
    fullText: "[合併文字]",
  },
];
```

### package.json Template

```json
{
  "name": "@bun-remotion/weapon-forger-chN-epM",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "remotion studio",
    "build": "remotion render WeaponForgerChNEpM out/weapon-forger-chN-epM.mp4",
    "upgrade": "remotion upgrade",
    "generate-tts": "bun run ../../fixture/scripts/generate-tts.ts"
  },
  "dependencies": {
    "@bun-remotion/shared": "workspace:*",
    "@remotion/cli": "4.0.290",
    "@remotion/google-fonts": "4.0.290",
    "@remotion/transitions": "4.0.290",
    "@remotion/paths": "4.0.290",
    "@remotion/shapes": "4.0.290",
    "@remotion/noise": "4.0.290",
    "@remotion/motion-blur": "4.0.290",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

### Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Directory | `weapon-forger-ch{N}-ep{M}/` | `weapon-forger-ch1-ep3/` |
| Package name | `@bun-remotion/weapon-forger-ch{N}-ep{M}` | `@bun-remotion/weapon-forger-ch1-ep3` |
| Composition ID | `WeaponForgerCh{N}Ep{M}` | `WeaponForgerCh1Ep3` |
| Component file | `WeaponForgerCh{N}Ep{M}.tsx` | `WeaponForgerCh1Ep3.tsx` |
| Root script alias | `wf-ch{N}-ep{M}` | `wf-ch1-ep3` |
| Audio files | `01-title.wav`, `02-content1.wav`, `03-content2.wav`, `04-outro.wav` | Same every episode |
| Scene files | `TitleScene.tsx`, `ContentScene1.tsx`, `ContentScene2.tsx`, `OutroScene.tsx` | Same every episode |

---

## Reflection questions (self-check before presenting)

1. Does this episode advance the overall story arc?
2. Is the humor consistent with the series tone?
3. Would a viewer who just watched the previous episode feel continuity?
4. Does the outro teaser set up the next episode/chapter properly?
5. Are there enough visual effects to keep the ~4min runtime engaging?
6. Does the 招牌梗追蹤 table in PLAN.md get updated with this episode's gag evolution?

---

## Common pitfalls

| Pitfall | Fix |
|---------|-----|
| Presenting English summary for confirmation | Always present zh_TW dialog verbatim |
| Writing code before user confirms story | Wait for explicit approval |
| Inconsistent character voices | Re-read previous episode narration before writing |
| Missing running gags | Check PLAN.md "招牌梗追蹤" table |
| Outro teaser doesn't match next episode plan | Read PLAN.md story arcs section |
| Copy-pasting previous episode without updating dialog | Each scene's dialogLines[] must be new content |
| Forgetting to update PLAN.md | Update episode guide + story arcs + commands + 招牌梗追蹤 |
| Forgetting to update dev.sh | ALL_APPS + get_comp_id() must include new episode |
| Wrong composition ID format | Use `WeaponForgerCh{N}Ep{M}` (PascalCase, no hyphens) |
| Wrong tsconfig extends path | Must be `"../../../tsconfig.json"` (episode → weapon-forger → bun_remotion_proj → repo) |
