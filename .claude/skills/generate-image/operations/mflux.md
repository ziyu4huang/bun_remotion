# mflux — Local Image Generation (macOS Apple Silicon Only)

Generate images locally using [mflux](https://github.com/filipstrand/mflux) — an MLX-native FLUX/Z-Image port. No cloud, no browser, no login.

## Prerequisites (macOS only)

```bash
# Platform check — must pass before using mflux
[[ "$(uname -s)" == "Darwin" ]] && [[ "$(uname -m)" == "arm64" ]] && echo "OK" || echo "NOT SUPPORTED"
```

If NOT macOS ARM64, fall back to `zai` or `aistudio`.

### One-time setup

```bash
# Install uv (if missing)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install mflux
uv tool install --upgrade mflux --with hf_transfer

# Verify
which mflux-generate-flux2
```

Model (~13 GB) downloads automatically on first run and caches in `~/.cache/huggingface/`.

## Defaults (M1 8G Optimized)

| Parameter | Value | Reason |
|-----------|-------|--------|
| Model | `flux2-klein-4b` | 4B params, smallest, fastest |
| Quantize | 4-bit | Mandatory for 8 GB RAM |
| Steps | 4 | Distilled model, 4 is enough |
| Resolution | 512×512 | Max safe for 8 GB RAM |
| Low-ram | on | VAE tiling + offloading |
| MLX cache | 2.0 GB | Prevents memory exhaustion |

## Execution Steps

### Step 1: Create output directory

```bash
mkdir -p ./output/mflux
```

### Step 2: Determine next filename

```bash
LAST=$(ls ./output/mflux/mflux-*.png 2>/dev/null | grep -oP 'mflux-\K\d+' | sort -rn | head -1)
NEXT=$((10#${LAST:-0} + 1))
FILENAME="mflux-$(printf '%03d' $NEXT).png"
```

### Step 3: Generate

```bash
mflux-generate-flux2 \
  --model flux2-klein-4b \
  --prompt "PROMPT_HERE" \
  --quantize 4 \
  --steps 4 \
  --width 512 --height 512 \
  --low-ram \
  --mlx-cache-limit-gb 2.0 \
  --output "./output/mflux/${FILENAME}"
```

**Timing (M1 8G):**
- First run: 10-45 min (model download)
- Subsequent: ~50-60s per image
- Peak memory: ~6.3 GB (RSS + MLX)

### Step 4: Verify and show

1. `ls -lh ./output/mflux/${FILENAME}`
2. `file ./output/mflux/${FILENAME}`
3. `Read` tool on the file
4. Report: filename, size, generation time, peak memory

## CLI Reference

| Flag | Default | Description |
|------|---------|-------------|
| `--model` | flux2-klein-4b | Model variant |
| `--quantize` | 4 | Bits: 3, 4, 5, 6, 8 |
| `--steps` | 4 | Inference steps |
| `--width` / `--height` | 512 | Resolution. Max 512×512 on M1 8G |
| `--low-ram` | off | Always enable on M1 8G |
| `--mlx-cache-limit-gb` | none | Always set to 2.0 on M1 8G |
| `--seed` | random | Reproducibility |
| `--output` | required | Output path |

## Error Handling

| Situation | Action |
|-----------|--------|
| `command not found` | Run `uv tool install --upgrade mflux --with hf_transfer` |
| OOM / memory error | Reduce to 384×384, `--quantize 3`, or `--mlx-cache-limit-gb 1.5` |
| Download stalled | Network issue — model is ~13 GB. `hf_transfer` speeds this up |
| Very slow (~minutes) | Normal on M1 8G. 50-60s for 512×512 @ 4 steps is expected |
| Not macOS | Fall back to `zai` or `aistudio` backend |

## Alternative Models

| Model | Params | Notes |
|-------|--------|-------|
| `flux2-klein-4b` | 4B | Default. Best for M1 8G. |
| `flux2-klein-9b` | 9B | Higher quality, ~6-7 GB peak memory. May OOM on 8 GB. |
| `z-image-turbo` | 6B | Speed-optimized. Use `mflux-generate-z-image-turbo` command. |

## Notes

- First run downloads model (~13 GB) to `~/.cache/huggingface/` — subsequent runs use cache
- `./output/mflux/` is gitignored via `output/` in `.gitignore`
- 4-bit quantization causes minor quality loss — acceptable for prototyping
- The `mflux/generate.py` Python script is also available for programmatic use (see `mflux/PLAN.md`)
