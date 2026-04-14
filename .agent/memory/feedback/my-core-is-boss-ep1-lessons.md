---
name: my-core-is-boss-ep1-lessons
description: Lessons from code review of my-core-is-boss-ch1-ep1 — normalizeEffects, ScreenShake, SceneIndicator
type: feedback
---

# my-core-is-boss Ep1 Code Review Lessons

## `normalizeEffects` must be exported from fixture/characters.ts

**Why:** 3 content scenes imported it but it didn't exist. Each scene had a local copy that shadowed the broken import — fragile and confusing.

**How to apply:** When adding utility functions used across scenes, always export from the fixture barrel (`fixture/characters.ts` or a dedicated utils file). Never rely on local copies shadowing imports.

## ScreenShake must use deterministic noise, never Math.random()

**Why:** `Math.random()` produces different results per render — Studio preview != rendered output, Remotion frame cache can't work, repeated renders produce different shake patterns.

**How to apply:** Use frame-based deterministic noise: `Math.sin(elapsed * 12.9898 + 78.233) * 43758.5453 % 1`. This applies to ALL visual effects in Remotion — never use Math.random().

## Extract SceneIndicator component for scene intro text

**Why:** Scene indicator (fade-in/out text + animated underline) was copy-pasted across all content scenes. Extract to `fixture/components/SceneIndicator.tsx` with props `text` and `color`.

**How to apply:** When the same visual pattern appears in 2+ scenes, extract to a fixture component. Props: `text`, `color`, `frame` (auto from useCurrentFrame).

## Derive ComicEffects side from CHARACTERS config, not ternary chains

**Why:** `currentLine.character === "linyi" ? "left" : ...` ternary chains break when adding characters and are hard to read.

**How to apply:** Use `CHARACTERS[currentLine.character].position` — the position is already defined in the character config. This also works for narrator (center).

## React import is needed for React.FC type annotations

**Why:** Even with `"jsx": "react-jsx"`, `React.FC` still requires `import React from "react"`. The auto-import only covers JSX transformation.

**How to apply:** Don't remove `import React` when files use `React.FC`. Only safe to remove if using plain function declarations without React namespace types.

## TransitionSeries.Sequence always needs a name prop

**Why:** Without `name`, the Studio timeline shows generic labels making it hard to navigate multi-scene compositions.

**How to apply:** Always add `name="Scene Description"` to TransitionSeries.Sequence and regular Sequence components.
