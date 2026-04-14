---
name: code-quality
description: Code quality patterns for Remotion projects — component extraction, utility exports, config-driven logic
metadata:
  tags: code-quality, architecture, patterns, refactoring
---

# Code Quality Patterns

---

## 1. Export utilities from fixture barrel, not local copies

When a utility function is used across 2+ scenes, export it from the fixture barrel
(`fixture/characters.ts` or a dedicated `utils.ts`). Never define local copies that
shadow imports.

```tsx
// ❌ WRONG — local copy shadows broken import
import { normalizeEffects } from "../../../fixture/characters"; // doesn't exist!
function normalizeEffects(effect) { ... } // shadows the import, confusing

// ✅ CORRECT — export once from fixture, import everywhere
// fixture/characters.ts
export function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}

// scenes/ContentScene1.tsx
import { normalizeEffects } from "../../../fixture/characters";
```

---

## 2. Derive character side from config, not ternary chains

Hardcoded ternary chains for character positions break when adding characters.

```tsx
// ❌ WRONG — fragile, breaks when adding characters
side={currentLine.character === "linyi" ? "left"
  : currentLine.character === "zhaoxiaoqi" ? "right"
  : "center"}

// ✅ CORRECT — derives from existing character config
side={CHARACTERS[currentLine.character].position}
```

This also works for narrator (center) and any future characters automatically.

---

## 3. Extract repeated visual patterns to fixture components

When the same visual pattern (scene indicator, loading text, notification) appears in
2+ scenes, extract to a fixture component.

**Example — SceneIndicator:**

```tsx
// fixture/components/SceneIndicator.tsx
interface SceneIndicatorProps { text: string; color: string; }

export const SceneIndicator: React.FC<SceneIndicatorProps> = ({ text, color }) => {
  const frame = useCurrentFrame();
  const opacity = frame < 60
    ? interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], { ... })
    : 0;
  if (opacity <= 0) return null;
  // ... render indicator
};

// Usage in scenes — one line instead of 20+ lines copy-pasted
<SceneIndicator text="天道宗廣場" color="#F59E0B" />
```

---

## 4. Always use `name` prop on Sequence/TransitionSeries.Sequence

Without `name`, the Studio timeline shows generic labels making navigation painful.

```tsx
// ❌ WRONG — Studio shows "Sequence" for every scene
<TransitionSeries.Sequence durationInFrames={d(i)}>

// ✅ CORRECT — Studio shows readable labels
<TransitionSeries.Sequence durationInFrames={d(i)} name="Content 1: Plaza">
```

---

## 5. `React` import is needed for `React.FC`

Even with `"jsx": "react-jsx"` in tsconfig, `React.FC` type annotations still
require the explicit import. Only JSX expressions are auto-imported.

```tsx
// This file NEEDS `import React from "react"` because of React.FC below:
export const MyScene: React.FC = () => { ... };

// This file does NOT need it (plain function, no React namespace):
export function MyScene() { ... }
```
