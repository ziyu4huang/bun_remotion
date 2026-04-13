# My Core Is Boss (我的核心是大佬)

「系統誤會流」喜劇系列。Tone: 「一本正經胡說八道」×「電子榨菜」。

主角擁有「核心系統」，把整個修行世界看成遊戲 UI。他隨口說的玩家黑話被所有人腦補成「蘊含天地至理的真言」，以為他是隱世大佬。

## Story Background (故事背景)

**世界觀：** 蒼穹大陸，修行文明鼎盛。數萬年來，修行者們通過感悟天道、修煉靈力來追求長生不老。宗門林立，以「天道宗」為首，其次是劍宗、丹宗、器宗等。每百年一次的「百宗大比」決定宗門排名。

**天道宗：** 大陸第一宗門，位於天柱山頂。宗門分為外門、內門和核心弟子。蕭長老是煉器峰的資深長老，掌管宗門的日常運作。宗門下方有一座上古秘境，每十年開放一次。

**核心系統：** 林逸穿越時獲得的神秘系統，來源不明。功能包括：數據化視角（看到所有人的等級、血條、屬性）、任務面板、技能系統、物品欄、社交系統、商城、成就系統。系統會不定期推送更新，每次更新都會帶來新的「誤會」。

**修行等級體系（系統顯示）：**
- 鍛體期（Lv.1-10）→ 築基期（Lv.11-30）→ 金丹期（Lv.31-60）→ 元嬰期（Lv.61-80）→ 化神期（Lv.81-95）→ 大乘期（Lv.96-99）→ 渡劫期（Lv.100）
- 林逸穿越時系統顯示「隱藏等級：???」，實際上他因為系統的基礎面板加成，戰力已經超越渡劫期——但他自己完全不知道

**時間線：** 故事開始於蒼穹大陸的「太平紀元三千年」，一個表面和平實則暗流湧動的時代。

## Characters

| Character | Name | Voice | Color |
|-----------|------|-------|-------|
| linyi | 林逸 | uncle_fu (male) | #F59E0B (amber) |
| zhaoxiaoqi | 趙小七 | serena (female) | #38BDF8 (sky blue) |
| xiaoelder | 蕭長老 | uncle_fu (male) | #A78BFA (purple) |
| narrator | — | uncle_fu (male) | — |

### Character Descriptions

- **林逸 (linyi)** — 現代玩家穿越。腦中裝了「核心系統」，整個世界在他眼中都是遊戲 UI：NPC 頭上飄著等級、血條、好感度。自以為是個菜鳥，其實系統給的基礎面板已經碾壓整個大陸。口頭禪：「這也有 bug？」「能不能跳過？」「載入中...」
- **趙小七 (zhaoxiaoqi)** — 外門弟子，頭號腦補狂魔。任何林逸的行為都能自動昇華成「大道真諦」。寫了一本《林逸師兄語錄》，收錄了林逸說過的所有廢話並加以註解。每次林逸說話，他的腦中會自動展開三千字的小論文。
- **蕭長老 (xiaoelder)** — 天道宗長老，性格嚴肅。最初對林逸充滿懷疑（「這小子一看就沒修為」），但在目睹林逸的「神蹟」後成為忠實信徒。內心戲極多，表面上維持長老威嚴，實則每天都在崩潰邊緣。

## Emotion Image System

Major characters have **multiple images per emotion** instead of a single static sprite. This makes dialog scenes much more expressive — the character visually reacts to each line.

### Emotion Set

| Emotion | File Suffix | Description |
|---------|------------|-------------|
| `default` | `-default.png` | Neutral/calm expression (base) |
| `shock` | `-shock.png` | Eyes wide, jaw dropped |
| `anger` | `-anger.png` | Frowning, intense glare |
| `smile` | `-smile.png` | Smirk or gentle smile |
| `laugh` | `-laugh.png` | Laughing out loud, mouth open |
| `sweat` | `-sweat.png` | Embarrassed, sweat drop |
| `think` | `-think.png` | Hand on chin, deep thought |
| `cry` | `-cry.png` | Crying, tears streaming |
| `gloating` | `-gloating.png` | Smug, superior grin |
| `confused` | `-confused.png` | Head tilt, question marks |
| `chibi` | `-chibi.png` | Chibi/Q-version (for comedy moments) |

### Character Emotion Map

**林逸 (linyi)** — 6 emotions (protagonist, needs most variety):
```
linyi-default.png    ← calm, bored, "loading..."
linyi-shock.png      ← bug found, system glitch
linyi-smile.png      ← exploiting a bug, smug
linyi-laugh.png      ← "this is too easy"
linyi-sweat.png      ← people misunderstanding him again
linyi-confused.png   ← why is everyone kneeling?
linyi-chibi.png      ← comedy reaction moments
```

