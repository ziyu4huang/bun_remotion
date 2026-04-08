"""
mlx-tts CLI — generate high-quality local TTS on Apple Silicon.

Examples:
    python -m mlx_tts speak "Hello world!"
    python -m mlx_tts save "Hello world!" -o outputs/hello.wav
    python -m mlx_tts save "Hello world!" --voice af_sarah --speed 1.1
    python -m mlx_tts batch texts.txt --voice bm_george -o outputs/
    python -m mlx_tts voices
    python -m mlx_tts voices --gender female --accent british
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .voices import list_voices, KOKORO_VOICES, DEFAULT_VOICE
from .generator import TTSGenerator, DEFAULT_MODEL


def cmd_speak(args):
    gen = TTSGenerator(
        model_id=args.model,
        default_voice=args.voice,
        default_speed=args.speed,
        verbose=not args.quiet,
    )
    gen.speak(args.text, lang_code=args.lang)


def cmd_save(args):
    gen = TTSGenerator(
        model_id=args.model,
        default_voice=args.voice,
        default_speed=args.speed,
        verbose=not args.quiet,
    )
    out = args.output or "outputs/output.wav"
    gen.save(args.text, output_path=out, lang_code=args.lang, audio_format=args.format)


def cmd_batch(args):
    txt_path = Path(args.file)
    if not txt_path.exists():
        print(f"Error: file not found: {txt_path}", file=sys.stderr)
        sys.exit(1)

    texts = [line.strip() for line in txt_path.read_text().splitlines() if line.strip()]
    if not texts:
        print("Error: no text lines found in file.", file=sys.stderr)
        sys.exit(1)

    print(f"Generating {len(texts)} audio file(s)...")
    gen = TTSGenerator(
        model_id=args.model,
        default_voice=args.voice,
        default_speed=args.speed,
        verbose=not args.quiet,
    )
    paths = gen.batch_save(
        texts,
        output_dir=args.output or "outputs",
        lang_code=args.lang,
        audio_format=args.format,
        prefix=args.prefix,
    )
    print(f"\nDone. {len(paths)} file(s) saved to {args.output or 'outputs/'}")


def cmd_voices(args):
    voices = list_voices(
        gender=args.gender if hasattr(args, "gender") else None,
        accent=args.accent if hasattr(args, "accent") else None,
    )
    print(f"\n{'ID':<14} {'Gender':<8} {'Accent':<10} Note")
    print("-" * 58)
    for vid, meta in voices.items():
        marker = " *" if vid == DEFAULT_VOICE else ""
        print(f"{vid:<14} {meta['gender']:<8} {meta['accent']:<10} {meta['note']}{marker}")
    print(f"\n* = default voice  |  Total: {len(voices)}")


def build_parser():
    parser = argparse.ArgumentParser(
        prog="python -m mlx_tts",
        description="High-quality local TTS on Apple Silicon using MLX + Kokoro",
    )

    # Shared options injected into sub-commands
    shared = argparse.ArgumentParser(add_help=False)
    shared.add_argument("--model", default=DEFAULT_MODEL, help="HuggingFace model ID or local path")
    shared.add_argument("--voice", default=DEFAULT_VOICE, help=f"Voice ID (default: {DEFAULT_VOICE})")
    shared.add_argument("--speed", type=float, default=1.0, help="Speech speed multiplier (default: 1.0)")
    shared.add_argument("--lang", default="en-us", help="Language code (default: en-us)")
    shared.add_argument("--format", choices=["wav", "flac"], default="wav", help="Output audio format")
    shared.add_argument("-q", "--quiet", action="store_true", help="Suppress progress output")

    sub = parser.add_subparsers(dest="command", required=True)

    # --- speak ---
    p_speak = sub.add_parser("speak", parents=[shared], help="Synthesize text and play through speakers")
    p_speak.add_argument("text", help="Text to synthesize")
    p_speak.set_defaults(func=cmd_speak)

    # --- save ---
    p_save = sub.add_parser("save", parents=[shared], help="Synthesize text and save to a file")
    p_save.add_argument("text", help="Text to synthesize")
    p_save.add_argument("-o", "--output", default=None, help="Output file path (default: outputs/output.wav)")
    p_save.set_defaults(func=cmd_save)

    # --- batch ---
    p_batch = sub.add_parser("batch", parents=[shared], help="Synthesize multiple lines from a text file")
    p_batch.add_argument("file", help="Text file — one sentence per line")
    p_batch.add_argument("-o", "--output", default="outputs", help="Output directory (default: outputs/)")
    p_batch.add_argument("--prefix", default="tts", help="Filename prefix (default: tts)")
    p_batch.set_defaults(func=cmd_batch)

    # --- voices ---
    p_voices = sub.add_parser("voices", help="List available voices")
    p_voices.add_argument("--gender", choices=["male", "female"], help="Filter by gender")
    p_voices.add_argument("--accent", choices=["american", "british"], help="Filter by accent")
    p_voices.set_defaults(func=cmd_voices)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
