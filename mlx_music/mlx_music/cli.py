"""
mlx-music CLI — generate music locally on Apple Silicon using MusicGen + MLX.

Examples:
    python -m mlx_music generate "a chill lo-fi beat with soft piano"
    python -m mlx_music generate "epic orchestral" -d 60 -o outputs/epic.mp3
    python -m mlx_music play "jazz piano solo"
    python -m mlx_music batch prompts.txt -o outputs/
    python -m mlx_music preset lofi -d 60 -o lofi.mp3
    python -m mlx_music presets
    python -m mlx_music models
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .generator import MusicGenerator, DEFAULT_MODEL, MODELS, PRESETS

# Supported output formats
FORMATS = ["wav", "mp3", "ogg", "m4a", "flac"]


def cmd_generate(args):
    gen = MusicGenerator(
        model_name=args.model,
        verbose=not args.quiet,
        duration=args.duration,
        temperature=args.temperature,
        top_k=args.top_k,
        cfg_coef=args.cfg_coef,
    )
    out = args.output or f"outputs/output.{args.format}"
    gen.save(
        args.prompt,
        output_path=out,
        duration=args.duration,
        temperature=args.temperature,
        top_k=args.top_k,
        cfg_coef=args.cfg_coef,
        bitrate=args.bitrate,
    )


def cmd_play(args):
    gen = MusicGenerator(
        model_name=args.model,
        verbose=not args.quiet,
        duration=args.duration,
        temperature=args.temperature,
        top_k=args.top_k,
        cfg_coef=args.cfg_coef,
    )
    gen.play(
        args.prompt,
        duration=args.duration,
        temperature=args.temperature,
        top_k=args.top_k,
        cfg_coef=args.cfg_coef,
    )


def cmd_batch(args):
    txt_path = Path(args.file)
    if not txt_path.exists():
        print(f"Error: file not found: {txt_path}", file=sys.stderr)
        sys.exit(1)

    prompts = [line.strip() for line in txt_path.read_text().splitlines() if line.strip()]
    if not prompts:
        print("Error: no prompts found in file.", file=sys.stderr)
        sys.exit(1)

    print(f"Generating {len(prompts)} music file(s)...")
    gen = MusicGenerator(
        model_name=args.model,
        verbose=not args.quiet,
        duration=args.duration,
        temperature=args.temperature,
        top_k=args.top_k,
        cfg_coef=args.cfg_coef,
    )
    paths = gen.batch_save(
        prompts,
        output_dir=args.output or "outputs",
        duration=args.duration,
        temperature=args.temperature,
        top_k=args.top_k,
        cfg_coef=args.cfg_coef,
        prefix=args.prefix,
        bitrate=args.bitrate,
    )
    print(f"\nDone. {len(paths)} file(s) saved to {args.output or 'outputs/'}")


def cmd_preset(args):
    gen = MusicGenerator(
        model_name=args.model,
        verbose=not args.quiet,
        duration=args.duration or 8.0,
    )
    ext = args.format
    out = args.output or f"outputs/{args.name}.{ext}"
    gen.from_preset(
        args.name,
        output_path=out,
        duration=args.duration,
        bitrate=args.bitrate,
    )


def cmd_presets(args):
    print("\nAvailable presets:")
    print(f"  {'Name':<14} {'Prompt'}")
    print("  " + "-" * 70)
    for name, prompt in PRESETS.items():
        print(f"  {name:<14} {prompt}")
    print()


def cmd_models(args):
    print("\nAvailable models:")
    print(f"  {'Name':<16} {'HuggingFace ID'}")
    print("  " + "-" * 60)
    for name, hf_id in MODELS.items():
        marker = " (default)" if hf_id == DEFAULT_MODEL else ""
        print(f"  {name:<16} {hf_id}{marker}")
    print(f"\nYou can also pass a full HuggingFace model ID directly.")
    print()


def build_parser():
    parser = argparse.ArgumentParser(
        prog="python -m mlx_music",
        description="Generate music locally on Apple Silicon using MusicGen + MLX",
    )

    # Shared options
    shared = argparse.ArgumentParser(add_help=False)
    shared.add_argument(
        "--model", default="small",
        help="Model name (small/medium/large/stereo-*) or full HuggingFace ID (default: small)",
    )
    shared.add_argument("-d", "--duration", type=float, default=8.0, help="Duration in seconds (default: 8)")
    shared.add_argument("--temperature", type=float, default=1.0, help="Sampling temperature (default: 1.0)")
    shared.add_argument("--top-k", type=int, default=250, help="Top-k sampling (default: 250)")
    shared.add_argument("--cfg-coef", type=float, default=3.0, help="Classifier-free guidance coefficient (default: 3.0)")
    shared.add_argument("--format", choices=FORMATS, default="mp3", help="Output format (default: mp3)")
    shared.add_argument("--bitrate", default="128k", help="Bitrate for lossy formats (default: 128k)")
    shared.add_argument("-q", "--quiet", action="store_true", help="Suppress progress output")

    sub = parser.add_subparsers(dest="command", required=True)

    # --- generate ---
    p_gen = sub.add_parser("generate", parents=[shared], help="Generate music and save to file")
    p_gen.add_argument("prompt", help="Text description of the music")
    p_gen.add_argument("-o", "--output", default=None, help="Output file path (format auto-detected from extension)")
    p_gen.set_defaults(func=cmd_generate)

    # --- play ---
    p_play = sub.add_parser("play", parents=[shared], help="Generate music and play through speakers")
    p_play.add_argument("prompt", help="Text description of the music")
    p_play.set_defaults(func=cmd_play)

    # --- batch ---
    p_batch = sub.add_parser("batch", parents=[shared], help="Generate from multiple prompts in a text file")
    p_batch.add_argument("file", help="Text file — one prompt per line")
    p_batch.add_argument("-o", "--output", default="outputs", help="Output directory (default: outputs/)")
    p_batch.add_argument("--prefix", default="music", help="Filename prefix (default: music)")
    p_batch.set_defaults(func=cmd_batch)

    # --- preset ---
    p_preset = sub.add_parser("preset", parents=[shared], help="Generate from a named preset")
    p_preset.add_argument("name", help=f"Preset name: {', '.join(PRESETS.keys())}")
    p_preset.add_argument("-o", "--output", default=None, help="Output file path")
    p_preset.set_defaults(func=cmd_preset)

    # --- presets ---
    p_presets = sub.add_parser("presets", help="List available presets")
    p_presets.set_defaults(func=cmd_presets)

    # --- models ---
    p_models = sub.add_parser("models", help="List available models")
    p_models.set_defaults(func=cmd_models)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
