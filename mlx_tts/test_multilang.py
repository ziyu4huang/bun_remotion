"""
Multi-language TTS quality test — Kokoro-82M on M1 8GB
Languages: English (US + GB), Traditional Chinese, Japanese, German

Also demonstrates post-processing: WAV → FLAC (lossless) + Opus (tiny, speech-optimized)
"""

import subprocess
import time
from pathlib import Path

import mlx.core as mx
import numpy as np
import soundfile as sf

from mlx_audio.tts import load as load_tts

# ── Stories per language ─────────────────────────────────────────────────────
TESTS = [
    {
        "id":       "en_us",
        "lang":     "a",            # American English
        "voice":    "af_heart",
        "label":    "English (US) — af_heart",
        "text": (
            "The lighthouse stood at the edge of the world, "
            "where the sea met the sky in a grey, endless embrace. "
            "Every night, its beam swept the darkness — "
            "a promise to all who sailed: you are not alone."
        ),
    },
    {
        "id":       "en_gb",
        "lang":     "b",            # British English
        "voice":    "bm_george",
        "label":    "English (GB) — bm_george",
        "text": (
            "Quite extraordinary, this machine. "
            "One speaks into the void, and back comes a voice — "
            "calm, measured, distinctly British. "
            "Rather like having a narrator read one's life aloud."
        ),
    },
    {
        "id":       "zh_tw",
        "lang":     "z",            # Mandarin Chinese (Traditional characters work fine)
        "voice":    "zf_xiaobei",   # Mandarin female voice
        "label":    "Traditional Chinese — zf_xiaobei",
        "text": (
            "燈塔矗立在世界的邊緣，"
            "海與天在那裡以灰色無盡的擁抱相遇。"
            "每個夜晚，它的光束掃過黑暗——"
            "對所有航行者的承諾：你並不孤單。"
        ),
    },
    {
        "id":       "ja",
        "lang":     "j",            # Japanese
        "voice":    "jf_alpha",     # Japanese female voice
        "label":    "Japanese — jf_alpha",
        "text": (
            "灯台は世界の果てに立っていた。"
            "海と空が灰色の抱擁で出会う場所に。"
            "毎晩、その光線が暗闇を照らした——"
            "航海するすべての人への約束：あなたは一人ではない。"
        ),
    },
    {
        "id":       "es",
        "lang":     "e",            # Spanish via espeak-ng
        "voice":    "af_heart",     # English voice — Kokoro has no native Spanish voice
        "label":    "Spanish — espeak-ng G2P",
        "text": (
            "El faro se alzaba al borde del mundo, "
            "donde el mar y el cielo se encontraban en un abrazo gris e infinito. "
            "Cada noche, su haz de luz barría la oscuridad — "
            "una promesa para todos los que navegaban: no estás solo."
        ),
    },
    # NOTE: German is NOT a native Kokoro language. The model supports:
    # a=en-US, b=en-GB, e=Spanish, f=French, h=Hindi, i=Italian,
    # p=Portuguese-BR, j=Japanese, z=Mandarin Chinese.
    # German would require a different model (e.g. Piper-TTS de_DE voices).

]

OUTPUT_DIR = Path("outputs/multilang")
MODEL_ID   = "mlx-community/Kokoro-82M-bf16"
SAMPLE_RATE = 24000


# ── Audio post-processing ────────────────────────────────────────────────────

def wav_to_flac(wav_path: Path) -> Path:
    """Lossless compression: ~50% smaller, identical quality."""
    out = wav_path.with_suffix(".flac")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path), "-compression_level", "8", str(out)],
        check=True, capture_output=True,
    )
    return out


def wav_to_opus(wav_path: Path, bitrate: str = "32k") -> Path:
    """
    Opus at 32 kbps — optimised for speech.
    Sounds nearly identical to WAV for voice, ~96% smaller than WAV.
    """
    out = wav_path.with_suffix(".opus")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(wav_path),
         "-c:a", "libopus", "-b:a", bitrate,
         "-vbr", "on", "-compression_level", "10",
         "-application", "voip",          # speech-optimized Opus mode
         str(out)],
        check=True, capture_output=True,
    )
    return out


def size_kb(path: Path) -> float:
    return path.stat().st_size / 1024