**趙小七 (zhaoxiaoqi)** — 5 emotions (reaction machine):
```
zhaoxiaoqi-default.png   ← normal fanboy
zhaoxiaoqi-shock.png     ← mind blown by linyi's "wisdom"
zhaoxiaoqi-think.png     ← over-interpreting, brain working overtime
zhaoxiaoqi-gloating.png  ← "I knew it, my master is the best"
zhaoxiaoqi-cry.png       ← emotional moment, idol praise
```

**蕭長老 (xiaoelder)** — 5 emotions (progressive breakdown):
```
xiaoelder-default.png    ← stern elder face
xiaoelder-anger.png      ← "who is this disrespectful brat!?"
xiaoelder-shock.png      ← witnessing linyi's "power"
xiaoelder-sweat.png      ← internal crisis, trying to stay composed
xiaoelder-cry.png        ← completely broken, kneeling
```

### How It Works

**Image naming:** `{character}-{emotion}.png` (e.g., `linyi-shock.png`)

**characters.ts** adds an `emotions` field to `CharacterConfig`:
```typescript
export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
  voice: string;
  emotions: Emotion[];           // available emotions for this character
  defaultEmotion?: Emotion;      // fallback (default: "default")
}

export type Emotion =
  | "default" | "shock" | "anger" | "smile" | "laugh"
  | "sweat" | "think" | "cry" | "gloating" | "confused"
  | "chibi";
```

**DialogLine** gains an `emotion` field:
```typescript
export interface DialogLine {
  character: Character;
  text: string;
  emotion?: Emotion;             // which expression to show during this line
  effect?: ComicEffect | ComicEffect[];
  sfx?: MangaSfxEvent[];
}
```

**CharacterSprite** adds `emotion` prop — resolves to `{character}-{emotion}.png`, falls back to `{character}-default.png` if not found.

**Narration script** (`narration.ts`) includes emotion per line:
```typescript
{
  character: "linyi",
  text: "載入中...為什麼這麼慢啊？",
  emotion: "confused",
  voice: "uncle_fu",
}
```

## Project Structure

```
my-core-is-boss/
  PLAN.md                    # This file
  fixture/
    characters/              # Character images + JSON manifests (MULTI-EMOTION)
      linyi-default.png, linyi-default.json
      linyi-shock.png, linyi-shock.json
      linyi-smile.png, linyi-smile.json
      linyi-laugh.png, linyi-laugh.json
      linyi-sweat.png, linyi-sweat.json
      linyi-confused.png, linyi-confused.json
      linyi-chibi.png, linyi-chibi.json
      zhaoxiaoqi-default.png, zhaoxiaoqi-default.json
      zhaoxiaoqi-shock.png, zhaoxiaoqi-shock.json
      zhaoxiaoqi-think.png, zhaoxiaoqi-think.json
      zhaoxiaoqi-gloating.png, zhaoxiaoqi-gloating.json
      zhaoxiaoqi-cry.png, zhaoxiaoqi-cry.json
      xiaoelder-default.png, xiaoelder-default.json
      xiaoelder-anger.png, xiaoelder-anger.json
      xiaoelder-shock.png, xiaoelder-shock.json
      xiaoelder-sweat.png, xiaoelder-sweat.json
      xiaoelder-cry.png, xiaoelder-cry.json
      chenmo-default.png, chenmo-default.json       # Ch8+
      chenmo-shock.png, chenmo-shock.json
      chenmo-smile.png, chenmo-smile.json
      chenmo-confused.png, chenmo-confused.json
      chenmo-think.png, chenmo-think.json
    backgrounds/             # Shared background images + JSON manifests
      sect-plaza.png, sect-plaza.json
      sect-interior.png, sect-interior.json
      sect-training.png, sect-training.json
      spirit-beast-cave.png, spirit-beast-cave.json
      ancient-realm-entrance.png, ancient-realm-entrance.json
      ancient-realm-inside.png, ancient-realm-inside.json
      dungeon-entrance.png, dungeon-entrance.json
      boss-arena.png, boss-arena.json
      tournament-stage.png, tournament-stage.json
      system-update.png, system-update.json
      siege-battlefield.png, siege-battlefield.json
      mysterious-forest.png, mysterious-forest.json
      demon-seal.png, demon-seal.json
      world-reset.png, world-reset.json
    characters.ts            # Shared: character configs, types, Emotion type, fonts, effects
    components/              # Shared React components (enhanced versions)
      BackgroundLayer.tsx
      CharacterSprite.tsx    # UPDATED — supports `emotion` prop, resolves emotion images
      DialogBox.tsx
      ComicEffects.tsx
      MangaSfx.tsx
      SystemOverlay.tsx
      GameUI.tsx             # NEW — game-style HUD overlay (HP bars, level tags, cooldowns)
    scripts/
      generate-tts.ts        # Shared TTS generator (mlx_tts + Gemini fallback)
  my-core-is-boss-ch1-ep1/   # Episode (lean — only scenes + narration)
    public/
      images/                # Copies of fixture images (run sync-images.sh)
      audio/                 # Episode-specific TTS output
    scripts/
      narration.ts           # Episode dialog + voice map + emotion per line
    src/
      scenes/                # Episode-specific scenes
      MyCoreIsBossCh1Ep1.tsx # Main component
      Root.tsx               # Composition
      index.ts               # registerRoot()
```

