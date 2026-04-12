---
name: galgame-auto-workflow
description: Automatic TTS → background render workflow for galgame episodes
type: feedback
---

# Galgame Episode — Automatic Build Workflow

## Rule: After creating a new episode, ALWAYS run TTS + render automatically in background

**Why:** The user had to manually ask to render after TTS completed. This wastes time — the full pipeline (create files → TTS → render) should be automatic. Also, the first render attempt failed because `scripts/dev.sh` wasn't updated with the new app name, causing a silent configuration error.

**How to apply:**

### 1. When scaffolding a new app, update ALL registration points

Creating the directory + package.json is NOT enough. You must also update:
- `scripts/dev.sh` — add app name to `ALL_APPS` list AND `get_comp_id()` case statement
- Root `package.json` — add `start:<alias>`, `build:<alias>`, `generate-tts:<alias>` scripts
- `CLAUDE.md` — add app to project structure tree

### 2. After TTS completes, immediately kick off render in background

```bash
# Step 1: Generate TTS (background)
bun run generate-tts:<alias>  # run_in_background: true

# Step 2: On TTS completion notification → immediately run render (background)
bun run build:<alias>          # run_in_background: true
```

Never wait for user to ask "can it render?" — just do it.

### 3. TTS + Render pipeline is always: background both

Both TTS generation and video rendering are long-running tasks. Always run them with `run_in_background: true` so the user can continue working while they complete.

### 4. TransitionSeries duration calculation

When using `@remotion/transitions` with `TransitionSeries`, the total duration is:
```
total = sum(scene_durations) - (num_transitions × transition_frames)
```
This must be reflected in `Root.tsx`'s `calculateMetadata`.

### 5. Easing.back() API

In Remotion 4.0.290, `Easing.back()` takes a `number` (overshoot factor), NOT an object:
```tsx
// ✅ Correct
Easing.out(Easing.back(0.3))

// ❌ Wrong (TS error in this version)
Easing.out(Easing.back({ overshoot: 0.3 }))
```

### 6. clockWipe() requires width/height

```tsx
// ✅ Correct
clockWipe({ width: 1920, height: 1080 })

// ❌ Wrong (TS error: Expected 1 arguments, but got 0)
clockWipe()
```
