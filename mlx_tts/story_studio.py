"""
MLX TTS Story Studio — multi-character, multi-section story producer.

Run:
    cd mlx_tts
    .venv/bin/python story_studio.py          # port 7861

Pipeline per "Produce" request:
  1. Decompose each section into its voice/emotion preset
  2. Generate audio for each section sequentially
  3. Concatenate with configurable silence gaps
  4. Convert to lossless FLAC
  5. Stream progress via SSE; serve result for in-browser playback
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import uuid
from pathlib import Path
from typing import AsyncGenerator, Optional

import mlx.core as mx
import numpy as np
import soundfile as sf
import uvicorn
from fastapi import FastAPI, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from mlx_tts.generator import TTSGenerator, DEFAULT_MODEL
from mlx_tts.voices import VOICE_CATALOG, LANGUAGES, EMOTIONS, DEFAULT_VOICE, emotion_speed

# ── Config ─────────────────────────────────────────────────────────────────────

OUTPUT_DIR = Path("outputs/story_studio")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_RATE = 24000          # Kokoro output sample rate
DEFAULT_SILENCE_MS = 500     # silence between segments

app = FastAPI(title="MLX TTS Story Studio")

# Shared generator (lazy-loaded)
_generator: Optional[TTSGenerator] = None
_gen_lock = asyncio.Lock()

def get_generator() -> TTSGenerator:
    global _generator
    if _generator is None:
        _generator = TTSGenerator(verbose=False)
    return _generator


# ── Request models ─────────────────────────────────────────────────────────────

class SegmentSpec(BaseModel):
    id: str
    character: str
    text: str
    voice: str = DEFAULT_VOICE
    lang: str = "en-us"
    emotion: str = "neutral"
    speed: float = 1.0


class ProduceRequest(BaseModel):
    title: str = "Untitled Story"
    segments: list[SegmentSpec]
    silence_ms: int = DEFAULT_SILENCE_MS
    output_format: str = "flac"   # "flac" | "wav"


class StoryProjectMetadata(BaseModel):
    source: str = ""
    created: str = ""
    author: str = ""
    language: str = "en"


class StoryProject(BaseModel):
    version: str = "1.0"
    title: str = "Untitled Story"
    silence_ms: int = DEFAULT_SILENCE_MS
    output_format: str = "flac"
    metadata: StoryProjectMetadata = StoryProjectMetadata()
    segments: list[SegmentSpec]


class InitBookRequest(BaseModel):
    name: str
    title: str = ""
    language: str = "zh"
    author: str = ""
    genre: str = ""


# ── Job store ──────────────────────────────────────────────────────────────────

# job_id → asyncio.Queue of SSE event dicts (None = done)
_job_queues: dict[str, asyncio.Queue] = {}
# job_id → final result dict (populated when job finishes)
_job_results: dict[str, dict] = {}


def _new_job() -> tuple[str, asyncio.Queue]:
    jid = uuid.uuid4().hex[:10]
    q: asyncio.Queue = asyncio.Queue()
    _job_queues[jid] = q
    return jid, q


async def _push(q: asyncio.Queue, event: str, data: dict):
    await q.put({"event": event, "data": data})


# ── Audio helpers ──────────────────────────────────────────────────────────────

def _silence(ms: int, sr: int = SAMPLE_RATE) -> np.ndarray:
    return np.zeros(int(sr * ms / 1000), dtype=np.float32)


def _generate_segment(
    gen: TTSGenerator,
    spec: SegmentSpec,
    lang_code: str,
) -> tuple[np.ndarray, int]:
    """Run TTS for one segment, return (audio_np, sample_rate)."""
    eff_speed = emotion_speed(spec.speed, spec.emotion)
    chunks = []
    sr = SAMPLE_RATE

    for result in gen._model.generate(
        text=spec.text,
        voice=spec.voice,
        speed=eff_speed,
        lang_code=lang_code,
    ):
        arr = np.array(result.audio, copy=False).flatten().astype(np.float32)
        chunks.append(arr)
        sr = result.sample_rate

    mx.clear_cache()
    if not chunks:
        raise RuntimeError(f"No audio for segment: {spec.character!r}")

    return (np.concatenate(chunks) if len(chunks) > 1 else chunks[0]), sr


# ── Production background task ─────────────────────────────────────────────────

async def _produce_task(job_id: str, req: ProduceRequest):
    q = _job_queues[job_id]
    n = len(req.segments)
    ts = time.strftime("%Y%m%d_%H%M%S")
    slug = req.title.lower().replace(" ", "_")[:30]
    ext = req.output_format

    await _push(q, "start", {"total": n, "title": req.title, "job_id": job_id})

    audio_parts: list[np.ndarray] = []
    sr = SAMPLE_RATE

    async with _gen_lock:
        gen = get_generator()
        loop = asyncio.get_event_loop()
        # Run model load in thread pool so it doesn't freeze the event loop
        # (blocking the event loop would prevent SSE from delivering events)
        await loop.run_in_executor(None, gen._load)

        for idx, seg in enumerate(req.segments):
            lang_info = LANGUAGES.get(seg.lang)
            if not lang_info:
                await _push(q, "error", {"idx": idx, "message": f"Unknown language: {seg.lang}"})
                await q.put(None)
                return

            lang_code = lang_info["code"]
            em = EMOTIONS.get(seg.emotion, EMOTIONS["neutral"])
            eff_speed = round(emotion_speed(seg.speed, seg.emotion), 2)

            await _push(q, "segment_start", {
                "idx": idx,
                "total": n,
                "character": seg.character,
                "voice": seg.voice,
                "emotion": seg.emotion,
                "emotion_icon": em["icon"],
                "speed": eff_speed,
                "text_preview": seg.text[:80] + ("…" if len(seg.text) > 80 else ""),
            })

            t0 = time.perf_counter()
            try:
                loop = asyncio.get_event_loop()
                audio_np, sr = await loop.run_in_executor(
                    None,
                    lambda s=seg, lc=lang_code: _generate_segment(gen, s, lc),
                )
            except Exception as exc:
                await _push(q, "error", {"idx": idx, "message": str(exc)})
                await q.put(None)
                return

            elapsed = time.perf_counter() - t0
            duration = len(audio_np) / sr

            await _push(q, "segment_done", {
                "idx": idx,
                "character": seg.character,
                "duration": round(duration, 2),
                "gen_time": round(elapsed, 2),
                "rtf": round(elapsed / duration, 2) if duration > 0 else 0,
            })

            audio_parts.append(audio_np)
            # Add silence gap between segments (not after the last one)
            if idx < n - 1:
                audio_parts.append(_silence(req.silence_ms, sr))

    # ── Combine ──────────────────────────────────────────────────────────────
    await _push(q, "combining", {"message": "Stitching segments…"})

    combined = np.concatenate(audio_parts)
    total_duration = len(combined) / sr

    # ── Write output ─────────────────────────────────────────────────────────
    await _push(q, "writing", {"format": ext, "duration": round(total_duration, 2)})

    out_path = OUTPUT_DIR / f"{slug}_{ts}.{ext}"
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: sf.write(str(out_path), combined, sr,
                         format="FLAC" if ext == "flac" else "WAV",
                         subtype="PCM_24" if ext == "flac" else "PCM_16"),
    )

    file_kb = out_path.stat().st_size / 1024
    result = {
        "job_id": job_id,
        "title": req.title,
        "url": f"/story/{out_path.name}",
        "filename": out_path.name,
        "duration": round(total_duration, 2),
        "segments": n,
        "format": ext,
        "size_kb": round(file_kb, 1),
        "ts": ts,
    }
    _job_results[job_id] = result

    await _push(q, "done", result)
    await q.put(None)   # sentinel — stream ends


# ── API: produce ───────────────────────────────────────────────────────────────

@app.post("/api/produce")
async def api_produce(req: ProduceRequest, background_tasks: BackgroundTasks):
    if not req.segments:
        return JSONResponse({"error": "no segments"}, status_code=400)

    job_id, _ = _new_job()
    background_tasks.add_task(_produce_task, job_id, req)
    return {"job_id": job_id}


@app.get("/api/produce/{job_id}/events")
async def api_produce_events(job_id: str):
    """SSE stream for production progress."""
    q = _job_queues.get(job_id)
    if q is None:
        return JSONResponse({"error": "job not found"}, status_code=404)

    async def event_stream() -> AsyncGenerator[str, None]:
        while True:
            item = await q.get()
            if item is None:
                yield "data: [DONE]\n\n"
                break
            payload = json.dumps(item)
            yield f"data: {payload}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/produce/{job_id}")
def api_produce_status(job_id: str):
    result = _job_results.get(job_id)
    if result is None:
        in_progress = job_id in _job_queues
        return JSONResponse({"status": "in_progress" if in_progress else "not_found"})
    return {"status": "done", **result}


@app.get("/story/{filename}")
def serve_story(filename: str):
    path = OUTPUT_DIR / filename
    if not path.exists():
        return JSONResponse({"error": "not found"}, status_code=404)
    media = "audio/flac" if filename.endswith(".flac") else "audio/wav"
    return FileResponse(path, media_type=media)


@app.get("/api/voices")
def api_voices():
    return VOICE_CATALOG

@app.get("/api/languages")
def api_languages():
    return LANGUAGES

@app.get("/api/emotions")
def api_emotions():
    return EMOTIONS


@app.post("/api/export")
async def api_export(req: ProduceRequest):
    """Export a story project as downloadable JSON."""
    project = {
        "version": "1.0",
        "title": req.title,
        "silence_ms": req.silence_ms,
        "output_format": req.output_format,
        "metadata": {
            "source": "story_studio",
            "created": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "author": "",
            "language": "en",
        },
        "segments": [s.model_dump() for s in req.segments],
    }
    return project


@app.post("/api/import")
async def api_import(project: StoryProject):
    """Validate and echo back an imported story project."""
    errors = []
    for seg in project.segments:
        if seg.lang not in LANGUAGES:
            errors.append(f"Unknown language '{seg.lang}' in segment '{seg.id}'")
    if errors:
        return JSONResponse({"error": "; ".join(errors)}, status_code=400)
    return project.model_dump()


# ── Books API ───────────────────────────────────────────────────────────────────

sys.path.insert(0, str(Path(__file__).parent))
from book_manager import BookManager

_bm = BookManager()


@app.get("/api/books")
def api_list_books():
    return _bm.list_books()


@app.post("/api/books/init")
def api_init_book(req: InitBookRequest):
    _bm.init_book(req.name, title=req.title or req.name,
                  language=req.language, author=req.author, genre=req.genre)
    return _bm.get_book(req.name)


@app.get("/api/books/{name}")
def api_get_book(name: str):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    return book


@app.put("/api/books/{name}/characters")
def api_update_characters(name: str, req: dict):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    _bm.update_characters(name, req.get("characters", {}))
    return _bm.get_book(name)


@app.get("/api/books/{name}/chapters/{num}")
def api_get_chapter(name: str, num: int):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    story = _bm.get_chapter(name, num)
    if not story:
        return JSONResponse({"error": "chapter not parsed yet"}, status_code=404)
    # Include audio URL if produced
    audio_path = _bm.get_chapter_audio_path(name, num)
    result = dict(story)
    if audio_path.exists():
        result["audio_url"] = f"/api/books/{name}/chapters/{num}/audio"
    return result


@app.put("/api/books/{name}/chapters/{num}")
async def api_update_chapter(name: str, num: int, project: StoryProject):
    """Update chapter segments (human edit)."""
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    story_data = {
        "version": "1.0",
        "title": project.title or f"Chapter {num:03d}",
        "silence_ms": project.silence_ms,
        "output_format": project.output_format,
        "metadata": {"source": f"chapter-{num:03d}.txt", "created": time.strftime("%Y-%m-%dT%H:%M:%S")},
        "segments": [s.model_dump() for s in project.segments],
    }
    _bm.save_chapter_story(name, num, story_data)
    return story_data


@app.post("/api/books/{name}/chapters/{num}/produce")
async def api_produce_chapter(name: str, num: int, background_tasks: BackgroundTasks):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    story = _bm.get_chapter(name, num)
    if not story:
        return JSONResponse({"error": "chapter not parsed yet"}, status_code=400)

    job_id, q = _new_job()
    background_tasks.add_task(_produce_chapter_task, job_id, name, num, story)
    return {"job_id": job_id}


@app.post("/api/books/{name}/produce-all")
async def api_produce_all(name: str, background_tasks: BackgroundTasks):
    book = _bm.get_book(name)
    if not book:
        return JSONResponse({"error": "book not found"}, status_code=404)
    chapters_to_produce = [
        ch for ch in book.get("chapters", [])
        if ch.get("status") in ("pending", "parsed")
    ]
    if not chapters_to_produce:
        return JSONResponse({"message": "all chapters produced"}, status_code=200)

    job_id, q = _new_job()
    background_tasks.add_task(_produce_all_task, job_id, name, chapters_to_produce)
    return {"job_id": job_id, "chapters": len(chapters_to_produce)}


@app.get("/api/books/{name}/chapters/{num}/audio")
def api_chapter_audio(name: str, num: int):
    audio_path = _bm.get_chapter_audio_path(name, num)
    if not audio_path.exists():
        return JSONResponse({"error": "audio not found"}, status_code=404)
    media = "audio/flac" if audio_path.suffix == ".flac" else "audio/wav"
    return FileResponse(str(audio_path), media_type=media)


async def _produce_chapter_task(job_id: str, book_name: str, chapter_num: int, story_data: dict):
    """Produce audio for a single chapter."""
    q = _job_queues[job_id]
    segs = story_data.get("segments", [])
    n = len(segs)
    title = story_data.get("title", f"Chapter {chapter_num:03d}")
    output_format = story_data.get("output_format", "flac")

    await _push(q, "start", {"total": n, "title": title, "job_id": job_id})

    audio_parts: list = []
    sr = SAMPLE_RATE

    async with _gen_lock:
        gen = get_generator()
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, gen._load)

        for idx, seg_dict in enumerate(segs):
            seg = SegmentSpec(**seg_dict)
            lang_info = LANGUAGES.get(seg.lang)
            if not lang_info:
                await _push(q, "error", {"idx": idx, "message": f"Unknown language: {seg.lang}"})
                await q.put(None)
                return

            lang_code = lang_info["code"]
            em = EMOTIONS.get(seg.emotion, EMOTIONS["neutral"])
            eff_speed = round(emotion_speed(seg.speed, seg.emotion), 2)

            await _push(q, "segment_start", {
                "idx": idx, "total": n, "character": seg.character,
                "voice": seg.voice, "emotion": seg.emotion,
                "emotion_icon": em["icon"], "speed": eff_speed,
                "text_preview": seg.text[:80] + ("…" if len(seg.text) > 80 else ""),
            })

            t0 = time.perf_counter()
            try:
                audio_np, sr = await loop.run_in_executor(
                    None, lambda s=seg, lc=lang_code: _generate_segment(gen, s, lc),
                )
            except Exception as exc:
                await _push(q, "error", {"idx": idx, "message": str(exc)})
                await q.put(None)
                return

            elapsed = time.perf_counter() - t0
            duration = len(audio_np) / sr
            await _push(q, "segment_done", {
                "idx": idx, "character": seg.character,
                "duration": round(duration, 2), "gen_time": round(elapsed, 2),
                "rtf": round(elapsed / duration, 2) if duration > 0 else 0,
            })
            audio_parts.append(audio_np)
            if idx < n - 1:
                audio_parts.append(_silence(story_data.get("silence_ms", 500), sr))

    # Combine and write
    await _push(q, "combining", {"message": "Stitching segments…"})
    combined = np.concatenate(audio_parts)
    total_duration = len(combined) / sr

    audio_path = _bm.get_chapter_audio_path(book_name, chapter_num)
    audio_path.parent.mkdir(parents=True, exist_ok=True)
    await _push(q, "writing", {"format": output_format, "duration": round(total_duration, 2)})

    await loop.run_in_executor(
        None,
        lambda: sf.write(str(audio_path), combined, sr,
                         format="FLAC" if output_format == "flac" else "WAV",
                         subtype="PCM_24" if output_format == "flac" else "PCM_16"),
    )

    file_kb = audio_path.stat().st_size / 1024
    _bm.update_chapter_status(book_name, chapter_num, "produced",
                               duration_s=total_duration, audio_filename=audio_path.name)

    result = {
        "job_id": job_id, "title": title,
        "url": f"/api/books/{book_name}/chapters/{chapter_num}/audio",
        "filename": audio_path.name, "duration": round(total_duration, 2),
        "segments": n, "format": output_format, "size_kb": round(file_kb, 1),
        "chapter": chapter_num,
    }
    _job_results[job_id] = result
    await _push(q, "done", result)
    await q.put(None)


async def _produce_all_task(job_id: str, book_name: str, chapters: list[dict]):
    """Produce multiple chapters sequentially."""
    q = _job_queues[job_id]
    total_ch = len(chapters)
    await _push(q, "start", {"total": 0, "title": f"Producing {total_ch} chapters", "job_id": job_id})

    for i, ch in enumerate(chapters):
        num = ch["number"]
        await _push(q, "chapter_start", {"chapter": num, "index": i, "total": total_ch})

        story = _bm.get_chapter(book_name, num)
        if not story:
            await _push(q, "chapter_skip", {"chapter": num, "reason": "not parsed"})
            continue

        # Run production inline (reuse the generator)
        segs = story.get("segments", [])
        if not segs:
            await _push(q, "chapter_skip", {"chapter": num, "reason": "no segments"})
            continue

        audio_parts = []
        sr = SAMPLE_RATE
        async with _gen_lock:
            gen = get_generator()
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, gen._load)

            for idx, seg_dict in enumerate(segs):
                seg = SegmentSpec(**seg_dict)
                lang_info = LANGUAGES.get(seg.lang)
                if not lang_info:
                    continue
                lang_code = lang_info["code"]
                try:
                    audio_np, sr = await loop.run_in_executor(
                        None, lambda s=seg, lc=lang_code: _generate_segment(gen, s, lc),
                    )
                    audio_parts.append(audio_np)
                    if idx < len(segs) - 1:
                        audio_parts.append(_silence(story.get("silence_ms", 500), sr))
                except Exception:
                    continue

        if not audio_parts:
            continue

        combined = np.concatenate(audio_parts)
        total_duration = len(combined) / sr
        output_format = story.get("output_format", "flac")
        audio_path = _bm.get_chapter_audio_path(book_name, num)
        audio_path.parent.mkdir(parents=True, exist_ok=True)

        await loop.run_in_executor(
            None,
            lambda: sf.write(str(audio_path), combined, sr,
                             format="FLAC" if output_format == "flac" else "WAV",
                             subtype="PCM_24" if output_format == "flac" else "PCM_16"),
        )

        _bm.update_chapter_status(book_name, num, "produced",
                                   duration_s=total_duration, audio_filename=audio_path.name)

        await _push(q, "chapter_done", {
            "chapter": num, "duration": round(total_duration, 2),
            "audio": audio_path.name,
        })

    result = {"job_id": job_id, "chapters_produced": total_ch}
    _job_results[job_id] = result
    await _push(q, "done", result)
    await q.put(None)


# ── HTML Studio ────────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Story Studio — MLX TTS</title>
<style>
:root {
  --bg: #0c0e18;
  --surface: #161927;
  --surface2: #1e2236;
  --surface3: #252944;
  --border: #2a2f4a;
  --accent: #7c6af7;
  --accent2: #a78bfa;
  --accent3: #c4b5fd;
  --text: #e2e4f0;
  --muted: #6b7094;
  --success: #4ade80;
  --warn: #fbbf24;
  --error: #f87171;
  --gap: 16px;

  /* Character palette */
  --c0: #7c6af7; --c1: #ec4899; --c2: #f59e0b; --c3: #10b981;
  --c4: #3b82f6; --c5: #ef4444; --c6: #8b5cf6; --c7: #06b6d4;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

/* ── Header ── */
header {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 12px 20px; display: flex; align-items: center; gap: 14px; flex-shrink: 0;
}
header svg { flex-shrink: 0; }
.title-input {
  background: transparent; border: none; color: var(--text); font-size: 1.1rem;
  font-weight: 700; outline: none; flex: 1; min-width: 0;
}
.title-input::placeholder { color: var(--muted); }
.header-actions { display: flex; gap: 10px; align-items: center; margin-left: auto; }

/* ── Layout ── */
.workspace { display: grid; grid-template-columns: 1fr 380px; flex: 1; overflow: hidden; }
.composer  { overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.panel     { background: var(--surface); border-left: 1px solid var(--border); overflow-y: auto; display: flex; flex-direction: column; }

/* ── Buttons ── */
.btn {
  background: var(--accent); color: #fff; border: none; border-radius: 9px;
  padding: 10px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 7px; transition: all .15s;
  white-space: nowrap;
}
.btn:hover  { background: var(--accent2); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-sm { padding: 6px 13px; font-size: 0.8rem; }
.btn-ghost {
  background: transparent; border: 1px solid var(--border); color: var(--muted);
}
.btn-ghost:hover { border-color: var(--accent); color: var(--text); background: transparent; }
.btn-danger { background: transparent; border: 1px solid var(--border); color: var(--error); }
.btn-danger:hover { background: rgba(248,113,113,.1); border-color: var(--error); }
.btn-add {
  background: var(--surface2); border: 2px dashed var(--border); color: var(--muted);
  border-radius: 12px; padding: 12px; width: 100%; font-size: 0.88rem;
  justify-content: center; transition: all .15s;
}
.btn-add:hover { border-color: var(--accent); color: var(--accent2); background: rgba(124,106,247,.06); }

/* ── Toast notification ── */
.toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  background: var(--surface2); border: 1px solid var(--border); border-radius: 10px;
  padding: 10px 20px; font-size: 0.85rem; color: var(--text); z-index: 1000;
  box-shadow: 0 4px 24px rgba(0,0,0,.4);
  opacity: 0; transition: opacity .3s; pointer-events: none;
}
.toast.visible { opacity: 1; }

/* ── Settings row in header ── */
.header-settings {
  display: flex; gap: 8px; align-items: center; font-size: 0.75rem; color: var(--muted);
}
.header-settings select, .header-settings input {
  background: var(--bg); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text); padding: 4px 8px; font-size: 0.75rem; width: auto;
}
.header-settings input { width: 60px; }

/* ── Segment card ── */
.seg-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden; transition: border-color .15s;
}
.seg-card:hover { border-color: var(--border); }

.seg-header {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  border-bottom: 1px solid var(--border); background: var(--surface2);
}
.seg-color { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.char-name {
  background: transparent; border: none; color: var(--text); font-size: 0.88rem;
  font-weight: 600; outline: none; flex: 1; min-width: 0;
}
.char-name::placeholder { color: var(--muted); }
.seg-idx { font-size: 0.72rem; color: var(--muted); flex-shrink: 0; }

.seg-settings { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 12px 16px; }
.field-label { font-size: 0.7rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
select, .sel {
  background: var(--bg); border: 1px solid var(--border); border-radius: 7px;
  color: var(--text); padding: 7px 9px; font-size: 0.82rem; width: 100%; cursor: pointer;
}
select:focus { outline: none; border-color: var(--accent); }

/* Emotion mini-pills */
.emotion-row { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 6px; }
.em-pill {
  background: var(--bg); border: 1px solid var(--border); border-radius: 20px;
  padding: 4px 10px; font-size: 0.75rem; cursor: pointer; display: flex;
  align-items: center; gap: 4px; transition: all .12s; user-select: none;
  white-space: nowrap;
}
.em-pill:hover { border-color: var(--accent); }
.em-pill.active { border-color: var(--accent); background: rgba(124,106,247,.18); color: var(--accent3); }

/* Speed row */
.speed-row { display: flex; align-items: center; gap: 8px; }
.speed-row input[type=range] {
  flex: 1; appearance: none; height: 4px; border-radius: 2px;
  background: var(--border); outline: none; cursor: pointer;
}
.speed-row input[type=range]::-webkit-slider-thumb {
  appearance: none; width: 14px; height: 14px; border-radius: 50%;
  background: var(--accent); cursor: pointer;
}
.speed-val { font-size: 0.78rem; color: var(--accent2); min-width: 32px; text-align: right; font-weight: 600; }

.seg-text {
  padding: 0 16px 14px; display: flex; flex-direction: column; gap: 6px;
}
.seg-text textarea {
  background: var(--bg); border: 1px solid var(--border); border-radius: 9px;
  color: var(--text); font-size: 0.9rem; line-height: 1.6; padding: 10px 12px;
  resize: vertical; min-height: 90px; width: 100%; font-family: inherit;
  transition: border-color .15s;
}
.seg-text textarea:focus { outline: none; border-color: var(--accent); }
.seg-footer { display: flex; align-items: center; justify-content: space-between; }
.char-count { font-size: 0.7rem; color: var(--muted); }

/* Reorder arrows */
.reorder-btns { display: flex; gap: 4px; }
.reorder-btn {
  background: transparent; border: 1px solid var(--border); border-radius: 5px;
  color: var(--muted); padding: 2px 7px; font-size: 0.75rem; cursor: pointer; line-height: 1.4;
}
.reorder-btn:hover { border-color: var(--accent); color: var(--accent2); }

/* ── Panel: Log + Player ── */
.panel-title {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted); padding: 14px 18px 8px;
}

.log-area { flex: 1; overflow-y: auto; padding: 0 18px 14px; }
.log-entry {
  display: flex; align-items: flex-start; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid var(--border); font-size: 0.82rem;
}
.log-entry:last-child { border-bottom: none; }
.log-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
.log-body { flex: 1; min-width: 0; }
.log-char { font-weight: 600; }
.log-meta { color: var(--muted); font-size: 0.75rem; margin-top: 2px; }
.log-preview { color: var(--muted); font-size: 0.78rem; margin-top: 3px; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.log-entry.done .log-icon::before { content: '✓'; color: var(--success); }
.log-entry.running .log-icon::before { content: '⏳'; }
.log-entry.error .log-icon::before { content: '✗'; color: var(--error); }
.log-entry.info .log-icon::before { content: '·'; color: var(--muted); }

/* Progress bar */
.progress-wrap { padding: 0 18px 12px; }
.progress-bar-bg { background: var(--surface2); border-radius: 4px; height: 6px; overflow: hidden; }
.progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--accent2)); border-radius: 4px; transition: width .3s; }
.progress-label { font-size: 0.75rem; color: var(--muted); margin-top: 5px; text-align: right; }

/* Player */
.player-area { padding: 14px 18px; border-top: 1px solid var(--border); background: var(--surface2); }
.player-title { font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; color: var(--text); }
.player-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.player-badge {
  background: var(--surface3); border-radius: 5px; padding: 2px 8px;
  font-size: 0.72rem; color: var(--muted);
}
audio { width: 100%; border-radius: 8px; }
.player-dl { display: inline-flex; align-items: center; gap: 5px; color: var(--accent2); font-size: 0.78rem; text-decoration: none; margin-top: 8px; }
.player-dl:hover { color: var(--accent3); }

/* Empty state */
.log-empty { text-align: center; color: var(--muted); font-size: 0.85rem; padding: 40px 20px; }
.log-empty svg { opacity: .3; margin-bottom: 10px; }

/* Status dot */
.status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.status-dot.idle { background: var(--muted); }
.status-dot.running { background: var(--warn); animation: pulse 1s infinite; }
.status-dot.done { background: var(--success); }
.status-dot.error { background: var(--error); }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }

/* Segment status overlay */
.seg-status { font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; }
.seg-status.pending  { color: var(--muted); background: var(--surface2); }
.seg-status.running  { color: var(--warn);  background: rgba(251,191,36,.12); }
.seg-status.done     { color: var(--success); background: rgba(74,222,128,.12); }
.seg-status.error    { color: var(--error);  background: rgba(248,113,113,.12); }

@media (max-width: 860px) {
  .workspace { grid-template-columns: 1fr; }
  .panel { border-left: none; border-top: 1px solid var(--border); max-height: 380px; }
  .seg-settings { grid-template-columns: 1fr 1fr; }
}
</style>
</head>
<body>

<header>
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 6s1.5-2 5-2 8 4 8 4-1.5 2-5 2-8-4-8-4z"/><path d="M6 12s1.5-2 5-2 8 4 8 4-1.5 2-5 2-8-4-8-4z"/><path d="M10 18s1.5-2 5-2 4 1 4 1"/>
  </svg>
  <input class="title-input" id="storyTitle" placeholder="Story title…" value="The White Fox Spirit">
  <div class="header-actions">
    <div class="header-settings">
      <label>Silence</label>
      <input type="number" id="silenceInput" value="500" min="0" max="5000" step="100"> ms
      <label style="margin-left:6px">Format</label>
      <select id="formatSelect">
        <option value="flac" selected>FLAC</option>
        <option value="wav">WAV</option>
      </select>
    </div>
    <button class="btn btn-sm btn-ghost" onclick="document.getElementById('importInput').click()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      Import
    </button>
    <input type="file" id="importInput" accept=".story.json,.json" style="display:none" onchange="importStory(this)">
    <button class="btn btn-sm btn-ghost" onclick="exportStory()">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Export
    </button>
    <div class="status-dot idle" id="statusDot"></div>
    <span id="statusLabel" style="font-size:.8rem;color:var(--muted)">Idle</span>
    <button class="btn" id="produceBtn" onclick="produce()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
      Produce Story
    </button>
  </div>
</header>

<div class="workspace">

<!-- ── Composer ── -->
<div class="composer" id="composer">
  <!-- segments injected here -->
  <button class="btn btn-add" onclick="addSegment()">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    Add Section
  </button>
</div>

<!-- ── Side panel ── -->
<div class="panel">
  <div class="panel-title">Production Log</div>

  <div class="progress-wrap" id="progressWrap" style="display:none">
    <div class="progress-bar-bg"><div class="progress-bar-fill" id="progressFill" style="width:0%"></div></div>
    <div class="progress-label" id="progressLabel">0 / 0</div>
  </div>

  <div class="log-area" id="logArea">
    <div class="log-empty" id="logEmpty">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
      <div style="margin-top:8px">Click <strong>Produce Story</strong> to generate</div>
    </div>
  </div>

  <div class="player-area" id="playerArea" style="display:none">
    <div class="player-title" id="playerTitle">—</div>
    <div class="player-meta" id="playerMeta"></div>
    <audio id="audioPlayer" controls></audio>
    <a id="dlLink" class="player-dl" download>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download FLAC
    </a>
  </div>
</div>

</div><!-- /.workspace -->

<script>
// ── Data ────────────────────────────────────────────────────────────────────
const API = '';
let voices = [], languages = {}, emotions = {};
let segments = [];   // [{id, character, voice, lang, emotion, speed, text}]
let segCounter = 0;

const CHAR_COLORS = [
  '#7c6af7','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#8b5cf6','#06b6d4',
];
// character name → color (assigned on first use)
const charColorMap = {};
function charColor(name) {
  if (!charColorMap[name]) {
    const idx = Object.keys(charColorMap).length % CHAR_COLORS.length;
    charColorMap[name] = CHAR_COLORS[idx];
  }
  return charColorMap[name];
}

// ── Boot ─────────────────────────────────────────────────────────────────────
async function boot() {
  [voices, languages, emotions] = await Promise.all([
    fetch(`${API}/api/voices`).then(r => r.json()),
    fetch(`${API}/api/languages`).then(r => r.json()),
    fetch(`${API}/api/emotions`).then(r => r.json()),
  ]);

  // Seed with two default segments
  addSegment({
    character: 'Narrator', voice: 'bm_george', lang: 'en-gb', emotion: 'storytelling',
    text: 'Deep in the mountains of ancient China, where mist curls around jade-green peaks, there lived a fox spirit who had cultivated for a thousand years.',
  });
  addSegment({
    character: 'Fox Spirit', voice: 'zf_xiaobei', lang: 'zh', emotion: 'whispery',
    text: '緣分未到，相見不如不見。只有心地純良之人，才能在夢中得見我的真容。',
  });
  addSegment({
    character: 'Narrator', voice: 'bm_george', lang: 'en-gb', emotion: 'storytelling',
    text: 'And so, under the silver light of the full moon, her voice drifted through the forest — a melody that made withered flowers bloom once more.',
  });
}

// ── Segment management ───────────────────────────────────────────────────────
function addSegment(preset = {}) {
  const id = 'seg_' + (++segCounter);
  const seg = {
    id,
    character: preset.character || 'Character',
    voice: preset.voice || 'af_heart',
    lang: preset.lang || 'en-us',
    emotion: preset.emotion || 'neutral',
    speed: preset.speed || 1.0,
    text: preset.text || '',
    status: 'pending',
  };
  segments.push(seg);
  renderSegment(seg);
  scrollToAddBtn();
}

function renderSegment(seg) {
  const composer = document.getElementById('composer');
  const addBtn = composer.querySelector('.btn-add');

  const card = document.createElement('div');
  card.className = 'seg-card';
  card.id = `card_${seg.id}`;
  card.innerHTML = buildCardHTML(seg);
  composer.insertBefore(card, addBtn);

  // Wire events
  initCard(card, seg);
}

function buildCardHTML(seg) {
  const idx = segments.indexOf(seg) + 1;
  const color = charColor(seg.character);
  const voiceOpts = buildVoiceOpts(seg.lang, seg.voice);
  const langOpts  = buildLangOpts(seg.lang);
  const emotionPills = buildEmotionPills(seg.emotion, seg.id);
  const effSpd = Math.round(seg.speed * (emotions[seg.emotion]?.speed_mult || 1) * 100) / 100;

  return `
  <div class="seg-header">
    <div class="seg-color" id="dot_${seg.id}" style="background:${color}"></div>
    <input class="char-name" data-field="character" value="${esc(seg.character)}" placeholder="Character name">
    <span class="seg-status pending" id="status_${seg.id}">pending</span>
    <span class="seg-idx">#${idx}</span>
    <div class="reorder-btns">
      <button class="reorder-btn" onclick="moveUp('${seg.id}')">▲</button>
      <button class="reorder-btn" onclick="moveDown('${seg.id}')">▼</button>
    </div>
    <button class="btn btn-sm btn-danger" onclick="removeSegment('${seg.id}')" style="padding:4px 8px;">✕</button>
  </div>
  <div class="seg-settings">
    <div>
      <div class="field-label">Language</div>
      <select data-field="lang" onchange="onLangChange(this,'${seg.id}')">${langOpts}</select>
    </div>
    <div>
      <div class="field-label">Voice</div>
      <select data-field="voice" id="voiceSel_${seg.id}">${voiceOpts}</select>
    </div>
    <div>
      <div class="field-label">Speed <span id="spd_${seg.id}" style="color:var(--accent2)">${seg.speed}×</span> → <span id="effspd_${seg.id}" style="color:var(--muted);font-size:.7rem">${effSpd}× eff</span></div>
      <div class="speed-row">
        <input type="range" min="0.5" max="2.0" step="0.05" value="${seg.speed}" data-field="speed" oninput="onSpeed(this,'${seg.id}')">
      </div>
    </div>
    <div class="emotion-row">
      <div class="field-label" style="width:100%;margin-bottom:0">Emotion</div>
      ${emotionPills}
    </div>
  </div>
  <div class="seg-text">
    <textarea data-field="text" placeholder="Enter dialogue or narration…" oninput="onTextInput(this,'${seg.id}')">${esc(seg.text)}</textarea>
    <div class="seg-footer">
      <div class="reorder-btns"></div>
      <div class="char-count" id="cc_${seg.id}">${seg.text.length} chars</div>
    </div>
  </div>`;
}

function initCard(card, seg) {
  // Sync inputs back to seg data
  card.querySelectorAll('[data-field]').forEach(el => {
    const field = el.dataset.field;
    if (el.tagName === 'INPUT' && el.type === 'text' || el.tagName === 'INPUT' && !el.type) {
      el.addEventListener('input', () => {
        seg[field] = el.value;
        if (field === 'character') updateDot(seg);
      });
    } else if (el.tagName === 'SELECT') {
      el.addEventListener('change', () => { seg[field] = el.value; });
    }
  });
}

function buildVoiceOpts(lang, selectedVoice) {
  const filtered = voices.filter(v => v.lang === lang);
  const list = filtered.length ? filtered : voices.filter(v => v.lang_code === 'a');
  return list.map(v =>
    `<option value="${v.id}" ${v.id === selectedVoice ? 'selected' : ''}>${v.id} — ${v.gender}, ${v.note}</option>`
  ).join('');
}

function buildLangOpts(selectedLang) {
  return Object.entries(languages).map(([k, v]) =>
    `<option value="${k}" ${k === selectedLang ? 'selected' : ''}>${v.name}</option>`
  ).join('');
}

function buildEmotionPills(selectedEmotion, segId) {
  return Object.entries(emotions).map(([key, em]) =>
    `<div class="em-pill${key === selectedEmotion ? ' active' : ''}" data-emotion="${key}" onclick="selectEmotion('${segId}','${key}',this)">
      ${em.icon} ${em.label}
    </div>`
  ).join('');
}

function updateDot(seg) {
  const color = charColor(seg.character);
  const dot = document.getElementById(`dot_${seg.id}`);
  if (dot) dot.style.background = color;
}

// ── Segment interactions ─────────────────────────────────────────────────────
function onLangChange(select, segId) {
  const seg = segments.find(s => s.id === segId);
  if (!seg) return;
  seg.lang = select.value;
  const voiceSel = document.getElementById(`voiceSel_${segId}`);
  const langInfo = languages[seg.lang] || {};
  voiceSel.innerHTML = buildVoiceOpts(seg.lang, langInfo.default_voice || seg.voice);
  seg.voice = voiceSel.value;
}

function onSpeed(input, segId) {
  const seg = segments.find(s => s.id === segId);
  if (!seg) return;
  seg.speed = parseFloat(input.value);
  document.getElementById(`spd_${segId}`).textContent = `${seg.speed.toFixed(2)}×`;
  updateEffSpeed(segId);
}

function updateEffSpeed(segId) {
  const seg = segments.find(s => s.id === segId);
  if (!seg) return;
  const em = emotions[seg.emotion] || {};
  const eff = (seg.speed * (em.speed_mult || 1)).toFixed(2);
  const el = document.getElementById(`effspd_${segId}`);
  if (el) el.textContent = `${eff}× eff`;
}

function selectEmotion(segId, key, pillEl) {
  const seg = segments.find(s => s.id === segId);
  if (!seg) return;
  seg.emotion = key;
  const card = document.getElementById(`card_${seg.id}`);
  card.querySelectorAll('.em-pill').forEach(p => p.classList.toggle('active', p.dataset.emotion === key));
  updateEffSpeed(segId);
}

function onTextInput(ta, segId) {
  const seg = segments.find(s => s.id === segId);
  if (seg) seg.text = ta.value;
  const cc = document.getElementById(`cc_${segId}`);
  if (cc) cc.textContent = ta.value.length + ' chars';
}

function removeSegment(segId) {
  segments = segments.filter(s => s.id !== segId);
  document.getElementById(`card_${segId}`)?.remove();
  renumberCards();
}

function moveUp(segId) {
  const idx = segments.findIndex(s => s.id === segId);
  if (idx <= 0) return;
  [segments[idx-1], segments[idx]] = [segments[idx], segments[idx-1]];
  rebuildComposer();
}

function moveDown(segId) {
  const idx = segments.findIndex(s => s.id === segId);
  if (idx < 0 || idx >= segments.length - 1) return;
  [segments[idx], segments[idx+1]] = [segments[idx+1], segments[idx]];
  rebuildComposer();
}

function rebuildComposer() {
  const composer = document.getElementById('composer');
  const addBtn = composer.querySelector('.btn-add');
  // remove all cards
  composer.querySelectorAll('.seg-card').forEach(c => c.remove());
  segments.forEach(seg => {
    const card = document.createElement('div');
    card.className = 'seg-card';
    card.id = `card_${seg.id}`;
    card.innerHTML = buildCardHTML(seg);
    composer.insertBefore(card, addBtn);
    initCard(card, seg);
  });
}

function renumberCards() {
  segments.forEach((seg, i) => {
    const card = document.getElementById(`card_${seg.id}`);
    const idxEl = card?.querySelector('.seg-idx');
    if (idxEl) idxEl.textContent = `#${i + 1}`;
  });
}

function scrollToAddBtn() {
  document.getElementById('composer').querySelector('.btn-add')
    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Production ───────────────────────────────────────────────────────────────
let producing = false;

async function produce() {
  if (producing) return;
  const validSegs = segments.filter(s => s.text.trim());
  if (!validSegs.length) { alert('Add some text first!'); return; }

  producing = true;
  setStatus('running', 'Producing…');
  document.getElementById('produceBtn').disabled = true;

  // Reset segment statuses
  segments.forEach(s => setSegStatus(s.id, 'pending', 'pending'));

  // Clear log (hide logEmpty BEFORE clearing innerHTML — it lives inside logArea)
  const logEmpty = document.getElementById('logEmpty');
  if (logEmpty) logEmpty.style.display = 'none';
  const logArea = document.getElementById('logArea');
  logArea.innerHTML = '';
  document.getElementById('progressWrap').style.display = 'block';
  document.getElementById('playerArea').style.display = 'none';

  setProgress(0, validSegs.length);

  // POST story
  const body = {
    title: document.getElementById('storyTitle').value || 'Untitled Story',
    segments: validSegs.map(s => ({
      id: s.id,
      character: s.character,
      text: s.text,
      voice: s.voice,
      lang: s.lang,
      emotion: s.emotion,
      speed: s.speed,
    })),
    silence_ms: parseInt(document.getElementById('silenceInput').value) || 500,
    output_format: document.getElementById('formatSelect').value,
  };

  let jobId;
  try {
    const r = await fetch(`${API}/api/produce`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const d = await r.json();
    if (d.error) throw new Error(d.error);
    jobId = d.job_id;
  } catch(e) {
    logEntry('error', '✗ Failed to start job', e.message);
    done(false);
    return;
  }

  // SSE stream
  const evtSrc = new EventSource(`${API}/api/produce/${jobId}/events`);
  let doneCount = 0;

  evtSrc.onmessage = (e) => {
    if (e.data === '[DONE]') { evtSrc.close(); done(true); return; }
    let msg;
    try { msg = JSON.parse(e.data); } catch { return; }

    const { event, data } = msg;

    if (event === 'start') {
      logEntry('info', `Started: "${data.title}"`, `${data.total} segments`);

    } else if (event === 'segment_start') {
      setSegStatus(data.character, 'running', 'running', validSegs);
      const color = charColor(data.character);
      logEntry('running', `${data.character}`, `${data.voice} · ${data.emotion_icon} ${data.emotion} · ${data.speed}× speed\n"${data.text_preview}"`, color);

    } else if (event === 'segment_done') {
      doneCount++;
      setProgress(doneCount, body.segments.length);
      updateLastLog('done', `${data.character}`, `${data.duration}s audio generated in ${data.gen_time}s (RTF ${data.rtf}×)`);

    } else if (event === 'combining') {
      logEntry('info', 'Stitching segments…', '');

    } else if (event === 'writing') {
      logEntry('info', `Writing ${data.format.toUpperCase()}…`, `${data.duration}s total`);

    } else if (event === 'done') {
      logEntry('done', '✓ Story complete!', `${data.duration}s · ${data.size_kb} KB · ${data.segments} segments`);
      setProgress(body.segments.length, body.segments.length);
      showPlayer(data);

    } else if (event === 'error') {
      logEntry('error', `Error in segment ${data.idx}`, data.message);
    }
  };

  evtSrc.onerror = () => {
    evtSrc.close();
    done(false);
  };
}

function done(success) {
  producing = false;
  document.getElementById('produceBtn').disabled = false;
  setStatus(success ? 'done' : 'error', success ? 'Done' : 'Error');
}

// ── UI helpers ───────────────────────────────────────────────────────────────
function setStatus(state, label) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot ' + state;
  document.getElementById('statusLabel').textContent = label;
}

function setProgress(done, total) {
  const pct = total > 0 ? Math.round(done / total * 100) : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${done} / ${total} segments`;
}

function setSegStatus(charOrId, cssClass, label, segsArr) {
  // Try by ID first, fallback by character name
  let seg = segments.find(s => s.id === charOrId);
  if (!seg && segsArr) seg = segsArr.find(s => s.character === charOrId);
  if (!seg) seg = segments.find(s => s.character === charOrId);
  if (!seg) return;
  const el = document.getElementById(`status_${seg.id}`);
  if (el) { el.className = 'seg-status ' + cssClass; el.textContent = label; }
}

let _lastLogEl = null;
function logEntry(type, title, meta, color) {
  const el = document.createElement('div');
  el.className = `log-entry ${type}`;
  const dot = color ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:4px;flex-shrink:0;margin-top:3px"></span>` : '';
  el.innerHTML = `
    <div class="log-icon"></div>
    <div class="log-body">
      <div class="log-char">${dot}${esc(title)}</div>
      ${meta ? `<div class="log-meta">${esc(meta)}</div>` : ''}
    </div>`;
  document.getElementById('logArea').appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  _lastLogEl = el;
}

function updateLastLog(type, title, meta) {
  if (!_lastLogEl) return;
  _lastLogEl.className = `log-entry ${type}`;
  _lastLogEl.querySelector('.log-char').textContent = title;
  const metaEl = _lastLogEl.querySelector('.log-meta');
  if (metaEl && meta) metaEl.textContent = meta;
}

function showPlayer(data) {
  const area = document.getElementById('playerArea');
  area.style.display = 'block';
  document.getElementById('playerTitle').textContent = data.title;
  document.getElementById('playerMeta').innerHTML = `
    <span class="player-badge">⏱ ${data.duration}s</span>
    <span class="player-badge">📦 ${data.size_kb} KB</span>
    <span class="player-badge">🎙 ${data.segments} segments</span>
    <span class="player-badge">FLAC</span>
  `;
  const audio = document.getElementById('audioPlayer');
  audio.src = data.url;
  audio.play();
  const dl = document.getElementById('dlLink');
  dl.href = data.url;
  dl.download = data.filename;
  area.scrollIntoView({ behavior: 'smooth' });
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,' ');
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), duration);
}

// ── Export ──────────────────────────────────────────────────────────────────
async function exportStory() {
  const validSegs = segments.filter(s => s.text.trim());
  if (!validSegs.length) { alert('No segments to export.'); return; }

  const body = {
    title: document.getElementById('storyTitle').value || 'Untitled Story',
    segments: validSegs.map(s => ({
      id: s.id,
      character: s.character,
      text: s.text,
      voice: s.voice,
      lang: s.lang,
      emotion: s.emotion,
      speed: s.speed,
    })),
    silence_ms: parseInt(document.getElementById('silenceInput').value) || 500,
    output_format: document.getElementById('formatSelect').value,
  };

  try {
    const r = await fetch(`${API}/api/export`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    const data = await r.json();
    if (data.error) { alert('Export failed: ' + data.error); return; }

    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const slug = (data.title || 'story').toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.story.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${validSegs.length} segments`);
  } catch(e) {
    alert('Export failed: ' + e.message);
  }
}

// ── Import ──────────────────────────────────────────────────────────────────
function importStory(input) {
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';  // reset so same file can be re-imported

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const project = JSON.parse(e.target.result);
      if (project.version !== '1.0') {
        alert('Unsupported story file version: ' + project.version);
        return;
      }
      if (!project.segments || !project.segments.length) {
        alert('Story file has no segments.');
        return;
      }

      // Clear existing segments
      segments = [];
      segCounter = 0;
      charColorMap.length = 0;  // reset color map — actually it's an object, not array
      Object.keys(charColorMap).forEach(k => delete charColorMap[k]);

      document.querySelectorAll('.seg-card').forEach(c => c.remove());

      // Set title
      document.getElementById('storyTitle').value = project.title || 'Untitled Story';

      // Set settings
      if (project.silence_ms) document.getElementById('silenceInput').value = project.silence_ms;
      if (project.output_format) document.getElementById('formatSelect').value = project.output_format;

      // Load segments
      project.segments.forEach(seg => {
        addSegment({
          character: seg.character || 'Character',
          voice: seg.voice || 'af_heart',
          lang: seg.lang || 'en-us',
          emotion: seg.emotion || 'neutral',
          speed: seg.speed || 1.0,
          text: seg.text || '',
        });
      });

      showToast(`Imported "${project.title}" — ${project.segments.length} segments`);
    } catch(err) {
      alert('Failed to parse story file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

boot();
</script>
<div class="toast" id="toast"></div>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
def index():
    return HTML


@app.post("/api/books/{name}/scan")
def api_scan_chapters(name: str):
    chapters = _bm.scan_chapters(name)
    return {"chapters": chapters}


_BOOK_HTML_PATH = Path(__file__).parent / "book_browser.html"


@app.get("/books", response_class=HTMLResponse)
def book_browser():
    return _BOOK_HTML_PATH.read_text(encoding="utf-8")


# ── Entry ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 7861))
    print(f"\n  MLX TTS Story Studio → http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="warning")