### Image Sync Convention

Each episode's `public/images/` contains **copies** of fixture images (NOT symlinks — Remotion's static server doesn't follow symlinks, causing 404 during render).

**Source of truth:** `fixture/characters/` and `fixture/backgrounds/`

After updating images in fixture, run the sync script:
```bash
bash fixture/scripts/sync-images.sh
```

This copies all fixture images into every episode's `public/images/`.

### Character JSON Format

Each character emotion has a corresponding `{character}-{emotion}.json` manifest. The Agent uses these JSONs to generate images via `/generate-image`.

```json
{
  "file": "linyi-shock.png",
  "type": "emotion",
  "emotion": "shock",
  "character": "linyi",
  "facing": "LEFT",
  "description": "角色描述，用於 Agent 理解上下文",
  "prompt": "anime style... (直接傳給 /generate-image 的 prompt)",
  "backgroundStrategy": "solid magenta #FF00FF, remove with rembg",
  "color": "#F59E0B",
  "width": "800-1200px"
}
```

**Fields:**
- `file` — output filename (matches PNG)
- `type` — `"emotion"` for expressions, `"chibi"` for Q-version
- `emotion` — emotion tag matching Emotion type in characters.ts
- `character` — character key matching Character type
- `facing` — always `"LEFT"` (Remotion flips by position)
- `description` — zh_TW description for Agent context
- `prompt` — English prompt for image generation (include "solid magenta #FF00FF background" for rembg)
- `backgroundStrategy` — how to make transparent: magenta background + rembg
- `color` — character theme color
- `width` — target image width

**Image generation workflow:**
1. Read the JSON file for the desired emotion
2. Use `prompt` field with `/generate-image`
3. Run rembg to remove magenta background
4. Save as `file` field name
5. Run `sync-images.sh` to distribute to episodes

### Background JSON Format

Each background has a `{name}.json` manifest.

```json
{
  "file": "sect-plaza.png",
  "description": "zh_TW 場景描述",
  "prompt": "anime style... (direct prompt for /generate-image)",
  "color": "#0a0a2e",
  "chapters": [1, 2, 10]
}
```

**Fields:**
- `file` — output filename
- `description` — zh_TW description for Agent context
- `prompt` — English prompt for image generation (1920x1080, no text, no watermark)
- `color` — overlay gradient base color
- `chapters` — which chapters use this background

### Import Convention

Scenes import from fixture using relative paths:

```typescript
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { notoSansTC, type DialogLine } from "../../../fixture/characters";
```

Components inside `fixture/components/` import from `../characters` (sibling of components dir).
Episode `generate-tts` script path: `../fixture/scripts/generate-tts.ts` (relative from episode root).

## Episode Guide

| Episode | Title | Language | Characters | Status |
|---------|-------|----------|------------|--------|
| ch1-ep1 | 首次誤會 | zh-TW | linyi, zhaoxiaoqi, xiaoelder | Images Ready |
| ch1-ep2 | 任務跳過 | zh-TW | linyi, zhaoxiaoqi | Planned |
| ch1-ep3 | Bug 利用 | zh-TW | linyi, zhaoxiaoqi, xiaoelder | Planned |
| ch2-ep1 | 秘境速通 | zh-TW | linyi, zhaoxiaoqi, xiaoelder | Planned |

## Adding a New Episode

Follow the `/remotion-best-practices` skill → load `rules/episode-creation.md` for the full workflow.

**Workflow summary:**
1. Read context (PLAN.md, previous narration.ts, previous outro teaser)
2. Write story draft → present **confirm block in zh_TW** → wait for user approval
3. After approval → scaffold episode (TODO.md → narration.ts → configs → scenes → update PLAN.md/dev.sh/package.json)
4. Verify style consistency against this PLAN.md
5. Generate TTS → verify in Studio → render MP4

**File checklist for each new episode:**
```
my-core-is-boss-chN-epM/
  TODO.md                                    # Task tracker
  package.json                               # @bun-remotion/my-core-is-boss-chN-epM
  tsconfig.json                              # extends ../../../tsconfig.json
  scripts/narration.ts                       # Episode dialog + voice map
  src/index.ts                               # registerRoot()
  src/Root.tsx                               # <Composition> with TTS-driven duration
  src/MyCoreIsBossChNEpM.tsx                 # Main component + TransitionSeries
  src/scenes/TitleScene.tsx                  # Title card (copy from prev ep, update text)
  src/scenes/ContentScene1.tsx               # Scene 1 dialog + effects
  src/scenes/ContentScene2.tsx               # Scene 2 dialog + effects
  src/scenes/OutroScene.tsx                  # Credits + teaser (update text)
  public/images/                             # Synced from fixture (run sync-images.sh)
  public/audio/                              # Generated by TTS (gitignored)
```

