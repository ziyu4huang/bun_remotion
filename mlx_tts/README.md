# MLX TTS — 文字故事轉多角色有聲書

將純文字小說自動轉換為高品質有聲書，支援多角色配音、情緒語氣、語速控制——由 Kokoro-82M 模型搭配 Apple MLX 框架驅動。

> **平台需求：** 需要 Apple Silicon（M 系列）Mac。目前在 M1 8GB MacBook Air 上驗證通過。使用 MLX 進行 GPU 加速，不支援 Intel Mac 或其他平台。

---

## 核心特色

- **多角色語音分配** — 每個角色自動配對專屬的性別與性格語音，跨章節保持一致
- **情緒感知合成** — 8 種情緒預設（neutral、happy、excited、sad、calm、serious、whispery、storytelling），搭配自動語速調整
- **多語言支援** — 中文、英文（美/英）、日文、西班牙文、法文、義大利文、葡萄牙文、印地文
- **書籍模式** — 管理多章節小說，角色語音在所有章節間保持一致
- **雙 WebUI 介面** — 簡易 TTS 工作室 + 進階故事製作台，支援即時進度串流
- **CLI 管線** — 命令列完成解析、產製、批次處理

---

## 運作流程

```
純文字 .txt  ──►  角色偵測 + 情緒分析  ──►  .story.json  ──►  FLAC/WAV 音檔
```

整個管線將純文字故事拆分為語句段落、辨識說話者、指定情緒與語速、為每個角色分配適當語音，最後使用 Kokoro-82M 合成語音。

---

## 快速開始

### 安裝

```bash
cd mlx_tts
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

### 單篇故事

```bash
# 1. 將文字解析為結構化 story JSON
.venv/bin/python story_to_voice.py parse story.txt --lang zh

# 2. 產製音檔
.venv/bin/python story_to_voice.py produce story.story.json
```

### 多章節書籍

```bash
# 1. 建立書籍專案
.venv/bin/python story_to_voice.py init-book my_novel --lang zh --title "我的小說"

# 2. 將章節檔案放入 books/my_novel/chapters/
#    chapter-001.txt, chapter-002.txt, ...

# 3. 解析所有章節
.venv/bin/python story_to_voice.py parse-chapter books/my_novel/

# 4. 產製所有章節音檔
.venv/bin/python story_to_voice.py produce-book books/my_novel/
```

### WebUI 介面

```bash
# TTS Studio — 簡易語音合成 + 書籍瀏覽器（port 7860）
.venv/bin/python webui.py

# Story Studio — 進階段落編輯器 + SSE 即時產製進度（port 7861）
.venv/bin/python story_studio.py
```

| 服務 | Port | 網址 | 用途 |
|------|------|------|------|
| TTS Studio | 7860 | `http://localhost:7860` | 簡易語音合成、語音試聽、AI 內容生成 |
| TTS Studio — 書籍 | 7860 | `http://localhost:7860/books` | 書籍瀏覽與管理 |
| Story Studio | 7861 | `http://localhost:7861` | 進階段落編輯器 + 即時產製進度 |
| Story Studio — 書籍 | 7861 | `http://localhost:7861/books` | 書籍瀏覽與管理 |

### Claude Code Skill 指令

使用 Claude Code 時，可透過 `/story-to-voice` skill 執行以下指令：

```
/story-to-voice open browser books     # 啟動伺服器 + 在 Playwright 開啟書籍瀏覽器
/story-to-voice open browser studio    # 啟動伺服器 + 開啟 Story Studio
/story-to-voice open browser tts       # 啟動伺服器 + 開啟 TTS Studio
/story-to-voice books/yanhuo/          # 解析 + 產製整本書
/story-to-voice play yanhuo 005        # 播放第 5 章音檔
```

---

## 情緒預設

每個語句段落都可指定情緒，系統會自動調整語速與語氣：