def format_size(kb: float) -> str:
    if kb >= 1024:
        return f"{kb/1024:.1f} MB"
    return f"{kb:.0f} KB"


# ── Main ─────────────────────────────────────────────────────────────────────

def generate_one(model, test: dict) -> tuple[np.ndarray, float]:
    """Returns (audio_np, wall_seconds)."""
    chunks = []
    t0 = time.perf_counter()
    for result in model.generate(
        text=test["text"],
        voice=test["voice"],
        speed=1.0,
        lang_code=test["lang"],
    ):
        chunks.append(np.array(result.audio, copy=False).flatten().astype(np.float32))
        print(f"    segment {result.segment_idx}: {result.audio_duration}  "
              f"RTF {result.real_time_factor}x  mem {result.peak_memory_usage:.2f}GB")
    elapsed = time.perf_counter() - t0
    mx.clear_cache()
    return np.concatenate(chunks) if len(chunks) > 1 else chunks[0], elapsed


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading model: {MODEL_ID}")
    model = load_tts(MODEL_ID)
    print("Model ready.\n")

    print("=" * 62)
    print(f"{'LANG':<22} {'DUR':>6} {'GEN':>6} {'RTF':>6}  {'WAV':>7} {'FLAC':>7} {'OPUS':>7}")
    print("=" * 62)

    summary_rows = []

    for test in TESTS:
        print(f"\n▶  {test['label']}")
        print(f"   \"{test['text'][:70]}…\"" if len(test['text']) > 70 else f"   \"{test['text']}\"")

        try:
            audio_np, gen_time = generate_one(model, test)
        except Exception as exc:
            print(f"   ✗  FAILED: {exc}")
            summary_rows.append((test["label"], "—", "—", "—", "—", "—", "—"))
            continue

        # Save WAV
        wav_path = OUTPUT_DIR / f"{test['id']}.wav"
        sf.write(str(wav_path), audio_np, SAMPLE_RATE)

        dur = len(audio_np) / SAMPLE_RATE
        rtf = gen_time / dur if dur > 0 else 0

        # Post-process
        try:
            flac_path = wav_to_flac(wav_path)
        except Exception:
            flac_path = None

        try:
            opus_path = wav_to_opus(wav_path, bitrate="32k")
        except Exception:
            opus_path = None

        wav_kb  = size_kb(wav_path)
        flac_kb = size_kb(flac_path)  if flac_path  else 0
        opus_kb = size_kb(opus_path)  if opus_path  else 0

        print(f"\n   Duration  : {dur:.1f}s")
        print(f"   Gen time  : {gen_time:.1f}s  (RTF {rtf:.2f}x)")
        print(f"   WAV       : {format_size(wav_kb)}")
        print(f"   FLAC      : {format_size(flac_kb)}  ({100*(1-flac_kb/wav_kb):.0f}% smaller)")
        print(f"   Opus 32k  : {format_size(opus_kb)}  ({100*(1-opus_kb/wav_kb):.0f}% smaller)")

        summary_rows.append((
            test["label"],
            f"{dur:.1f}s",
            f"{gen_time:.1f}s",
            f"{rtf:.2f}x",
            format_size(wav_kb),
            format_size(flac_kb) if flac_path else "—",
            format_size(opus_kb) if opus_path else "—",
        ))

    # ── Summary table ─────────────────────────────────────────────────────
    print(f"\n{'=' * 62}")
    print(f"SUMMARY\n{'─' * 62}")
    print(f"{'Language':<22} {'Dur':>6} {'Gen':>6} {'RTF':>6}  {'WAV':>7} {'FLAC':>7} {'Opus':>7}")
    print(f"{'─' * 62}")
    for row in summary_rows:
        print(f"{row[0]:<22} {row[1]:>6} {row[2]:>6} {row[3]:>6}  {row[4]:>7} {row[5]:>7} {row[6]:>7}")
    print(f"{'─' * 62}")
    print(f"\nFiles saved to: {OUTPUT_DIR}/")
    print("\nFormat guide:")
    print("  WAV  — uncompressed, maximum compatibility, largest file")
    print("  FLAC — lossless, ~50% smaller, identical quality")
    print("  Opus — lossy speech codec, ~95% smaller, near-identical for voice")


if __name__ == "__main__":
    main()