**Config updates (3 places):**
- `scripts/dev.sh` — add to `ALL_APPS` + `get_comp_id()` case
- Root `package.json` — add `start:mcb-chN-epM`, `build:mcb-chN-epM`, `generate-tts:mcb-chN-epM`
- This `PLAN.md` — update Episode Guide table + Story Arcs + Commands

## Commands

```bash
# Studio
bash scripts/dev.sh studio my-core-is-boss-ch1-ep1

# Render
bash scripts/dev.sh render my-core-is-boss-ch1-ep1

# TTS
bun run generate-tts:mcb-ch1-ep1
```

---

## Story Arcs — Full 10 Chapters (30 Episodes)

### 第一章：系統覺醒（3 ep）

**Ep1 — 首次誤會：** 林逸穿越到天道宗，腦中裝了「核心系統」。他站在宗門廣場上，眼前所有修行者頭上都飄著等級和血條。他嘀咕「載入中...」、「跳過對話」、「這 NPC 好醜」，周圍的人把這些話解讀為「正在感悟天道」、「不屑與凡人交流」、「一眼看穿本質」。趙小七目擊全程，從此成為林逸的頭號腦補粉絲，並寫下第一篇《林逸師兄語錄》。蕭長老聞訊趕來，本想驅逐這個「狂徒」，卻被系統顯示的林逸「隱藏等級」嚇到腿軟（其實是系統 UI 的字體太大擋住了長老的視線）。

**Ep2 — 任務跳過：** 宗門發布「清剿妖獸」任務，所有人都在認真準備。林逸看了一眼任務面板，發現可以「跳過過場動畫」直接領取獎勵。他繞過妖獸洞穴走到終點，打開寶箱拿走獎勵。妖獸全程懵逼。趙小七將此解讀為「以大乘期修為無視妖獸，直取天道本源」。蕭長老開始暗中記錄林逸的每一句話。

**Ep3 — Bug 利用：** 宗門大比，林逸發現比武台的邊界有碰撞體 Bug，可以把對手卡在牆裡。他用這招贏了所有比賽。趙小七解讀為「空間禁錮之術，上古失傳秘法」。蕭長老偷偷把「卡模型」寫進了自己的修煉筆記。

---

### 第二章：修煉就是練功（3 ep）

林逸發現「修煉」在本質上就是掛機打怪練等。他開始用 MMO 玩家的思維來「修仙」。

**Ep1 — 掛機修仙：** 林逸發現打坐修煉就是「掛機練功」，於是設定了自動修煉腳本（其實是調整了呼吸節奏讓系統判定為「持續在線」）。他去睡覺，一覺醒來升了 50 級。趙小七守了他三天三夜，以為他在進行「閉關悟道」，寫下十萬字觀察日記。蕭長老看到林逸的修為暴漲，偷偷把自己練了三十年的功法燒了。

**Ep2 — 經驗值農場：** 林逸發現後山的靈獸洞窟是「最佳刷怪點」，開始定點刷怪。他還發現了「經驗加成卡」的規律——每逢月圓之夜，靈獸會自動排隊走進他的攻擊範圍。趙小七認為這是「萬獸朝聖」。蕭長老帶著全宗門弟子來觀摩「林逸師兄的馭獸秘術」。

**Ep3 — 技能點分配：** 林逸升級後需要分配技能點，他隨便點了幾個看似無用的技能（「採集 Lv.MAX」、「辨識 Lv.MAX」、「跳躍 Lv.MAX」）。結果：他能採集到別人看不到的隱藏材料、辨識出所有法寶的弱點、跳到別人夠不到的地方。全宗門開始瘋狂研究「隱藏職業」的意義。

---

### 第三章：秘境速通（3 ep）

天道宗開放上古秘境，其他宗門嚴陣以待，林逸把它當速通遊戲玩。

**Ep1 — 速通記錄：** 各宗門精英在秘境入口研討攻略。林逸用「noclip 穿牆」直接飛到終點，打開終極寶箱，全程 3 分鐘。秘境守護者（上古大能殘魂）看傻了。趙小七在門口倒計時，解讀為「大能的時間法則」。蕭長老偷偷把「穿牆」列入天道宗必修課。

**Ep2 — 隱藏關卡：** 林逸在速通時無意中觸發了秘境的隱藏關卡（因為他走了一條「不合理的路徑」——其實是繞了路去撿一個寶箱）。隱藏關卡裡是一個上古陣法迷宮，林逸用「查看代碼」直接看到答案。守護者殘魂崩潰：「我設了三千年！你看了三秒！」

