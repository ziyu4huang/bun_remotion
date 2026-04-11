# mlx_music — Local Music Generation on Apple Silicon

Generate music from text prompts using Meta's MusicGen, accelerated by Apple MLX.

## Requirements

- macOS + Apple Silicon (M1/M2/M3/M4)
- Python 3.11+
- ~1.2 GB disk space (musicgen-small model)

## Setup

```bash
cd mlx_music
chmod +x setup.sh
./setup.sh            # create .venv + install deps + download model
./setup.sh --no-model # skip model download
```

## Usage

### CLI

```bash
# Activate environment
source .venv/bin/activate

# Generate and save to file
python -m mlx_music generate "a chill lo-fi beat with soft piano"
python -m mlx_music generate "epic orchestral soundtrack" -d 15 -o outputs/epic.wav

# Generate and play through speakers
python -m mlx_music play "jazz piano solo"

# Batch generation from prompts file
python -m mlx_music batch prompts.txt -o outputs/

# Use named presets
python -m mlx_music preset lofi -d 10
python -m mlx_music preset ambient -o outputs/ambient.wav

# List presets and models
python -m mlx_music presets
python -m mlx_music models

# Use a different model
python -m mlx_music generate "funk guitar riff" --model medium
python -m mlx_music generate "cinematic tension" --model large -d 20
```

### Python API

```python
from mlx_music import MusicGenerator

gen = MusicGenerator(model_name="small")  # or "medium", "large"

# Generate and save
gen.save("a chill lo-fi beat with vinyl crackle", "output.wav")

# Generate and play
gen.play("smooth jazz piano")

# Custom parameters
gen.save(
    "epic orchestral soundtrack",
    "epic.wav",
    duration=15.0,
    temperature=1.2,
    top_k=300,
    cfg_coef=3.5,
)

# Use presets
gen.from_preset("lofi", "lofi.wav", duration=10)

# Batch generation
paths = gen.batch_save(
    ["chill lo-fi beat", "jazz piano", "electronic dance"],
    output_dir="outputs/",
)

# Free memory
gen.unload()
```

## Models

| Name | Size | Download | Quality | M1 8GB |
|------|------|----------|---------|--------|
| small | 300M | ~1.2 GB | Good | Safe |
| medium | 1.5B | ~3.2 GB | Better | Tight |
| large | 3.3B | ~6.5 GB | Best | May OOM |
| stereo-small | 300M | ~1.2 GB | Good (stereo) | Safe |
| stereo-medium | 1.5B | ~3.2 GB | Better (stereo) | Tight |
| stereo-large | 3.3B | ~6.5 GB | Best (stereo) | May OOM |

## Parameters

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| duration | 8.0s | 1-30s | Length of generated audio |
| temperature | 1.0 | 0.5-2.0 | Higher = more creative/random |
| top_k | 250 | 50-500 | Limits sampling to top-k tokens |
| cfg_coef | 3.0 | 1.0-5.0 | Higher = closer to prompt |

## Presets

Built-in prompt shortcuts for common music styles:

`lofi`, `ambient`, `orchestral`, `jazz`, `rock`, `electronic`, `classical`, `hiphop`, `acoustic`, `cinematic`

## Architecture

- **Backend**: [audiocraft_mlx](https://github.com/andrade0/musicgen-mlx) — MLX port of Meta's MusicGen
- **Model**: `facebook/musicgen-small` (default) — 32kHz WAV output
- **Runtime**: Apple MLX GPU acceleration on Apple Silicon
