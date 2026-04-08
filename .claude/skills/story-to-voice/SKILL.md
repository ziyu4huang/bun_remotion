---
name: story-to-voice
description: Analyze a story file or book directory using LLM understanding to produce high-quality .story.json with proper character voices, emotions, and pacing. Supports single stories and multi-chapter books. Then generate audio via CLI or WebUI.
---

# Story-to-Voice Skill

Convert a plain story file or multi-chapter book into structured `.story.json` audiobook projects, then produce audio — via CLI or WebUI.

## Two Modes

**Single Story Mode** — argument is a `.txt` file:
```
/story-to-voice path/to/story.txt
```

**Book Mode** — argument is a directory:
```
/story-to-voice books/my_novel/
/story-to-voice books/my_novel/ --chapter 003
```

## Pipeline

```
Single:   story.txt ──► [LLM] ──► .story.json ──► [produce] ──► .flac
Book:     books/my_novel/ ──► [LLM per chapter] ──► chapter-xxx.story.json ──► [produce-book] ──► chapter-xxx.flac
                           reads book.json for                          updates book.json
                           existing character voices                    with new characters
```

## WebUI Servers

Two FastAPI servers are available for interactive use:

| Server | File | Port | Purpose |
|--------|------|------|---------|
| **TTS Studio** | `webui.py` | 7860 | Simple TTS generation, voice/emotion preview, AI content generation, book browser at `/books` |
| **Story Studio** | `story_studio.py` | 7861 | Advanced multi-segment story producer with SSE progress, segment editor, import/export |

### Start servers

```bash
cd mlx_tts

# TTS Studio (simple TTS + book browser)
.venv/bin/python webui.py                          # http://localhost:7860

# Story Studio (advanced multi-character production)
.venv/bin/python story_studio.py                    # http://localhost:7861
```

### WebUI Key Routes

**TTS Studio (7860):**
- `GET /` — TTS generator UI (text input, voice/emotion/speed controls, history sidebar)
- `GET /books` — Book browser (list books, manage chapters, produce audio)
- `POST /api/generate` — Generate single TTS audio
- `POST /api/generate-content` — AI content generation (requires `ANTHROPIC_API_KEY`)
- `GET /api/voices` — Voice catalog
- `GET /api/languages` — Language list
- `GET /api/emotions` — Emotion presets

**Story Studio (7861):**
- `GET /` — Segment composer (add/edit/reorder segments, produce story, SSE progress)
- `GET /books` — Book browser (same as TTS Studio)
- `POST /api/produce` — Start production job (returns `job_id`, stream progress via SSE)
- `GET /api/produce/{job_id}/events` — SSE stream for production progress
- `POST /api/export` — Export story as `.story.json`
- `POST /api/import` — Import `.story.json` into composer

**Book Browser API (both servers):**
- `GET /api/books` — List all books
- `POST /api/books/init` — Create new book project
- `GET /api/books/{name}` — Get book details with chapter list
- `POST /api/books/{name}/scan` — Scan for new chapter `.txt` files
- `GET /api/books/{name}/chapters/{num}` — Get chapter `.story.json` with segments
- `PUT /api/books/{name}/chapters/{num}` — Save edited chapter segments
- `PUT /api/books/{name}/characters` — Update character voice registry
- `POST /api/books/{name}/chapters/{num}/produce` — Produce single chapter
- `POST /api/books/{name}/produce-all` — Produce all pending chapters
- `GET /api/books/{name}/chapters/{num}/audio` — Serve produced audio

---

## Instructions

The skill accepts sub-commands. If no sub-command matches, treat the argument as a file/directory path and auto-detect mode.

### Sub-Commands

#### `open browser [studio|books|tts]`

Start the appropriate WebUI server (if not already running) and open it in Playwright.

| Alias | Server | URL | What Opens |
|-------|--------|-----|------------|
| `open browser studio` | Story Studio | `http://localhost:7861` | Segment composer |
| `open browser books` | Story Studio | `http://localhost:7861/books` | Book browser |
| `open browser tts` | TTS Studio | `http://localhost:7860` | Simple TTS generator |

**Steps:**
1. Check if the server is already running: `lsof -ti:<port>`
2. If not running, start it in background:
   ```bash
   cd /Users/huangziyu/proj/bun_remotion/mlx_tts && .venv/bin/python <server>.py
   ```