**Ep3 — 秘境 BOSS：** 秘境最終 BOSS 是一頭上古兇獸，各宗門精英聯手都打不過。林逸觀察了十秒，發現 BOSS 有「仇恨機制」——只要拉著它繞柱子就能贏。他帶著 BOSS 繞了一棵樹跑了二十圈，BOSS 因為「路徑尋找 AI 出錯」卡進了地形裡。全場震驚，稱之為「以天地為陣，困萬古兇獸」。

---

### 第四章：副本開團（4 ep）

林逸把宗門任務當成「副本」來組團刷，趙小七自願當「坦克」，蕭長老被趙小七說服當「治療」。

**Ep1 — 組隊系統：** 林逸打開「組隊面板」，把趙小七（職業：狂熱信徒/坦克）和蕭長老（職業：崩潰長老/治療）拉進隊伍。蕭長老對「治療」這個定位極度不滿——「老夫是劍修！劍修！」但趙小七勸他：「長老，治療是團隊核心。」林逸看了一眼隊伍面板，嘀咕：「這什麼爛配置，坦克沒仇恨技能，治療沒藍。」蕭長老聽到「沒藍」以為自己在靈力上有缺陷，回去閉關研究。

**Ep2 — 副本機制：** 三人進入「魔獸山谷」副本。林逸一路上在講解「副本機制」：「這個房間要先打小怪清場」「這裡有陷阱別踩」「BOSS 有二階段」。趙小七瘋狂記筆記，認為這是「兵法傳承」。蕭長老發現林逸說的每一條規則都是對的——他修煉了三百年都沒發現的機制。

**Ep3 — 團滅與重來：** 第二次副本時林逸手滑按到了「全體传送」（其實是系統的脫戰傳送），把整支隊伍傳送回了入口。所有人以為這是「緊急撤退神通」，感歎林逸的反應速度。林逸：「...我就說了，這遊戲的鍵位設定有問題。」

**Ep4 — 首通獎勵：** 三人終於打過副本 BOSS。系統彈出「首通成就」，林逸習慣性地點了分享到「世界頻道」——結果整個修仙界的「天道傳音」都收到了一條莫名其妙的訊息：「恭喜玩家 LinYi_9527 首通魔獸山谷（普通難度）！用時：47分鐘。評價：C。」

---

### 第五章：跨服 PK（3 ep）

「百宗大比」——各宗門的正式對抗賽，在林逸眼中就是「跨服排位賽」。

**Ep1 — 排位賽：** 百宗大比開幕，各宗門派出精英弟子。林逸查看對手列表，發現有「段位標籤」——大部分都是「青銅」和「白銀」，只有一個是「鑽石」。他嘀咕：「這匹配機制有問題吧，我怎麼跟一群青銅排到一起？」對手們聽到了，以為他在說「你們都是凡人，不值一提」。

**Ep2 — 禁選階段：** 林逸發現比賽有「禁選機制」——雙方可以禁掉對手的法寶。對手禁了林逸的飛劍，林逸：「沒事，我還有備用裝備。」他從儲物袋裡掏出了一堆系統獎勵的道具——全部是普通品質，但在修行界每一件都是傳說級法寶。趙小七：「師兄果然深藏不露，隨手就是一袋子神器！」

**Ep3 — 總決賽：** 決賽對手是「鑽石」段位的天才——劍宗聖子，專修劍道三十年。林逸發現對手的攻擊有「前搖動作」（攻擊前的預備動作），直接在系統上標記了「破綻位置」。每一劍都能完美閃避。聖子崩潰：「你怎麼每次都能提前知道我要打哪裡？」林逸：「...因為你的攻擊模式太固定了，跟脚本似的。」

---

### 第六章：系統更新（3 ep）

核心系統推送了大版本更新 v2.0，UI 全面改版，新增了「社交系統」、「成就系統」和「商城」。

**Ep1 — UI 大改版：** 林逸一覺醒來發現系統界面全變了。他習慣性地点旧位置的功能按钮，结果触发了一堆新功能——「随机传送」「全体buff」「自动拾取」。在別人看來，林逸突然學會了十幾種新神通。趙小七：《語錄》更新到第三卷。蕭長老把新 UI 的每個變化都對應到了「大道感悟」上。

**Ep2 — 社交系統：** 系統新增「好友列表」和「聊天頻道」。林逸習慣性地對空氣打字——「有人組隊嗎？」「求帶副本」「這遊戲新手教程在哪？」——結果這些話通過系統廣播到了方圓百里。修行界震動：「林大能在向天道發問！他在尋求大道的答案！」「求帶副本」被解讀為「願意引導後輩」。

**Ep3 — 成就解鎖：** 林逸無意中解鎖了一堆成就——「連續誤解 100 次」「讓 3 個 NPC 崩潰」「在 0 秒內完成戰鬥」——每個成就解鎖都伴隨全服公告。修行界的人把這些成就公告當作「天機降臨」，開始逐條研究其中的深意。「讓 3 個 NPC 崩潰」被解讀為「以言出法，令天地動容」。

---

### 第七章：公會戰（4 ep）

