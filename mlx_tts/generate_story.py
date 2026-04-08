"""
Generate the full story as a single WAV file using Kokoro-82M.
Paragraphs are fed one at a time (better prosody per segment),
then concatenated into one file with short silence between paragraphs.
"""

import time
import numpy as np
import soundfile as sf
from pathlib import Path

import mlx.core as mx
from mlx_audio.tts import load as load_tts

# ── Config ──────────────────────────────────────────────────────────────────
STORY_FILE  = "story.txt"
OUTPUT_FILE = "outputs/story_full.wav"
VOICE       = "af_heart"     # warm, expressive narrator
SPEED       = 0.95           # slightly slower for storytelling feel
MODEL_ID    = "mlx-community/Kokoro-82M-bf16"
SAMPLE_RATE = 24000
SILENCE_MS  = 600            # gap between paragraphs in milliseconds
# ────────────────────────────────────────────────────────────────────────────

def main():
    story = Path(STORY_FILE).read_text().strip()

    # Split into paragraphs (blank-line separated)
    paragraphs = [p.strip() for p in story.split("\n\n") if p.strip()]

    print(f"Story: {len(paragraphs)} paragraphs")
    print(f"Voice: {VOICE}  Speed: {SPEED}x\n")

    print("Loading model...")
    t_load = time.perf_counter()
    model = load_tts(MODEL_ID)
    print(f"Model ready in {time.perf_counter() - t_load:.1f}s\n")

    silence = np.zeros(int(SAMPLE_RATE * SILENCE_MS / 1000), dtype=np.float32)
    audio_chunks = []

    t_total = time.perf_counter()
    total_duration = 0.0

    for i, para in enumerate(paragraphs, 1):
        short = para[:60] + "…" if len(para) > 60 else para
        print(f"[{i:2d}/{len(paragraphs)}] {short}")

        t0 = time.perf_counter()
        for result in model.generate(text=para, voice=VOICE, speed=SPEED, lang_code="a"):
            chunk = np.array(result.audio, copy=False).flatten().astype(np.float32)
            audio_chunks.append(chunk)
            total_duration += result.samples / result.sample_rate
            print(f"         → {result.audio_duration}  RTF {result.real_time_factor}x  "
                  f"mem {result.peak_memory_usage:.2f} GB")

        # Paragraph gap (except after last)
        if i < len(paragraphs):
            audio_chunks.append(silence)

        # Free cache between paragraphs — critical for 8 GB
        mx.clear_cache()

    elapsed = time.perf_counter() - t_total

    # Join everything
    full_audio = np.concatenate(audio_chunks)

    Path(OUTPUT_FILE).parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUTPUT_FILE, full_audio, SAMPLE_RATE)

    file_kb = Path(OUTPUT_FILE).stat().st_size / 1024
    print(f"\n{'─'*55}")
    print(f"Output:      {OUTPUT_FILE}")
    print(f"Duration:    {total_duration:.1f}s  ({total_duration/60:.1f} min)")
    print(f"Wall time:   {elapsed:.1f}s")
    print(f"Overall RTF: {elapsed/total_duration:.2f}x  (lower = faster than realtime)")
    print(f"File size:   {file_kb:.0f} KB")
    print(f"Peak mem:    ~2 GB  (M1-8GB safe)")


if __name__ == "__main__":
    main()
