---
name: remotion-no-symlinks
description: Remotion static server cannot follow symlinks — use staticFile + sync-images.sh, NOT webpack imports for shared fixture
type: feedback
---

# Remotion: Never use symlinks for public/ assets

**Rule:** For multi-episode series with shared fixture images, use `staticFile()` + `sync-images.sh` (file copies). Never use symlinks. Never use webpack `import` for images outside the episode directory.

**Why:**
1. **Symlinks**: Remotion's renderer (`remotion render`) returns 404 for symlinked files. Studio works fine, but render fails.
2. **Webpack imports**: `import img from '../fixture/bg.png'` does NOT work. Remotion sets webpack `context` to the episode directory. Files outside this context are resolved as raw relative path strings instead of being processed through webpack's `asset/resource` rule. Result: `Error loading image with src: http://localhost:3003/fixture/backgrounds/classroom-morning.png`. Tested and confirmed 2026-04-13.

**How to apply:**
- Fixture components (`CharacterSprite`, `BackgroundLayer`) must use `staticFile('images/${name}')`
- `sync-images.sh` must always `cp`, never `ln -sf`
- After running sync scripts, verify with `ls -la public/images/` — no `->` arrows
- Canonical images live in `fixture/characters/` and `fixture/backgrounds/`
- Each episode has its own `public/images/` with actual file copies
- See `.claude/skills/remotion-best-practices/rules/shared-fixture-images.md` for full documentation