3. Wait for ready: `sleep 3 && curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/`
4. Verify routes: `curl -s http://localhost:<port>/openapi.json | python3 -c "import sys,json; ..."`
5. Navigate in Playwright to the URL
6. Take a screenshot and show the user

**IMPORTANT:** Always use `.venv/bin/python` (never bare `python` or `python3`).

#### `play <book_name> <chapter>`

Play a chapter's audio file using `afplay`.

```bash
afplay /Users/huangziyu/proj/bun_remotion/mlx_tts/books/<book_name>/chapters/chapter-<NNN>.flac
```

Run in background so the user can listen while continuing to chat.

---

## Single Story Mode

### 1. Read & Analyze the Story

Read the story file completely. Use your language understanding to identify:

- **Language**: English, Chinese, Japanese, Spanish, French, etc.
- **Genre**: romance, literary fiction, thriller, fantasy, historical, sci-fi, etc.
- **Characters**: Extract every named character. For each, determine:
  - Name
  - Gender (for voice casting)
  - Role (protagonist, antagonist, supporting, narrator)
  - Relationships to other characters
- **Emotional Arc**: Map the overall story arc (e.g., nostalgic → tense → bittersweet ending)

### 2. Decompose into Segments

Split the story into segments. Each segment should be a natural speech unit (1-3 sentences).

**Character Attribution Rules:**
- **Narration** → character: `"Narrator"`
- **Dialogue in quotes** (`"..."`, `"..."`, `「...」`) → attribute to the correct character using context
- **Chinese pronouns** (他 → male name, 她 → female name) → resolve to the actual character based on scene context
- **Implied speakers** (e.g., a response after a question) → use conversation turn-taking and scene context

**Emotion Rules (genre-aware):**

| Scene Type | Emotion | Speed | Notes |
|------------|---------|-------|-------|
| Opening narration | `storytelling` | 0.97 | Sets the tone |
| Nostalgic flashback | `calm` | 0.92 | Warm, reflective |
| Dialogue (neutral) | `neutral` | 1.0 | Default for conversation |
| Dialogue (question) | `neutral` | 1.0 | Curious, inquiring |
| Dialogue (tension) | `serious` | 0.95 | Conflict, urgency |
| Dialogue (intimate) | `whispery` | 0.88 | Secrets, closeness |
| Action / climax | `excited` | 1.08 | Fast, energetic |
| Loss / grief | `sad` | 0.85 | Slow, heavy |
| Joy / reunion | `happy` | 1.05 | Warm, bright |
| Resolution / ending | `calm` | 0.90 | Peaceful closure |

**Emotion should follow the narrative arc, not just keywords.** A sentence about rain can be `sad` in a breakup scene or `calm` in a cozy flashback — context matters.

### 3. Cast Voices

Assign distinct voices based on character gender and personality:

**Chinese (Mandarin) voices:**
| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `zm_yunjian` | Male | Deep, broadcast | Narrator, authoritative figures |
| `zm_yunxi` | Male | Natural, warm | Male protagonists, love interests |
| `zf_xiaobei` | Female | Lively, bright | Female protagonists, young women |
| `zf_xiaoni` | Female | Gentle, soft | Motherly figures, gentle characters |

**English (American) voices:**
| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `af_heart` | Female | Warm, emotional | Female protagonists |
| `af_sarah` | Female | Professional | Authority figures |
| `af_bella` | Female | Bright, energetic | Young characters |
| `af_nova` | Female | Confident | Strong female leads |
| `am_adam` | Male | Deep, resonant | Male protagonists |
| `am_michael` | Male | Friendly | Casual characters |
| `am_echo` | Male | Dramatic | Villains, authority |

**English (British) voices:**
| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `bm_george` | Male | Classic, rich | Narrator (default for EN) |
| `bm_lewis` | Male | Calm, steady | Supporting male |
| `bm_daniel` | Male | Formal | Authority figures |
| `bf_emma` | Female | Elegant | Female leads |
| `bf_isabella` | Female | Warm | Supporting female |

**Japanese voices:**
| Voice | Gender | Personality | Best For |
|-------|--------|-------------|----------|
| `jm_kumo` | Male | Calm | Narrator, male leads |
| `jf_alpha` | Female | Expressive | Female leads |
| `jf_gongitsune` | Female | Storyteller | Narrator, older women |