| 情緒 | 語速 | 適用場景 |
|------|------|----------|
| `neutral` | 1.0x | 一般對話 |
| `happy` | 1.08x | 歡樂、溫暖的時刻 |
| `excited` | 1.18x | 動作場面、驚喜、緊張 |
| `sad` | 0.85x | 失落、悲傷、離別 |
| `calm` | 0.92x | 平靜、結尾、回憶 |
| `serious` | 0.95x | 緊張、權威、危險 |
| `whispery` | 0.88x | 親密、秘密、低語 |
| `storytelling` | 0.97x | 旁白敘述 |

---

## 可用語音

### 中文（國語）
| 語音 | 性別 | 風格 |
|------|------|------|
| `zm_yunjian` | 男 | 渾厚、播報風 — 適合旁白 |
| `zm_yunxi` | 男 | 自然、溫暖 — 適合男主角 |
| `zf_xiaobei` | 女 | 活潑、明亮 — 適合女主角 |
| `zf_xiaoni` | 女 | 溫柔、柔和 — 適合母親角色 |

### 英文（美式）
| 語音 | 性別 | 風格 |
|------|------|------|
| `af_heart` | 女 | 溫暖、感性 |
| `af_sarah` | 女 | 專業、理性 |
| `af_bella` | 女 | 明亮、活力 |
| `am_adam` | 男 | 渾厚、共鳴 |
| `am_michael` | 男 | 友善、親切 |
| `am_echo` | 男 | 戲劇性 |

### 英文（英式）
| 語音 | 性別 | 風格 |
|------|------|------|
| `bm_george` | 男 | 經典、醇厚 — 預設旁白 |
| `bm_lewis` | 男 | 沉穩、安定 |
| `bf_emma` | 女 | 優雅 |

### 日文
| 語音 | 性別 | 風格 |
|------|------|------|
| `jm_kumo` | 男 | 冷靜 — 旁白 |
| `jf_alpha` | 女 | 表現力強 |
| `jf_gongitsune` | 女 | 故事朗讀風 |

---

## Story JSON 格式

每個故事以 `.story.json` 表示，包含分段、角色、情緒等資訊：

```json
{
  "version": "1.0",
  "title": "最後一盞燈",
  "silence_ms": 500,
  "output_format": "flac",
  "metadata": {
    "source": "story.txt",
    "created": "2026-04-06T12:00:00",
    "language": "zh"
  },
  "segments": [
    {
      "id": "seg_1",
      "character": "Narrator",
      "text": "那是冬天的上海，街道像一條冰封的河。",
      "voice": "zm_yunjian",
      "lang": "zh",
      "emotion": "storytelling",
      "speed": 0.97
    },
    {
      "id": "seg_2",
      "character": "陳懷遠",
      "text": "我明天就要走了。",
      "voice": "zm_yunxi",
      "lang": "zh",
      "emotion": "sad",
      "speed": 0.85
    }
  ]
}
```

---

## 書籍專案結構

```
books/my_novel/
├── book.json                    # 書籍元資料 + 角色語音對照表
└── chapters/
    ├── chapter-001.txt          # 原始章節文字
    ├── chapter-001.story.json   # 解析後的段落
    └── chapter-001.flac         # 產製的音檔
```

`book.json` 維護角色語音對照表，確保角色在所有章節中使用相同的語音。例如陳懷遠在第 1 章到第 30 章都使用 `zm_yunxi`，不會中途切換。

---

## 技術架構

- **TTS 引擎**：Kokoro-82M 模型，透過 Apple MLX 框架在 GPU 上運行
- **後端**：FastAPI（Python），支援非同步音檔生成
- **前端**：嵌入式 HTML/JS 單頁應用
- **音訊格式**：FLAC（無損，預設）或 WAV，取樣率 24kHz
- **LLM 整合**：可選 AI 內容生成功能（需設定 `ANTHROPIC_API_KEY`）

---

## CLI 參考

```bash
# 解析故事文字檔
python story_to_voice.py parse <file.txt> --lang zh -o output.story.json

# 從 story JSON 產製音檔
python story_to_voice.py produce <file.story.json> -o output.flac

# 書籍管理
python story_to_voice.py init-book <name> --lang zh --title "書名"
python story_to_voice.py parse-chapter books/<name>/ [--chapter NNN]
python story_to_voice.py produce-book books/<name>/ [--chapter NNN] [--force]
```
