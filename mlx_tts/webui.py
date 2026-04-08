"""
MLX TTS WebUI — FastAPI server with HTML frontend.

Run:
    cd mlx_tts
    .venv/bin/python webui.py
    # or
    .venv/bin/uvicorn webui:app --reload --port 7860

Features:
  - Voice selection (15+ Kokoro voices)
  - Language selection (EN/ZH/JA/ES/FR/HI/IT/PT)
  - Emotion presets (neutral/happy/excited/sad/calm/serious/whispery/storytelling)
  - Speed control
  - AI content generation (requires ANTHROPIC_API_KEY)
  - In-browser audio playback + download
  - Generation history
"""

from __future__ import annotations

import asyncio
import json
import os
import time
import uuid
from pathlib import Path
from typing import Optional

import mlx.core as mx
import uvicorn
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Ensure we can import mlx_tts from this directory
import sys
sys.path.insert(0, str(Path(__file__).parent))

from mlx_tts.generator import TTSGenerator, DEFAULT_MODEL
from mlx_tts.voices import VOICE_CATALOG, LANGUAGES, EMOTIONS, DEFAULT_VOICE, emotion_speed

# ── Config ────────────────────────────────────────────────────────────────────

OUTPUT_DIR = Path("outputs/webui")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="MLX TTS WebUI", version="1.0.0")

# Lazy-loaded generator (shared across requests)
_generator: Optional[TTSGenerator] = None
_generator_lock = asyncio.Lock()


def get_generator() -> TTSGenerator:
    global _generator
    if _generator is None:
        _generator = TTSGenerator(verbose=False)
    return _generator


# ── Request / Response models ─────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    text: str
    voice: str = DEFAULT_VOICE
    lang: str = "en-us"
    speed: float = 1.0
    emotion: str = "neutral"
    audio_format: str = "wav"


class ContentRequest(BaseModel):
    topic: str
    lang: str = "en-us"
    emotion: str = "neutral"
    length: str = "short"  # short | medium | long


# ── History (in-memory) ───────────────────────────────────────────────────────

history: list[dict] = []

MAX_HISTORY = 50


def add_history(entry: dict):
    history.insert(0, entry)
    if len(history) > MAX_HISTORY:
        history.pop()


# ── API routes ────────────────────────────────────────────────────────────────

@app.get("/api/voices")
def api_voices():
    return VOICE_CATALOG


@app.get("/api/languages")
def api_languages():
    return LANGUAGES


@app.get("/api/emotions")
def api_emotions():
    return EMOTIONS


@app.get("/api/history")
def api_history():
    return history


@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    if not req.text.strip():
        return JSONResponse({"error": "text is empty"}, status_code=400)

    # Resolve lang_code from language key
    lang_info = LANGUAGES.get(req.lang)
    if lang_info is None:
        return JSONResponse({"error": f"unknown language: {req.lang}"}, status_code=400)
    lang_code = lang_info["code"]

    # Apply emotion speed modifier
    effective_speed = emotion_speed(req.speed, req.emotion)

    # Generate filename
    ts = time.strftime("%Y%m%d_%H%M%S")
    uid = uuid.uuid4().hex[:6]
    filename = f"tts_{ts}_{uid}.{req.audio_format}"
    out_path = OUTPUT_DIR / filename

    async with _generator_lock:
        gen = get_generator()
        t0 = time.perf_counter()
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: gen.save(
                    req.text,
                    out_path,
                    voice=req.voice,
                    speed=effective_speed,
                    lang_code=lang_code,
                    audio_format=req.audio_format,
                ),
            )
        except Exception as e:
            return JSONResponse({"error": str(e)}, status_code=500)

        elapsed = time.perf_counter() - t0
        mx.clear_cache()

    entry = {
        "id": uid,
        "filename": filename,
        "text": req.text[:120] + ("…" if len(req.text) > 120 else ""),
        "voice": req.voice,
        "lang": req.lang,
        "emotion": req.emotion,
        "speed": req.speed,
        "effective_speed": effective_speed,
        "format": req.audio_format,
        "duration_est": None,
        "gen_time": round(elapsed, 2),
        "url": f"/audio/{filename}",
        "ts": ts,
    }
    add_history(entry)

    return entry


