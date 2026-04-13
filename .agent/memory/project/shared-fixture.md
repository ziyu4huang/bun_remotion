---
name: shared-fixture
description: Reusable background images and cross-project shared component architecture
type: project
---

## Shared Fixture Directory

`bun_remotion_proj/shared-fixture/background/` contains reusable background images collected from previous episodes. **Check here first** before generating new backgrounds.

**Why:** Background images (classroom, bedroom, cafe, etc.) are expensive to generate and often reusable across episodes. Copying to shared-fixture avoids redundant AI generation.

**How to apply:**
- When building a new episode, check `shared-fixture/background/` for matching scenes
- Copy needed backgrounds into the new episode's `public/images/`
- Only generate new backgrounds for scenes that don't have a match

### Available Backgrounds

| File | Description | Source |
|------|-------------|--------|
| bedroom-dawn.png | Bedroom at dawn, warm morning light | EP2 |
| bedroom-night.png | Bedroom at night, dark cozy atmosphere | EP2 |
| gaming-room.png | Gaming/PC room setup | EP2 |
| gaming-setup.png | Gaming desk and equipment close-up | EP2 |
| classroom-morning.png | Classroom with morning sunlight | EP4 |
| school-corridor.png | School hallway/corridor | EP4 |
| cafe.png | Cafe/coffee shop interior | EP4 |

### Adding New Backgrounds

After generating backgrounds for a new episode, copy reusable ones to `shared-fixture/background/`:
```bash
cp bun_remotion_proj/<new-ep>/public/images/<bg-name>.png bun_remotion_proj/shared-fixture/background/
```

## Cross-Project Shared Components (2026-04-14)

`@bun-remotion/shared` (workspace package) now contains unified components used by all video project groups:

**Why:** Previously weapon-forger, galgame-meme-theater, and my-core-is-boss each had forked copies of CharacterSprite, DialogBox, ComicEffects, etc. This caused code duplication and inconsistent bug fixes.

**How to apply:**
- Import from `@bun-remotion/shared` instead of `../../../fixture/components/`
- See `feedback/shared-component-architecture.md` for full details
- BattleEffects stays project-local (genuinely different per project)

### Planned: Selective Image Sync (Phase 4)

Currently every episode gets ALL fixture images (causing ~174MB duplication). Planned: each episode declares needed images via `images.json` manifest, sync script only copies what's needed.

### Planned: JSON Manifest System

Weapon-forger character/background JSON manifests will be updated to match my-core-is-boss format (`type: "emotion"` instead of `type: "pose"`, add `description`, `color`, `width` fields).
