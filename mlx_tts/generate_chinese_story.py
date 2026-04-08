"""
Generate Chinese short story audio using Kokoro-82M via TTSGenerator API.
"""

import time
from pathlib import Path

import mlx.core as mx
import numpy as np
import soundfile as sf
import subprocess

from mlx_tts import TTSGenerator

STORY_FILE  = "chinese_story.txt"
OUTPUT_WAV  = "outputs/chinese_story.wav"
OUTPUT_OPUS = "outputs/chinese_story.opus"
VOICE       = "zf_xiaobei"   # Mandarin female
SPEED       = 0.92           # Slightly slower — suits narrative prose
SILENCE_MS  = 500            # Gap between paragraphs


def wav_to_opus(wav_path: str, opus_path: str, bitrate: str = "48k"):
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path,
         "-c:a", "libopus", "-b:a", bitrate,
         "-vbr", "on", "-compression_level", "10",
         "-application", "audio",
         opus_path],
        check=True, capture_output=True,
    )


def main():
    story = Path(STORY_FILE).read_text(encoding="utf-8").strip()
    paragraphs = [p.strip() for p in story.split("\n\n") if p.strip()]

    print(f"Story: 《最後一盞燈》")
    print(f"Paragraphs: {len(paragraphs)}")
    print(f"Voice: {VOICE}  Speed: {SPEED}x\n")

    gen = TTSGenerator(
        default_voice=VOICE,
        default_speed=SPEED,
        verbose=False,   # we'll print our own progress
    )

    # Force model load once up front
    gen._load()

    silence = np.zeros(int(24000 * SILENCE_MS / 1000), dtype=np.float32)
    chunks = []
    total_audio_s = 0.0
    t_wall = time.perf_counter()

    for i, para in enumerate(paragraphs, 1):
        preview = para[:40] + "…" if len(para) > 40 else para
        print(f"[{i:2d}/{len(paragraphs)}] {preview}")

        # Use the internal generate method so we get raw numpy back
        audio_np, sr = gen._generate_audio(para, VOICE, SPEED, lang_code="zh")
        chunk = np.array(audio_np, copy=False).flatten().astype(np.float32)
        dur = len(chunk) / sr
        total_audio_s += dur
        print(f"          {dur:.1f}s")

        chunks.append(chunk)
        if i < len(paragraphs):
            chunks.append(silence)

        mx.clear_cache()

    wall = time.perf_counter() - t_wall
    full_audio = np.concatenate(chunks)

    Path(OUTPUT_WAV).parent.mkdir(parents=True, exist_ok=True)
    sf.write(OUTPUT_WAV, full_audio, 24000)

    wav_kb = Path(OUTPUT_WAV).stat().st_size / 1024
    print(f"\n{'─'*50}")
    print(f"Duration   : {total_audio_s:.1f}s  ({total_audio_s/60:.1f} min)")
    print(f"Wall time  : {wall:.1f}s")
    print(f"RTF        : {wall/total_audio_s:.2f}x")
    print(f"WAV size   : {wav_kb:.0f} KB")

    # Compress to Opus
    try:
        wav_to_opus(OUTPUT_WAV, OUTPUT_OPUS, bitrate="48k")
        opus_kb = Path(OUTPUT_OPUS).stat().st_size / 1024
        print(f"Opus size  : {opus_kb:.0f} KB  ({100*(1-opus_kb/wav_kb):.0f}% smaller)")
    except Exception as e:
        print(f"Opus encode failed: {e}")

    print(f"\nSaved:")
    print(f"  {OUTPUT_WAV}")
    print(f"  {OUTPUT_OPUS}")


if __name__ == "__main__":
    main()