@app.post("/api/generate-content")
async def api_generate_content(req: ContentRequest):
    """Use Claude to draft text content in the right language & emotional tone."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return JSONResponse(
            {"error": "ANTHROPIC_API_KEY not set. Export it to use AI content generation."},
            status_code=503,
        )

    try:
        import anthropic
    except ImportError:
        return JSONResponse({"error": "anthropic package not installed"}, status_code=503)

    lang_info = LANGUAGES.get(req.lang, {})
    lang_name = lang_info.get("name", req.lang)
    emotion_info = EMOTIONS.get(req.emotion, EMOTIONS["neutral"])

    length_guide = {"short": "2-3 sentences", "medium": "1 paragraph", "long": "2-3 paragraphs"}
    target_length = length_guide.get(req.length, "2-3 sentences")

    system = (
        f"You are a creative writer. Generate natural-sounding spoken text "
        f"that will be converted to audio using a TTS engine. "
        f"Write in {lang_name}. "
        f"The emotional tone should be {emotion_info['label'].lower()}: {emotion_info['description']}. "
        f"Write {target_length}. No markdown, no bullet points — just plain flowing prose meant to be spoken aloud."
    )

    client = anthropic.Anthropic(api_key=api_key)
    try:
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            system=system,
            messages=[{"role": "user", "content": f"Topic: {req.topic}"}],
        )
        content = msg.content[0].text.strip()
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

    return {"text": content, "lang": req.lang, "emotion": req.emotion}


@app.get("/audio/{filename}")
def serve_audio(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        return JSONResponse({"error": "file not found"}, status_code=404)
    media = "audio/wav" if filename.endswith(".wav") else "audio/flac"
    return FileResponse(path, media_type=media)


# ── Frontend HTML ─────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MLX TTS Studio</title>
<style>
  :root {
    --bg: #0f1117;
    --surface: #1a1d27;
    --surface2: #22263a;
    --border: #2e3347;
    --accent: #7c6af7;
    --accent2: #a78bfa;
    --text: #e2e4f0;
    --muted: #7c8098;
    --success: #4ade80;
    --error: #f87171;
    --warn: #fbbf24;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; }

  header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px;
    display: flex; align-items: center; gap: 12px;
  }
  header h1 { font-size: 1.2rem; font-weight: 700; color: var(--accent2); }
  header span { color: var(--muted); font-size: 0.85rem; }

  .layout { display: grid; grid-template-columns: 1fr 360px; gap: 0; height: calc(100vh - 57px); }

  .main { overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px; }
  .sidebar { background: var(--surface); border-left: 1px solid var(--border); overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }
  .card-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-bottom: 14px; }

  textarea {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 0.95rem; line-height: 1.6;
    padding: 12px; resize: vertical; min-height: 130px;
    transition: border-color 0.2s;
  }
  textarea:focus { outline: none; border-color: var(--accent); }

  .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  label { display: block; font-size: 0.78rem; color: var(--muted); margin-bottom: 5px; font-weight: 500; }
  select, input[type=range] {
    width: 100%; background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); padding: 8px 10px; font-size: 0.88rem;
    cursor: pointer;
  }
  select:focus { outline: none; border-color: var(--accent); }
  input[type=range] { padding: 6px 0; appearance: none; height: 36px; }
  input[type=range]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent); cursor: pointer; }
  input[type=range]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: var(--border); }

  .speed-row { display: flex; align-items: center; gap: 10px; }
  .speed-row input { flex: 1; }
  .speed-val { font-size: 0.88rem; color: var(--accent2); min-width: 40px; text-align: right; font-weight: 600; }

  /* Emotion grid */
  .emotions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .emotion-btn {
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 6px; text-align: center; cursor: pointer;
    transition: all 0.15s; user-select: none;
  }
  .emotion-btn:hover { border-color: var(--accent); }
  .emotion-btn.active { border-color: var(--accent); background: rgba(124,106,247,0.15); }
  .emotion-icon { font-size: 1.4rem; }
  .emotion-label { font-size: 0.68rem; color: var(--muted); margin-top: 4px; }
  .emotion-btn.active .emotion-label { color: var(--accent2); }

  /* AI content bar */
  .ai-bar { display: flex; gap: 8px; align-items: flex-end; }
  .ai-bar input {
    flex: 1; background: var(--bg); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); padding: 9px 12px; font-size: 0.88rem;
  }
  .ai-bar input:focus { outline: none; border-color: var(--accent); }
  .ai-length { display: flex; gap: 6px; }
  .ai-length button {
    background: var(--bg); border: 1px solid var(--border); color: var(--muted);
    border-radius: 6px; padding: 4px 10px; font-size: 0.75rem; cursor: pointer;
    transition: all 0.15s;
  }
  .ai-length button.active { border-color: var(--accent); color: var(--accent2); }

  /* Buttons */
  .btn {
    background: var(--accent); color: #fff; border: none; border-radius: 10px;
    padding: 12px 24px; font-size: 0.95rem; font-weight: 600; cursor: pointer;
    transition: all 0.15s; display: flex; align-items: center; gap: 8px;
  }
  .btn:hover { background: var(--accent2); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-sm { padding: 7px 14px; font-size: 0.82rem; font-weight: 500; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--muted); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--text); background: transparent; }

  .generate-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

  /* Status */
  .status { font-size: 0.82rem; padding: 6px 12px; border-radius: 6px; }
  .status.generating { color: var(--warn); background: rgba(251,191,36,0.1); }
  .status.success { color: var(--success); background: rgba(74,222,128,0.1); }
  .status.error { color: var(--error); background: rgba(248,113,113,0.1); }

  /* Player */
  .player { display: none; }
  .player.visible { display: block; }
  audio { width: 100%; margin-top: 10px; border-radius: 8px; }
  .player-meta { font-size: 0.78rem; color: var(--muted); margin-top: 8px; display: flex; gap: 16px; flex-wrap: wrap; }
  .player-meta span { display: flex; align-items: center; gap: 4px; }

  /* History */
  .hist-item {
    background: var(--bg); border: 1px solid var(--border); border-radius: 10px;
    padding: 12px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.15s;
  }
  .hist-item:hover { border-color: var(--accent); }
  .hist-text { font-size: 0.83rem; color: var(--text); line-height: 1.45; }
  .hist-meta { font-size: 0.72rem; color: var(--muted); margin-top: 6px; display: flex; gap: 10px; flex-wrap: wrap; }
  .hist-badge { background: var(--surface2); border-radius: 4px; padding: 1px 6px; }
  audio.hist-audio { width: 100%; margin-top: 8px; }
  .hist-empty { color: var(--muted); font-size: 0.85rem; text-align: center; padding: 32px 0; }

  /* Voice info tooltip */
  .voice-note { font-size: 0.75rem; color: var(--muted); margin-top: 6px; font-style: italic; }

  @media (max-width: 768px) {
    .layout { grid-template-columns: 1fr; }
    .sidebar { border-left: none; border-top: 1px solid var(--border); }
    .emotions { grid-template-columns: repeat(4, 1fr); }
    .controls { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
<header>
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  <h1>MLX TTS Studio</h1>
  <span>Kokoro-82M · Apple Silicon</span>
</header>

<div class="layout">
<div class="main">

  <!-- AI Content Generator -->
  <div class="card">
    <div class="card-title">✨ AI Content Generator</div>
    <div class="ai-bar">
      <input id="aiTopic" placeholder="Topic or prompt (e.g. 'a bedtime story about a robot')" />
      <div>
        <div class="ai-length" style="margin-bottom:6px;">
          <button class="active" data-len="short" onclick="setLen(this)">Short</button>
          <button data-len="medium" onclick="setLen(this)">Medium</button>
          <button data-len="long" onclick="setLen(this)">Long</button>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="generateContent()">Generate text</button>
      </div>
    </div>
    <div id="aiStatus" style="margin-top:8px;font-size:0.8rem;color:var(--muted);"></div>
  </div>

  <!-- Text input -->
  <div class="card">
    <div class="card-title">Text to Speak</div>
    <textarea id="textInput" placeholder="Type or paste text here…">The lighthouse stood at the edge of the world, where the sea met the sky in a grey, endless embrace. Every night, its beam swept the darkness — a promise to all who sailed: you are not alone.</textarea>
    <div style="text-align:right;margin-top:6px;font-size:0.75rem;color:var(--muted);" id="charCount">0 chars</div>
  </div>

  <!-- Emotion -->
  <div class="card">
    <div class="card-title">Emotion</div>
    <div class="emotions" id="emotionGrid"></div>
    <div id="emotionDesc" style="margin-top:10px;font-size:0.8rem;color:var(--muted);"></div>
  </div>

  <!-- Controls -->
  <div class="card">
    <div class="card-title">Settings</div>
    <div class="controls">
      <div>
        <label>Language</label>
        <select id="langSelect" onchange="onLangChange()"></select>
      </div>
      <div>
        <label>Voice</label>
        <select id="voiceSelect" onchange="onVoiceChange()"></select>
        <div class="voice-note" id="voiceNote"></div>
      </div>
      <div>
        <label>Speed <span id="speedVal" style="color:var(--accent2)">1.0×</span></label>
        <div class="speed-row">
          <input type="range" id="speedSlider" min="0.5" max="2.0" step="0.05" value="1.0" oninput="onSpeed()">
        </div>
      </div>
      <div>
        <label>Format</label>
        <select id="formatSelect">
          <option value="wav">WAV (uncompressed)</option>
          <option value="flac">FLAC (lossless)</option>
        </select>
      </div>
    </div>
    <div style="margin-top:10px;font-size:0.78rem;color:var(--muted);" id="effectiveSpeed"></div>
  </div>

  <!-- Generate -->
  <div class="card">
    <div class="generate-row">
      <button class="btn" id="generateBtn" onclick="generate()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Generate Speech
      </button>
      <div class="status" id="status"></div>
    </div>
    <div class="player" id="player">
      <audio id="audioPlayer" controls></audio>
      <div class="player-meta" id="playerMeta"></div>
    </div>
  </div>

</div><!-- /.main -->

<!-- Sidebar: history -->
<div class="sidebar">
  <div style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);">History</div>
  <div id="histList"><div class="hist-empty">No generations yet</div></div>
</div>
</div><!-- /.layout -->

<script>
const API = '';
let voices = [], languages = {}, emotions = {};
let currentEmotion = 'neutral';
let aiLength = 'short';

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  [voices, languages, emotions] = await Promise.all([
    fetch(`${API}/api/voices`).then(r => r.json()),
    fetch(`${API}/api/languages`).then(r => r.json()),
    fetch(`${API}/api/emotions`).then(r => r.json()),
  ]);
  buildLangSelect();
  buildEmotionGrid();
  onLangChange();
  updateCharCount();
  document.getElementById('textInput').addEventListener('input', updateCharCount);
  loadHistory();
}

function updateCharCount() {
  const n = document.getElementById('textInput').value.length;
  document.getElementById('charCount').textContent = `${n} chars`;
}

// ── Language / Voice ──────────────────────────────────────────────────────────
function buildLangSelect() {
  const sel = document.getElementById('langSelect');
  sel.innerHTML = '';
  for (const [key, info] of Object.entries(languages)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = info.name;
    sel.appendChild(opt);
  }
}

function onLangChange() {
  const lang = document.getElementById('langSelect').value;
  const langInfo = languages[lang] || {};
  const filtered = voices.filter(v => v.lang === lang);
  const sel = document.getElementById('voiceSelect');
  sel.innerHTML = '';
  if (filtered.length === 0) {
    // fallback: show all voices for espeak-ng languages
    const opt = document.createElement('option');
    opt.value = langInfo.default_voice || 'af_heart';
    opt.textContent = langInfo.default_voice || 'af_heart';
    sel.appendChild(opt);
  } else {
    filtered.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.id}  —  ${v.gender}, ${v.note}`;
      if (v.id === langInfo.default_voice) opt.selected = true;
      sel.appendChild(opt);
    });
  }
  onVoiceChange();
}

function onVoiceChange() {
  const vid = document.getElementById('voiceSelect').value;
  const v = voices.find(x => x.id === vid);
  document.getElementById('voiceNote').textContent = v ? `${v.gender} · ${v.accent} · ${v.note}` : '';
}

// ── Speed ─────────────────────────────────────────────────────────────────────
function onSpeed() {
  const s = parseFloat(document.getElementById('speedSlider').value);
  document.getElementById('speedVal').textContent = `${s.toFixed(2)}×`;
  updateEffectiveSpeed();
}

function updateEffectiveSpeed() {
  const s = parseFloat(document.getElementById('speedSlider').value);
  const em = emotions[currentEmotion];
  if (!em) return;
  const eff = (s * em.speed_mult).toFixed(2);
  document.getElementById('effectiveSpeed').textContent =
    currentEmotion === 'neutral'
      ? `Effective speed: ${eff}×`
      : `Effective speed: ${eff}× (${s.toFixed(2)} × ${em.speed_mult} ${em.label} modifier)`;
}

// ── Emotions ──────────────────────────────────────────────────────────────────
function buildEmotionGrid() {
  const grid = document.getElementById('emotionGrid');
  grid.innerHTML = '';
  for (const [key, em] of Object.entries(emotions)) {
    const btn = document.createElement('div');
    btn.className = 'emotion-btn' + (key === 'neutral' ? ' active' : '');
    btn.dataset.emotion = key;
    btn.innerHTML = `<div class="emotion-icon">${em.icon}</div><div class="emotion-label">${em.label}</div>`;
    btn.addEventListener('click', () => selectEmotion(key));
    grid.appendChild(btn);
  }
}

function selectEmotion(key) {
  currentEmotion = key;
  document.querySelectorAll('.emotion-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.emotion === key);
  });
  const em = emotions[key];
  document.getElementById('emotionDesc').textContent = em ? `${em.icon} ${em.description}` : '';
  updateEffectiveSpeed();
}

// ── AI Content ────────────────────────────────────────────────────────────────
function setLen(btn) {
  aiLength = btn.dataset.len;
  document.querySelectorAll('.ai-length button').forEach(b => b.classList.toggle('active', b === btn));
}

async function generateContent() {
  const topic = document.getElementById('aiTopic').value.trim();
  if (!topic) { document.getElementById('aiStatus').textContent = 'Enter a topic first.'; return; }
  const lang = document.getElementById('langSelect').value;
  document.getElementById('aiStatus').textContent = '✨ Generating…';
  try {
    const r = await fetch(`${API}/api/generate-content`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ topic, lang, emotion: currentEmotion, length: aiLength }),
    });
    const data = await r.json();
    if (data.error) { document.getElementById('aiStatus').textContent = '⚠ ' + data.error; return; }
    document.getElementById('textInput').value = data.text;
    document.getElementById('aiStatus').textContent = '✓ Done — review and generate!';
    updateCharCount();
  } catch(e) {
    document.getElementById('aiStatus').textContent = '⚠ ' + e.message;
  }
}

// ── Generate TTS ──────────────────────────────────────────────────────────────
async function generate() {
  const text = document.getElementById('textInput').value.trim();
  if (!text) { showStatus('error', 'Enter some text first.'); return; }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  showStatus('generating', '⏳ Generating…');

  const body = {
    text,
    voice: document.getElementById('voiceSelect').value,
    lang: document.getElementById('langSelect').value,
    speed: parseFloat(document.getElementById('speedSlider').value),
    emotion: currentEmotion,
    audio_format: document.getElementById('formatSelect').value,
  };

  try {
    const r = await fetch(`${API}/api/generate`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (data.error) { showStatus('error', '✗ ' + data.error); return; }
    showStatus('success', `✓ Done in ${data.gen_time}s`);
    playAudio(data);
    prependHistory(data);
  } catch(e) {
    showStatus('error', '✗ ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

function showStatus(type, msg) {
  const el = document.getElementById('status');
  el.className = 'status ' + type;
  el.textContent = msg;
}

function playAudio(data) {
  const player = document.getElementById('player');
  const audio = document.getElementById('audioPlayer');
  audio.src = data.url;
  audio.play();
  player.classList.add('visible');
  const em = emotions[data.emotion] || {};
  document.getElementById('playerMeta').innerHTML = `
    <span>🎙 ${data.voice}</span>
    <span>🌐 ${data.lang}</span>
    <span>${em.icon || ''} ${data.emotion}</span>
    <span>⚡ ${data.effective_speed}× speed</span>
    <span>⏱ ${data.gen_time}s gen</span>
    <a href="${data.url}" download="${data.filename}" style="color:var(--accent2);text-decoration:none;">⬇ Download</a>
  `;
}

// ── History ───────────────────────────────────────────────────────────────────
async function loadHistory() {
  const data = await fetch(`${API}/api/history`).then(r => r.json());
  const list = document.getElementById('histList');
  if (!data.length) { list.innerHTML = '<div class="hist-empty">No generations yet</div>'; return; }
  list.innerHTML = '';
  data.forEach(item => appendHistItem(item, list));
}

function prependHistory(data) {
  const list = document.getElementById('histList');
  if (list.querySelector('.hist-empty')) list.innerHTML = '';
  const el = buildHistItem(data);
  list.prepend(el);
}

function buildHistItem(item) {
  const em = emotions[item.emotion] || {};
  const div = document.createElement('div');
  div.className = 'hist-item';
  div.innerHTML = `
    <div class="hist-text">${escHtml(item.text)}</div>
    <div class="hist-meta">
      <span class="hist-badge">🎙 ${item.voice}</span>
      <span class="hist-badge">🌐 ${item.lang}</span>
      <span class="hist-badge">${em.icon || ''} ${item.emotion}</span>
      <span class="hist-badge">⚡ ${item.effective_speed}×</span>
      <span style="margin-left:auto;">${item.ts}</span>
    </div>
    <audio class="hist-audio" controls src="${item.url}"></audio>
  `;
  return div;
}

function appendHistItem(item, list) {
  list.appendChild(buildHistItem(item));
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──────────────────────────────────────────────────────────────────────
boot();
</script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def index():
    return HTML


# ── Book Browser ────────────────────────────────────────────────────────────────

from book_manager import BookManager as _BookManager

_bm = _BookManager(books_dir=Path("books"))

# Production jobs (in-memory tracking)
_prod_jobs: dict[str, dict] = {}


@app.get("/books", response_class=HTMLResponse)
def books_page():
    html_path = Path(__file__).parent / "book_browser.html"
    return html_path.read_text(encoding="utf-8")


class BookInitRequest(BaseModel):
    name: str
    title: str = ""
    language: str = "zh"
    author: str = ""


class ChapterSaveRequest(BaseModel):
    title: str = ""
    segments: list[dict] = []
    silence_ms: int = 500
    output_format: str = "flac"
    metadata: dict = {}


class CharactersUpdateRequest(BaseModel):
    characters: dict


@app.get("/api/books")
def api_list_books():
    return _bm.list_books()


@app.post("/api/books/init")
def api_init_book(req: BookInitRequest):
    _bm.init_book(req.name, title=req.title or req.name,
                  language=req.language, author=req.author)
    return {"ok": True, "name": req.name}


@app.get("/api/books/{name}")
def api_get_book(name: str):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    return book


@app.post("/api/books/{name}/scan")
def api_scan_chapters(name: str):
    chapters = _bm.scan_chapters(name)
    return {"chapters": chapters}


@app.get("/api/books/{name}/chapters/{num}")
def api_get_chapter(name: str, num: int):
    story = _bm.get_chapter(name, num)
    if not story:
        return JSONResponse({"error": "chapter not parsed yet"}, status_code=404)
    audio_path = _bm.get_chapter_audio_path(name, num)
    if audio_path.exists():
        story["audio_url"] = f"/api/books/{name}/chapters/{num}/audio"
    return story


@app.put("/api/books/{name}/chapters/{num}")
def api_save_chapter(name: str, num: int, req: ChapterSaveRequest):
    story_data = {
        "version": "1.0",
        "title": req.title or f"Chapter {num:03d}",
        "silence_ms": req.silence_ms,
        "output_format": req.output_format,
        "metadata": req.metadata,
        "segments": req.segments,
    }
    _bm.save_chapter_story(name, num, story_data)
    return {"ok": True}


@app.put("/api/books/{name}/characters")
def api_update_characters(name: str, req: CharactersUpdateRequest):
    _bm.update_characters(name, req.characters)
    return {"ok": True}


@app.get("/api/books/{name}/chapters/{num}/audio")
def api_chapter_audio(name: str, num: int):
    audio_path = _bm.get_chapter_audio_path(name, num)
    if not audio_path.exists():
        return JSONResponse({"error": "audio not found"}, status_code=404)
    media = "audio/flac" if audio_path.suffix == ".flac" else "audio/wav"
    return FileResponse(audio_path, media_type=media)


async def _produce_chapter_bg(name: str, num: int, job_id: str):
    """Background task: produce audio for a chapter via subprocess."""
    _prod_jobs[job_id] = {"status": "producing", "chapter": num, "progress": 0}
    story_path = _bm.get_chapter_story_path(name, num).resolve()
    audio_path = _bm.get_chapter_audio_path(name, num).resolve()

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, str(Path(__file__).parent / "story_to_voice.py"),
            "produce", str(story_path), "-o", str(audio_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            _prod_jobs[job_id]["status"] = "error"
            _prod_jobs[job_id]["error"] = stderr.decode()[-500:]
            return

        # Update book.json status
        if audio_path.exists():
            import soundfile as sf
            info = sf.info(str(audio_path))
            _bm.update_chapter_status(name, num, "produced",
                                       duration_s=info.duration,
                                       audio_filename=audio_path.name)
        _prod_jobs[job_id]["status"] = "done"
    except Exception as e:
        _prod_jobs[job_id]["status"] = "error"
        _prod_jobs[job_id]["error"] = str(e)


@app.post("/api/books/{name}/chapters/{num}/produce")
async def api_produce_chapter(name: str, num: int, background_tasks: BackgroundTasks):
    job_id = uuid.uuid4().hex[:8]
    _prod_jobs[job_id] = {"status": "queued", "chapter": num}
    background_tasks.add_task(_produce_chapter_bg, name, num, job_id)
    return {"job_id": job_id}


@app.post("/api/books/{name}/produce-all")
async def api_produce_all(name: str, background_tasks: BackgroundTasks):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    chapters = [c for c in book.get("chapters", [])
                if c.get("status") != "produced" and c.get("story_json")]
    job_id = uuid.uuid4().hex[:8]
    _prod_jobs[job_id] = {"status": "queued", "chapters": len(chapters)}
    for ch in chapters:
        background_tasks.add_task(_produce_chapter_bg, name, ch["number"], job_id)
    return {"job_id": job_id, "chapters": len(chapters)}


@app.get("/api/books/{name}/jobs/{job_id}")
def api_job_status(name: str, job_id: str):
    job = _prod_jobs.get(job_id)
    if not job:
        return JSONResponse({"error": "job not found"}, status_code=404)
    return job


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7860))
    print(f"\n  MLX TTS Studio → http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