宗門之間爆發大規模衝突，林逸用公會戰的邏輯來指揮天道宗防禦。

**Ep1 — 宣戰公告：** 敵對宗門「血影門」向天道宗發出挑戰書。系統彈出「公會戰」通知，林逸看了看：「哦，攻城戰啊。」他開始在地圖上標記「防禦塔位置」「補給線」「包抄路線」。趙小七把這張圖當作「天罡北斗陣圖」，蕭長老照著部署——居然完美運作。

**Ep2 — 兵力配置：** 林逸用「資源管理」思維分配弟子：「高攻低防的放前排當 DPS」「靈力多的放後排當法師」「跑得快的去偵察」。天道宗第一次有了科學的戰術體系。血影門的探子回報：「天道宗佈下了上古軍陣！」其實林逸只是照著 RTS 遊戲的標準開局在佈兵。

**Ep3 — 城牆 BUG：** 血影門攻城時，林逸發現城牆的防禦陣法有一個「死角」——他之前練「跳躍 Lv.MAX」時發現的。他直接跳到城牆外面，繞到敵軍後方，把他們的攻城器械全部「採集」了（採集 Lv.MAX）。敵軍指揮官：「我們的攻城錘呢？」「被一個人搬走了。」「...一個人？！」

**Ep4 — 勝利结算：** 戰爭勝利，系統彈出「結算面板」，顯示每個人的貢獻值。林逸貢獻值最高——因為他搬走了所有攻城器械。趙小七第二——因為他在戰場上寫了三萬字的《戰爭觀察日記》。蕭長老最低——因為他全程都在「治療」（其實是在崩潰邊緣來回橫跳）。

---

### 第八章：另一個玩家（4 ep）

林逸發現這個世界可能不只有他一個「玩家」。

**Ep1 — 可疑行跡：** 林逸在系統中發現了另一個「玩家標記」——某個 NPC 的名字是綠色的（像玩家 ID），而且行為模式也很詭異。他開始跟蹤這個人。趙小七認為師兄在「洞察天機」，主動當偵察兵。蕭長老翻遍了古籍，找到了「綠名者，天道使徒也」的記載。

**Ep2 — 對峙：** 林逸找到了那個人——一個在修行界到處「收菜」的傢伙（其實是另一個穿越者，但他沒有系統，只有前世記憶）。這個人一直在用現代知識裝高手，但裝得很勉強。林逸一眼看穿：「你也是玩家？」對方：「你也...？」兩人終於找到了可以正常說話的人。趙小七在旁邊錄音，把這段對話解讀為「兩位大能在進行精神层面的對話，凡人聽不懂」。

**Ep3 — PK 約戰：** 另一個穿越者不服林逸，提出決鬥。兩人約定「用最真實的方式」打一場——結果兩人都不會真的打鬥，最後變成了「比誰能裝更像高人」的演技大賽。觀戰的修行者們看得目瞪口呆，認為這是「大道之辯」。

**Ep4 — 結盟：** 決鬥不分勝負，兩人決定合作。另一個穿越者叫「陳默」，是個程式設計師（跟林逸一樣）。兩人開始用程式邏輯分析修行界的「底層代碼」。趙小七把這些分析記錄下來，成為了修行界最神秘的典籍《天機源碼》。蕭長老看完後表示：「老夫修行三百年，不如這兩位師兄喝茶的半個時辰。」

---

### 第九章：終局副本（4 ep）

修行界最強大的「魔尊」即將復活，整個大陸陷入恐慌。林逸把這當作「終局團本」來攻略。

**Ep1 — 副本開啟：** 魔尊封印裂開，系統彈出「世界事件：魔尊復活（副本難度：地獄）」。林逸看了看難度評級：「這也比簡單模式高不了多少嘛。」他開始組建「40人團隊」。趙小七自薦當團長助理（實際上是粉絲後援會會長）。蕭長老被指派為「主坦」——「老夫這輩子最後悔的事就是認識你們。」

**Ep2 — 機制攻略：** 林逸帶著聯軍研究魔尊的「技能機制」——攻擊模式、階段轉換、弱點屬性。他發現魔尊每個階段都有「安全區」，只要站在安全區裡就不會受傷。修行界第一次有人把「研究魔王攻略」當作正經軍事行動。聯軍指揮官：「所以...我們就是站在那裡不動就好？」「對，等他換階段的時候換個位置。」

**Ep3 — 開團：** 40人聯軍正式開打。前兩個階段完美執行攻略。第三階段出現了「未預料的機制」——魔尊的終極技能沒有安全區。林逸：「...這 Boss 沒照劇本走啊。」他臨時開啟系統的「開發者模式」，看到了魔尊的「源代碼」，發現了一個致命 bug。他讓陳默（另一個穿越者）去觸發那個 bug——魔尊直接卡死不動了。

