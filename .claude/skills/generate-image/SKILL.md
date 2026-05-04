---
name: generate-image
description: >
  Use when: "generate image", "create image", "AI image", "aistudio image",
  "gemini image", "imagen", "/generate-image", "nano banana", "z.ai image",
  "zai image", "glm-image", "mflux", "flux image", "local image".
  Triggers on: image generation, AI Studio, gemini image gen, z.ai image gen,
  mflux local generation, Apple Silicon image gen.
trigger: /generate-image
version: 6.0.0
---

# /generate-image — AI Image Generation

Generate images using AI backends. Three backends, loaded on demand.

## Backends

| Backend | Flag | Platform | Login | Cost |
|---------|------|----------|-------|------|
| **z.ai** | `zai` (default) | Any | Google OAuth | Free |
| **AI Studio** | `aistudio` | Any | Google | Free/Paid |
| **mflux** | `mflux` / `flux` | macOS only | None | Free (local) |

## Mode Detection

Detect backend from the user's request:

| User says | Backend | Read |
|-----------|---------|------|
| "mflux", "flux", "local", "mlx" | `mflux` | `operations/mflux.md` |
| "aistudio", "nano banana", "ai studio" | `aistudio` | `operations/aistudio.md` |
| "zai", "z.ai" (or default) | `zai` | `operations/zai.md` |
| "galgame", "visual novel", "character sprite" | any + `galgame` | `operations/galgame.md` |
| "remove background", "rembg", "transparent" | post-process | `operations/background-removal.md` |

Read ONLY the operation file you need. Do NOT read all operation files.

## Operations (Load on Demand)

### zai — z.ai free web UI (default backend)
Read `operations/zai.md` — Playwright automation for https://image.z.ai/. Free, no API credits, Google login required.

### aistudio — Google AI Studio (Nano Banana)
Read `operations/aistudio.md` — Playwright automation for AI Studio. Supports free (Flash Image) and paid (Pro, Pro 2) tiers.

### mflux — Local generation (macOS Apple Silicon)
Read `operations/mflux.md` — CLI-driven local generation via MLX. No browser, no login, no cloud. ~50s/image on M1 8G.

### galgame — Visual novel character sprites
Read `operations/galgame.md` — Prompt templates, LEFT-facing convention, naming, batch generation. Works with any backend.

### background-removal — rembg post-processing
Read `operations/background-removal.md` — Remove backgrounds from generated images using rembg. Required for transparent sprites.

## Usage

```
/generate-image <prompt> [backend] [options]
```

**Arguments:**
- `<prompt>` — Image description (required)
- `zai` — z.ai free web UI (default)
- `aistudio` — Google AI Studio (Nano Banana)
- `mflux` / `flux` — Local mflux generation (macOS only)
- `free` / `pro` / `pro2` — AI Studio tier selection
- `--output <path>` — Custom output path

**Examples:**
```
/generate-image a cute cat wearing a hat
/generate-image cyberpunk cityscape aistudio pro
/generate-image mflux fantasy landscape mountains
/generate-image flux a cute cat wearing a wizard hat
/generate-image anime girl character sprite zai --output assets/hero.png
```

## Output

- Default directories: `./output/` (zai, aistudio) or `./output/mflux/` (mflux)
- `output/` is gitignored
- mflux uses sequential naming: `mflux-001.png`, `mflux-002.png`, ...
- Image format: PNG

## Shared Conventions

- Always verify the generated image with `Read` tool and `file` command
- Report: filename, file size, resolution, prompt used
- If a backend fails, suggest the user try a different backend
- Close browser when done with browser-based backends
- `output/` is gitignored — never commit generated images
