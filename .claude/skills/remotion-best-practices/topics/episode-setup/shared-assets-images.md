---
name: shared-assets-images
description: Shared assets image pattern for multi-episode series — shared public/ via Config.setPublicDir, NOT per-episode copies
metadata:
  tags: assets, images, staticFile, symlink, multi-episode, setPublicDir
---

# Shared Assets Images for Multi-Episode Series

When a series has multiple episodes sharing the same character/background images, use the **shared public directory** pattern via `Config.setPublicDir`.

## Architecture

```
series/
  public/                  ← shared by ALL episodes via remotion.config.ts
    images/                ← character PNGs + JSON manifests + background PNGs
    audio/
      ch1-ep1/            ← per-episode audio files
      ch1-ep2/
  assets/
    characters/            ← canonical source of truth
    backgrounds/           ← canonical source of truth
    characters.ts          ← per-group character configs + types
    components/            ← shared React components (use staticFile)
    scripts/
      sync-images.sh       ← copies assets images to shared public/images/
      generate-tts.ts      ← shared TTS generator → outputs to public/audio/<ep>/
    story/                 ← novel writing guides
    presets/               ← genre-specific TypeScript visual presets
  series-ch1-ep1/
    remotion.config.ts     ← Config.setPublicDir("../public")
    src/                   ← episode code
  series-ch1-ep2/
    remotion.config.ts     ← Config.setPublicDir("../public")
    src/
```

## How it works

1. Each episode has a `remotion.config.ts` with `Config.setPublicDir("../public")`
2. Remotion's `staticFile()` resolves from the shared `public/` directory
3. All episodes share the same image files — zero duplication
4. Audio is per-episode, organized in `public/audio/<ep-name>/`
5. `sync-images.sh` copies from `assets/` to the shared `public/images/` (one copy)

## remotion.config.ts

```ts
// Each episode's remotion.config.ts
import { Config } from "@remotion/cli/config";

Config.setPublicDir("../public");
```

## Audio path conventions

With shared public, audio paths must include the episode name:
```tsx
// Main composition — audio in subfolder per episode
const scenes = [
  { Scene: TitleScene, audio: "audio/ch1-ep1/01-title.wav" },
  // ...
];
```

```tsx
// Root.tsx — build-time require from shared public
const sceneDurationsData = (() => {
  try { return require("../../public/audio/ch1-ep1/durations.json"); }
  catch { return Array(5).fill(210); }
})();
```

```tsx
// Scene files — build-time require from shared public
const segmentDurations = (() => {
  try { return require("../../../public/audio/ch1-ep1/segment-durations.json"); }
  catch { return {}; }
})();
```

## Why NOT webpack imports for images

Webpack `import img from '../assets/backgrounds/cafe.png'` does NOT work for shared assets images. Remotion sets webpack `context` to the episode directory. Files outside this context are resolved as raw relative paths instead of being processed through webpack's `asset/resource` rule. The result: 404.

**Confirmed:** Tested 2026-04-13 — webpack imports from outside episode context produced 404.

Note: `require()` for JSON files DOES work across directories because webpack's json loader is not restricted by context.

## Rules

### Always use staticFile() for images in assets components

```tsx
// ✅ Correct — staticFile resolves from shared public/
import { Img, staticFile } from "remotion";

export const BackgroundLayer = ({ image }: { image?: string }) => (
  <Img src={staticFile(`images/${image}`)} />
);
```

### Always copy, NEVER symlink

```bash
# ✅ sync-images.sh copies to shared public/images/
rsync -u "$ASSETS"/characters/*.png "$SHARED_PUBLIC/images/"

# ❌ Broken — Remotion's renderer returns 404 for symlinks
ln -sf "$ASSETS/characters/xiaoxue.png" "$SHARED_PUBLIC/images/xiaoxue.png"
```

### Run sync-images.sh after adding new images

```bash
bash bun_remotion_proj/<series>/assets/scripts/sync-images.sh
```

### Add new images to assets, NOT to public/ directly

When adding a new character or background:
1. Place the PNG in `assets/characters/` or `assets/backgrounds/`
2. Re-run `sync-images.sh` (copies to shared `public/images/`)