**Ep4 — 首通结算：** 魔尊被擊敗，系統彈出「世界首通成就」，附帶一個神秘的「New Game+」選項。整個大陸歡慶勝利。林逸看著那個「New Game+」按鈕，陷入了沉思。趙小七在旁邊激動地寫《世界拯救完整記錄》。蕭長老終於放下了長老架子，給林逸泡了一壺茶：「小子，你到底是什麼人？」林逸：「...就一個玩家啊。」

---

### 第十章：New Game+（3 ep）

林逸按下了「New Game+」，世界重置——但所有人都保留了記憶。

**Ep1 — 世界重置：** 林逸按下了按鈕。世界回歸初始狀態——所有建築恢復原樣，所有人的修為回到起點。但所有人都記得之前發生的一切。趙小七第一個衝過來：「師兄！你又穿越了！這次我一定要當第一個跟隨者！」蕭長老看著自己回到年輕的樣子：「...老夫又來了。」系統 UI 變成了全新版本 v3.0。

**Ep2 — 速通二周目：** 因為所有人都記得上一輪的事情，林逸的「大佬」人設比之前更穩固了——這次他還沒開口，大家就已經開始腦補了。林逸：「我就說了一個『早』...」趙小七（記得上一輪的所有「真言」）：「師兄說『早』，寓意『早悟大道，早證菩提』！」蕭長老：「沒錯，這一次我們不會再錯過師兄的任何一句話。」

**Ep3 — 新的開始：** 系統 v3.0 解鎖了新地圖、新角色、新機制。林逸發現這次的「遊戲」變得更大了——不只是這個大陸，還有其他「伺服器」（其他世界）。他看著地圖上無數的未探索區域，露出了一個真正的笑容：「好吧，那就繼續玩下去吧。」趙小七拿出了一本全新的筆記本——《林逸師兄語錄·新世界篇》。蕭長老已經在打包行李了：「老夫這次...當 DPS。」

---

## Episode Guide (Full)

| Ch | Ep | Title | Characters | Status |
|----|-----|-------|------------|--------|
| 1 | 1 | 首次誤會 | linyi, zhaoxiaoqi, xiaoelder | Scaffolding Complete |
| 1 | 2 | 任務跳過 | linyi, zhaoxiaoqi | Planned |
| 1 | 3 | Bug 利用 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 2 | 1 | 掛機修仙 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 2 | 2 | 經驗值農場 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 2 | 3 | 技能點分配 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 3 | 1 | 速通記錄 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 3 | 2 | 隱藏關卡 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 3 | 3 | 秘境 BOSS | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 4 | 1 | 組隊系統 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 4 | 2 | 副本機制 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 4 | 3 | 團滅與重來 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 4 | 4 | 首通獎勵 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 5 | 1 | 排位賽 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 5 | 2 | 禁選階段 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 5 | 3 | 總決賽 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 6 | 1 | UI 大改版 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 6 | 2 | 社交系統 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 6 | 3 | 成就解鎖 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 7 | 1 | 宣戰公告 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 7 | 2 | 兵力配置 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 7 | 3 | 城牆 BUG | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 7 | 4 | 勝利結算 | linyi, zhaoxiaoqi, xiaoelder | Planned |
| 8 | 1 | 可疑行跡 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 8 | 2 | 對峙 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 8 | 3 | PK 約戰 | linyi, zhaoxiaoqi, chenmo | Planned |
| 8 | 4 | 結盟 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 9 | 1 | 副本開啟 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 9 | 2 | 機制攻略 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 9 | 3 | 開團 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 9 | 4 | 首通結算 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 10 | 1 | 世界重置 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 10 | 2 | 速通二周目 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |
| 10 | 3 | 新的開始 | linyi, zhaoxiaoqi, xiaoelder, chenmo | Planned |

**Total: 10 chapters, 34 episodes** (7 chapters × 3 ep + 3 chapters × 4 ep)

### New Character (Ch8+)

| Character | Name | Voice | Color | Emotions |
|-----------|------|-------|-------|----------|
| chenmo | 陳默 | uncle_fu (male) | #10B981 (emerald) | default, shock, smile, confused, think |

- **陳默 (chenmo)** — 另一個穿越者，前世是程式設計師。沒有系統，只有現代知識。一直在裝高手但裝得很勉強。遇到林逸後如釋重負——終於有人能正常說話了。性格比林逸更安靜，但偶爾會吐槽「你這系統也太作弊了吧」。

---

## 招牌梗追蹤（Running Gags）

Every episode MUST evolve these running gags — they are the series' identity.