**Voice assignment strategy:**
1. Narrator: `bm_george` (EN), `zm_yunjian` (ZH), `jm_kumo` (JA)
2. Male protagonist: `am_adam` (EN), `zm_yunxi` (ZH)
3. Female protagonist: `af_heart` (EN), `zf_xiaobei` (ZH)
4. Supporting characters: pick from remaining same-gender pool based on personality fit
5. Each named character gets a unique voice

### 4. Determine Language Code

- English (US): `"en-us"`
- English (UK): `"en-gb"`
- Mandarin Chinese: `"zh"`
- Japanese: `"ja"`
- Spanish: `"es"`
- French: `"fr"`

### 5. Write .story.json

Write the file to `mlx_tts/stories/<slug>.story.json` where `<slug>` is the story title lowercased with spaces replaced by underscores (max 40 chars).

#### JSON Format

```json
{
  "version": "1.0",
  "title": "Story Title",
  "silence_ms": 500,
  "output_format": "flac",
  "metadata": {
    "source": "original_file.txt",
    "created": "ISO-8601 timestamp",
    "author": "",
    "language": "zh"
  },
  "segments": [
    {
      "id": "seg_1",
      "character": "Narrator",
      "text": "Once upon a time...",
      "voice": "bm_george",
      "lang": "en-gb",
      "emotion": "storytelling",
      "speed": 0.97
    }
  ]
}
```

### 6. Produce Audio

**CLI (fastest, no server needed):**
```bash
cd mlx_tts && .venv/bin/python story_to_voice.py produce stories/<slug>.story.json
```

**Story Studio WebUI (visual editing + production):**
1. Start: `.venv/bin/python story_studio.py`
2. Open http://localhost:7861
3. Click Import → select the `.story.json`
4. Review/edit segments visually
5. Click "Produce Story" — watch progress via SSE

### 7. Report Results

Tell the user:
- How many segments were created
- Characters detected and their assigned voices
- Emotional arc summary
- Output file path
- Duration and file size

## Available Emotions (Reference)

| Key | Label | Speed Mult | Use For |
|-----|-------|-----------|---------|
| `neutral` | Neutral | 1.0x | Default dialogue |
| `happy` | Happy | 1.08x | Joyful, warm moments |
| `excited` | Excited | 1.18x | Action, surprise, energy |
| `sad` | Sad | 0.85x | Loss, sorrow, melancholy |
| `calm` | Calm | 0.92x | Peaceful, endings, reflection |
| `serious` | Serious | 0.95x | Authority, tension, danger |
| `whispery` | Whispery | 0.88x | Intimate, secrets, close |
| `storytelling` | Storytelling | 0.97x | Narration, reading aloud |

## Example: Well-Crafted Chinese Story JSON

This is the quality bar. Characters are properly identified, emotions follow the arc, voices match gender:

```json
{
  "version": "1.0",
  "title": "最後一盞燈",
  "silence_ms": 500,
  "output_format": "flac",
  "metadata": {
    "source": "chinese_story.txt",
    "created": "2026-04-06T00:00:00",
    "author": "",
    "language": "zh"
  },
  "segments": [
    {
      "id": "seg_1",
      "character": "Narrator",
      "text": "那是一九四九年的冬天，上海的街道像一條冰封的河。",
      "voice": "zm_yunjian",
      "lang": "zh",
      "emotion": "storytelling",
      "speed": 0.97
    },
    {
      "id": "seg_4",
      "character": "陳懷遠",
      "text": "我明日就要去了，去一個我不知道能不能回來的地方。但在離開之前，我必須讓妳知道：那棟弄堂裡的舊書店，每天下午三點半，當陽光斜照進來的那一刻，我都在想著妳。",
      "voice": "zm_yunxi",
      "lang": "zh",
      "emotion": "sad",
      "speed": 0.85
    },
    {
      "id": "seg_18",
      "character": "林書瑤",
      "text": "就是「帶我走」三個字。",
      "voice": "zf_xiaobei",
      "lang": "zh",
      "emotion": "whispery",
      "speed": 0.85
    }
  ]
}
```

---

## Book Mode (Multi-Chapter)

When the argument is a directory (e.g., `books/my_novel/`):

### B1. Initialize or Load Book

- If `book.json` exists in the directory, read it to get existing characters, language, and settings.
- If not, run: `cd mlx_tts && .venv/bin/python story_to_voice.py init-book <name> --lang zh --title "Title"`
- The `book.json` contains a `characters` registry that maps character names to voice assignments. **This is the single source of truth for voice consistency across all chapters.**

