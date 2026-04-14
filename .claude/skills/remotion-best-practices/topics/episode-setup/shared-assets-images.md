---
name: shared-assets-images
description: Shared assets image pattern for multi-episode series — staticFile + sync-images.sh, NOT webpack imports
metadata:
  tags: assets, images, staticFile, symlink, multi-episode, sync-images
---

# Shared Assets Images for Multi-Episode Series

When a series has multiple episodes sharing the same character/background images, use the **assets + sync pattern**.

## Architecture

```
series/
  assets/
    characters/          ← canonical character PNGs + JSON manifests
    backgrounds/         ← canonical background PNGs
    characters.ts        ← per-group character configs + types
    components/          ← shared React components (use staticFile)
    scripts/
      sync-images.sh     ← copies assets images into each episode's public/images/
      generate-tts.ts    ← shared TTS generator
    story/               ← novel writing guides (world-building, characters, plot-arcs, plot-lines)
    presets/             ← genre-specific TypeScript visual presets
  series-ep1/
    public/images/       ← copies (NOT symlinks)
    src/                 ← episode code
  series-ep2/
    public/images/       ← copies (NOT symlinks)
    src/
```

## How it works

1. Canonical images live in `assets/characters/` and `assets/backgrounds/`
2. Shared components in `assets/components/` reference images via `staticFile('images/<name>.png')`
3. `sync-images.sh` copies all assets images into each episode's `public/images/`
4. Each episode's Remotion static server serves from its own `public/`

## Why NOT webpack imports

Webpack `import img from '../assets/backgrounds/cafe.png'` does NOT work for shared assets images. Remotion sets webpack `context` to the episode directory. Files outside this context are resolved as raw relative paths (e.g. `"../assets/backgrounds/cafe.png"`) instead of being processed through webpack's `asset/resource` rule. The result: Remotion tries to fetch them via HTTP and gets 404.

**Confirmed:** Tested 2026-04-13 — webpack imports from outside episode context produced 404 in both Studio and render.

## Rules

### Always use staticFile() for images in assets components

```tsx
// ✅ Correct — assets component uses staticFile
import { Img, staticFile } from "remotion";

export const BackgroundLayer = ({ image }: { image?: string }) => (
  <Img src={staticFile(`images/${image}`)} />
);
```

```tsx
// ❌ Broken — webpack import from outside episode context
import cafeBg from "../backgrounds/cafe.png";  // resolves to raw path string
<Img src={cafeBg} />  // 404 error
```

### Always copy, NEVER symlink

```bash
# ✅ Correct
cp "$ASSETS/characters/*.png" "$ep_dir/public/images/"

# ❌ Broken — Remotion's renderer returns 404 for symlinks
ln -sf "$ASSETS/characters/xiaoxue.png" "$ep_dir/public/images/xiaoxue.png"
```

### Run sync-images.sh after scaffolding

```bash
bash bun_remotion_proj/<series>/assets/scripts/sync-images.sh
```

### Verify after sync

```bash
ls -la public/images/  # NO -> arrows allowed
```

### Add new images to assets, NOT to individual episodes

When adding a new character or background:
1. Place the PNG in `assets/characters/` or `assets/backgrounds/`
2. Update `sync-images.sh` if needed (it globs `*.png` automatically)
3. Re-run `sync-images.sh` for all episodes