| 梗 | Ch1 | Ch2 | Ch3 | Ch4 | Ch5 | Ch6 | Ch7 | Ch8 | Ch9 | Ch10 |
|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|------|
| 玩家黑話 | 載入中 | 掛機練功 | noclip | 組隊面板 | 排位匹配 | 社交頻道 | 攻城戰 | 玩家ID | 副本難度 | New Game+ |
| 趙小七腦補 | 第一篇語錄 | 十萬字日記 | 速通計時 | 團長助理 | 賽評員 | 語錄第三卷 | 戰爭日記 | 錄音筆記 | 世界拯救記錄 | 新世界篇 |
| 蕭長老崩潰 | 腿軟 | 燒功法 | 穿牆必修 | 被迫當治療 | 研究段位 | 解讀 UI | 崩潰來回跳 | 翻古籍 | 主坦克 | 「我當 DPS」 |
| 系統 UI | 字體太大 | 自動修煉 | 速通計時 | 組隊系統 | 段位標籤 | v2.0 更新 | 公會戰 UI | 玩家標記 | 世界事件 | v3.0 新地圖 |

## 標誌性系統技能（按章節解鎖）

| 技能 | 解鎖 | 林逸看到的 | 別人看到的 |
|:----|:----|:----|:----|
| 「跳過對話」 | Ch1 | 跳過 NPC 廢話 | 不屑與凡人交流 |
| 「載入中...」 | Ch1 | 系統卡頓 | 深度冥想，感悟天道 |
| 「卡模型」 | Ch1 | 碰撞 bug | 空間禁錮之術 |
| 「掛機練功」 | Ch2 | 自動修煉腳本 | 閉關悟道，一日千里 |
| 「採集 MAX」 | Ch2 | 掃地僧式撿垃圾 | 點石成金之術 |
| 「noclip」 | Ch3 | 穿牆作弊碼 | 虛空漫步 |
| 「查看代碼」 | Ch3 | 看到陣法答案 | 一眼洞穿萬物本源 |
| 「仇恨繞柱」 | Ch3 | 拉 BOSS 繞地形 | 以天地為陣困萬獸 |
| 「組隊面板」 | Ch4 | MMO 組隊系統 | 天命召集，萬法歸宗 |
| 「 ctrl+Z」 | Ch4 | 撤銷操作 | 時光倒流 |
| 「排位系統」 | Ch5 | 段位匹配 | 天道品階 |
| 「社交頻道」 | Ch6 | 世界聊天 | 天道傳音 |
| 「成就系統」 | Ch6 | 遊戲成就 | 天機降臨 |
| 「開發者模式」 | Ch9 | 看到源代碼 | 直視大道法則 |
| 「New Game+」 | Ch10 | 重置遊戲 | 輪迴重生，大道輪轉 |

## Image Generation Progress

### Characters (22/22 — Done)

Generated via z.ai (https://image.z.ai) — 1:1 aspect ratio, 2K resolution, rembg transparent BG.

| Character | Emotions | Status |
|-----------|----------|--------|
| linyi (林逸) | default, shock, smile, laugh, sweat, confused, chibi | Done |
| zhaoxiaoqi (趙小七) | default, shock, think, gloating, cry | Done |
| xiaoelder (蕭長老) | default, anger, shock, sweat, cry | Done |
| chenmo (陳默) | default, shock, smile, confused, think | Done |

### Backgrounds (14/14 — Done)

Generated via z.ai — 16:9 aspect ratio, 2K resolution.

| Background | Used In | Status |
|------------|---------|--------|
| sect-plaza | Ch1, Ch2, Ch10 | Done |
| sect-training | Ch2 | Done |
| sect-interior | Ch1 | Done |
| spirit-beast-cave | Ch2 | Done |
| ancient-realm-entrance | Ch3 | Done |
| ancient-realm-inside | Ch3 | Done |
| dungeon-entrance | Ch3 | Done |
| boss-arena | Ch3, Ch9 | Done |
| tournament-stage | Ch5 | Done |
| system-update | Ch6 | Done |
| siege-battlefield | Ch7 | Done |
| mysterious-forest | Ch8 | Done |
| demon-seal | Ch9 | Done |
| world-reset | Ch10 | Done |

---

## Style Notes (vs. weapon-forger)

- **相同：** 字體（NotoSansTC + MaShanZheng/ZCOOLKuaiLe/ZhiMangXing）、DialogBox、ComicEffects、MangaSfx
- **相同：** TitleScene 漸層背景、TransitionSeries、Ken Burns zoom
- **相同：** 角色面向 — 所有圖片預設朝左，Remotion 中根據位置翻轉
- **新增：** `GameUI.tsx` — 遊戲風格 HUD 覆蓋層，用於顯示血條、等級標籤、冷卻時間等
- **新增：** SystemOverlay 增加遊戲風格 type（`"game-ui"`, `"hp-bar"`, `"level-tag"`, `"cooldown"`）
- **升級：** 多表情圖片系統 — 每個角色有多張表情圖，`CharacterSprite` 透過 `emotion` prop 切換，`DialogLine` 新增 `emotion` 欄位，`narration.ts` 每句台詞指定表情
- **配色調整：** 背景漸層從鍛造風格 (#0a0a1e→#1a0a2e→#2a1a0e) 改為科技感 (#0a0a2e→#0a1a3e→#1a0a2e)