### B2. Scan for Chapters

List all `chapter-*.txt` files in the `chapters/` subdirectory. If `--chapter NNN` is specified, process only that chapter.

### B3. Parse Chapters

Run the `parse-chapter` command to auto-generate `.story.json` from chapter `.txt` files:

```bash
cd mlx_tts && .venv/bin/python story_to_voice.py parse-chapter books/<name>/ [--chapter NNN]
```

This handles:
- Reading chapter text, dialogue detection, speaker attribution
- Emotion/speed assignment
- Voice assignment using existing characters from `book.json`
- Writing `.story.json` and updating `book.json` with new characters

After parsing, **review the output** — check for misidentified characters (e.g., `Speaker 1`, garbage text). Fix by:
- **CLI**: Edit the `.story.json` file directly
- **WebUI**: Open http://localhost:7860/books → select book → click chapter → edit segments → Save

### B4. Voice Consistency Rule

**CRITICAL**: Before assigning a voice to ANY character, check the `characters` section of `book.json`. If the character already has a voice assigned, use that voice — no exceptions. Only assign new voices to characters not in the registry.

This ensures that 陳懷遠 always speaks with `zm_yunxi` across all 30 chapters, not switching to `am_adam` in chapter 15.

### B5. Produce Audio

**CLI (batch production):**
```bash
# All chapters:
cd mlx_tts && .venv/bin/python story_to_voice.py produce-book books/<name>/

# Specific chapter:
cd mlx_tts && .venv/bin/python story_to_voice.py produce-book books/<name>/ --chapter 003

# Re-produce already produced chapters:
cd mlx_tts && .venv/bin/python story_to_voice.py produce-book books/<name>/ --force
```

**WebUI (visual production):**
1. Start: `.venv/bin/python webui.py`
2. Open http://localhost:7860/books
3. Select book → click "Scan Chapters" to discover new chapters
4. Click individual chapter "Produce" or "Produce All Pending"
5. Production runs as background tasks — check status via job API

**Story Studio WebUI (advanced production with SSE progress):**
1. Start: `.venv/bin/python story_studio.py`
2. Open http://localhost:7861/books
3. Browse chapters, edit segments, produce with real-time progress streaming

### B6. Report Results

Tell the user:
- Book name and chapter count
- Characters (new and existing) and their voice assignments
- Per-chapter segment counts and status
- Audio output paths
- Total duration and file sizes

## book.json Format (Reference)

```json
{
  "version": "1.0",
  "title": "Book Title",
  "author": "",
  "language": "zh",
  "genre": "literary fiction",
  "settings": {
    "silence_ms": 500,
    "output_format": "flac"
  },
  "characters": {
    "Narrator": {"gender": "male", "voice": "zm_yunjian", "lang": "zh", "role": "narrator"},
    "陳懷遠":   {"gender": "male", "voice": "zm_yunxi",    "lang": "zh", "role": "protagonist"},
    "林書瑤":   {"gender": "female", "voice": "zf_xiaobei", "lang": "zh", "role": "protagonist"}
  },
  "chapters": [
    {
      "number": 1,
      "title": "Chapter 1",
      "source": "chapter-001.txt",
      "story_json": "chapter-001.story.json",
      "audio": "chapter-001.flac",
      "status": "produced",
      "segments": 25,
      "duration_s": 182.6
    }
  ]
}
```

Chapter status flow: `pending` → `parsed` → `produced`

## Project File Structure (Reference)

```
mlx_tts/
├── webui.py              # TTS Studio server (port 7860) + book browser
├── story_studio.py       # Story Studio server (port 7861) + advanced production
├── story_to_voice.py     # CLI: parse, produce, init-book, produce-book
├── book_manager.py       # BookManager CRUD for book projects
├── book_browser.html     # Book browser UI (served by both servers)
├── mlx_tts/
│   ├── generator.py      # TTS engine (Kokoro-82M on MLX)
│   ├── voices.py         # Voice catalog, languages, emotions
│   └── cli.py            # Basic CLI interface
├── books/                # Book projects directory
│   └── my_novel/
│       ├── book.json
│       └── chapters/
│           ├── chapter-001.txt
│           ├── chapter-001.story.json
│           └── chapter-001.flac
├── stories/              # Single story projects
└── outputs/              # Generated audio files
```
