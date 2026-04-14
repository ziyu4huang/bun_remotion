---
name: shared-fixture-images
description: Shared fixture image pattern for multi-episode series — staticFile + sync-images.sh, NOT webpack imports
metadata:
  tags: fixture, images, staticFile, symlink, multi-episode, sync-images
---

# Shared Fixture Images for Multi-Episode Series

When a series has multiple episodes sharing the same character/background images, use the **fixture + sync pattern**.

## Architecture

```
series/
  fixture/
    characters/          ← canonical character PNGs
    backgrounds/         ← canonical background PNGs
    components/          ← shared React components (use staticFile)
    scripts/
      sync-images.sh     ← copies fixture images into each episode's public/images/
  series-ep1/
    public/images/       ← copies (NOT symlinks)
    src/                 ← episode code
  series-ep2/
    public/images/       ← copies (NOT symlinks)
    src/
```

## How it works

1. Canonical images live in `fixture/characters/` and `fixture/backgrounds/`
2. Shared components in `fixture/components/` reference images via `staticFile('images/<name>.png')`
3. `sync-images.sh` copies all fixture images into each episode's `public/images/`
4. Each episode's Remotion static server serves from its own `public/`

## Why NOT webpack imports

Webpack `import img from '../fixture/backgrounds/cafe.png'` does NOT work for shared fixture images. Remotion sets webpack `context` to the episode directory. Files outside this context are resolved as raw relative paths (e.g. `"../fixture/backgrounds/cafe.png"`) instead of being processed through webpack's `asset/resource` rule. The result: Remotion tries to fetch them via HTTP and gets 404.

**Confirmed:** Tested 2026-04-13 — webpack imports from `fixture/src/images.ts` produced `Error loading image with src: http://localhost:3003/fixture/backgrounds/classroom-morning.png` in both Studio and render.

## Rules

### Always use staticFile() for images in fixture components

```tsx
// ✅ Correct — fixture component uses staticFile
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
cp "$FIXTURE/characters/*.png" "$ep_dir/public/images/"

# ❌ Broken — Remotion's renderer returns 404 for symlinks
ln -sf "$FIXTURE/characters/xiaoxue.png" "$ep_dir/public/images/xiaoxue.png"
```

### Run sync-images.sh after scaffolding

```bash
bash bun_remotion_proj/<series>/fixture/scripts/sync-images.sh
```

### Verify after sync

```bash
ls -la public/images/  # NO -> arrows allowed
```

### Add new images to fixture, NOT to individual episodes

When adding a new character or background:
1. Place the PNG in `fixture/characters/` or `fixture/backgrounds/`
2. Update `sync-images.sh` if needed (it globs `*.png` automatically)
3. Re-run `sync-images.sh` for all episodes
