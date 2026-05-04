# PLAN.md — mflux Image Generation Pipeline (M1 8G)

## Overview

Local AI image generation pipeline using [mflux](https://github.com/filipstrand/mflux) — an MLX-native port of FLUX/Z-Image models optimized for Apple Silicon. Runs entirely on-device, no cloud API or GPU server required.

## Architecture

```
mflux/
├── PLAN.md            ← This file — architecture & reproduction guide
├── TODO.md            ← Optimization backlog
├── NEXT.md            ← Next actions & priorities
├── generate.py        ← Python generation script (uv run --script)
├── run.sh             ← Shell wrapper (delegates to mflux-generate-flux2 CLI)
└── output*.png        ← Generated images
```

### Two Execution Paths

| Path | Command | Use case |
|------|---------|----------|
| **CLI (recommended)** | `mflux-generate-flux2` | Reliable, auto-handles model loading, memory callbacks |
| **Python script** | `uv run --script generate.py` | Programmatic, customizable guard-rails |

The CLI path is preferred because mflux's internal callback system (memory saving, low-ram mode) is wired through its CLI argument parser. The Python script wraps the same models but may need API adjustments across mflux versions.

## Reproduction Steps (clean machine)

### 1. Prerequisites

- macOS Apple Silicon (M1/M2/M3/M4)
- ~15 GB free disk (model cache)
- `uv` installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`

### 2. Install mflux

```bash
uv tool install --upgrade mflux --with hf_transfer
```

This installs 29 CLI executables including `mflux-generate-flux2` and `mflux-generate-z-image-turbo`. The `--with hf_transfer` flag enables fast Hugging Face downloads.

### 3. Verify installation

```bash
which mflux-generate-flux2
mflux-generate-flux2 --help
```

### 4. First generation (downloads model ~13 GB)

```bash
mflux-generate-flux2 \
  --model flux2-klein-4b \
  --prompt "a simple red circle on white background" \
  --steps 4 --width 512 --height 512 \
  --quantize 4 --low-ram \
  --mlx-cache-limit-gb 2.0 \
  --output output.png
```

### 5. Subsequent runs

Model is cached in `~/.cache/huggingface/hub/models--black-forest-labs--FLUX.2-klein-4B/`. Subsequent runs skip download (~51s generation time on M1 8G).

## Model Selection (M1 8G)

| Model | Params | Quantize | Steps | Time (M1 8G) | Peak MLX Memory | Quality |
|-------|--------|----------|-------|--------------|-----------------|---------|
| **flux2-klein-4b** | 4B | 4-bit | 4 | ~51s | 4.83 GB | Good |
| flux2-klein-9b | 9B | 4-bit | 4 | ~2-3 min (est.) | ~6-7 GB (est.) | Better |
| z-image-turbo | 6B | 4-bit | 4 | ~1-2 min (est.) | ~5-6 GB (est.) | Good |

**Recommendation:** `flux2-klein-4b` is the safest choice for M1 8G. 9B models may work but leave almost no headroom.

## M1 8G Optimization Principles

1. **Smallest model:** flux2-klein-4b (4B params)
2. **4-bit quantization mandatory:** `--quantize 4` — 8-bit may fit but no headroom
3. **Always --low-ram:** Enables VAE tiling + memory offloading
4. **MLX cache capped:** `--mlx-cache-limit-gb 2.0` prevents memory exhaustion
5. **Resolution ≤ 512×512:** 1024×1024 will OOM on 8 GB
6. **Few steps (4):** Distilled models work well in 4 steps
7. **Expect 5-20 min on first run** (download), ~1 min after (inference)

## Verified Benchmarks (M1 8G, macOS)

| Test | Prompt | Model | Steps | Res | Time | Peak MLX | Peak RSS | Output |
|------|--------|-------|-------|-----|------|----------|----------|--------|
| Smoke test | "a simple red circle on white background, minimal" | flux2-klein-4b | 4 | 512×512 | 51s | 4.83 GB | 1.5 GB | 54 KB |
| Cat wizard | "a cute cat wearing a wizard hat, digital illustration" | flux2-klein-4b | 4 | 512×512 | 51s | 4.83 GB | 1.5 GB | 269 KB |

Total memory footprint: ~6.3 GB (RSS + MLX), well within 8 GB unified memory.

## Integration with /generate-image Skill

The mflux pipeline integrates as a third backend (`mflux`/`flux`) in the `/generate-image` skill:
- Triggered by `/generate-image mflux` or `/generate-image flux`
- macOS only (requires Apple Silicon + MLX)
- Default output: `./output/mflux/`
- No browser automation needed — purely CLI-driven

## Dependencies

| Component | Version | Purpose |
|-----------|---------|---------|
| uv | 0.11.3+ | Package installer |
| mflux | 0.17.5 | Image generation engine |
| hf_transfer | 0.1.9 | Fast Hugging Face downloads |
| mlx | 0.31.2 | Apple Silicon ML framework |
| Python | 3.11+ | Runtime |
