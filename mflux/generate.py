#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "mflux",
# ]
# ///

"""Simple image generation using mflux – tuned for M1 8G."""

from mflux.models.common.config import ModelConfig
from mflux.models.flux2.variants import Flux2Klein
from mflux.callbacks.instances.memory_saver import MemorySaver
import argparse, os, sys

def main():
    parser = argparse.ArgumentParser(description="mflux image generator (M1 8G optimized)")
    parser.add_argument("--prompt", "-p", type=str, required=True,
                        help="Text prompt for image generation")
    parser.add_argument("--model", "-m", type=str, default="flux2-klein-4b",
                        choices=["flux2-klein-4b", "flux2-klein-9b", "z-image-turbo"],
                        help="Model variant (default: flux2-klein-4b for M1 8G)")
    parser.add_argument("--quantize", "-q", type=int, default=4,
                        choices=[3, 4, 5, 6, 8],
                        help="Quantization bits (default: 4 – lowest memory)")
    parser.add_argument("--steps", "-s", type=int, default=4,
                        help="Inference steps (fewer = faster, default: 4)")
    parser.add_argument("--width", "-W", type=int, default=512,
                        help="Image width (default: 512 for M1 8G)")
    parser.add_argument("--height", "-H", type=int, default=512,
                        help="Image height (default: 512 for M1 8G)")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducibility")
    parser.add_argument("--output", "-o", type=str, default="output.png",
                        help="Output file path")
    parser.add_argument("--low-ram", action="store_true", default=True,
                        help="Enable low-RAM mode (VAE tiling, offload)")
    parser.add_argument("--mlx-cache-limit-gb", type=float, default=2.0,
                        help="MLX cache limit in GB (default: 2.0 for M1 8G)")

    args = parser.parse_args()

    # M1-8G guard-rails
    max_pixels = 512 * 512
    requested = args.width * args.height
    if requested > max_pixels:
        print(f"Warning: {args.width}x{args.height}={requested}px exceeds M1-8G safe limit {max_pixels}px. Clamping to 512x512.")
        args.width, args.height = 512, 512

    if args.quantize > 4:
        print(f"Tip: use --quantize 4 instead of {args.quantize} to save RAM on M1 8G.")

    try:
        mem_bytes = os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES')
        total_gb = mem_bytes / (1024 ** 3)
        if total_gb < 12:
            print(f"Detected {total_gb:.1f}GB unified memory — sticking with low-ram mode.")
            args.low_ram = True
    except Exception:
        pass

    # Model selection
    model_map = {
        "flux2-klein-4b": ModelConfig.flux2_klein_4b,
        "flux2-klein-9b": ModelConfig.flux2_klein_9b,
        "z-image-turbo":  ModelConfig.z_image_turbo,
    }
    model_config_fn = model_map[args.model]

    print(f"Generating image...")
    print(f"  Model:     {args.model}")
    print(f"  Prompt:    {args.prompt}")
    print(f"  Size:      {args.width}x{args.height}")
    print(f"  Steps:     {args.steps}")
    print(f"  Quantize:  {args.quantize}-bit")
    print(f"  Low-RAM:   {args.low_ram}")
    print(f"  MLX cache: {args.mlx_cache_limit_gb} GB")

    if args.model.startswith("flux2"):
        model = Flux2Klein(
            model_config=model_config_fn(),
            quantize=args.quantize,
        )
    else:
        from mflux.models.z_image import ZImageTurbo
        model = ZImageTurbo(
            model_config=model_config_fn(),
            quantize=args.quantize,
        )

    model.callbacks.register(
        MemorySaver(model=model, keep_transformer=False)
    )

    image = model.generate_image(
        seed=args.seed,
        prompt=args.prompt,
        num_inference_steps=args.steps,
        width=args.width,
        height=args.height,
    )

    image.save(args.output)
    print(f"Image saved to: {args.output}")

if __name__ == "__main__":
    main()
