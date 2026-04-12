---
name: shared-fixture
description: Reusable background images and assets in shared-fixture/ for cross-episode reuse
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
