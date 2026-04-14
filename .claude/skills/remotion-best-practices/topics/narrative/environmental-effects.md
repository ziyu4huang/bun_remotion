---
name: environmental-effects
description: Per-scene theming — accent colors, ambient glow, scene indicators, atmospheric effects
metadata:
  tags: environment, theme, accent, glow, ambient, scene-indicator, REC, timer
---

# Environmental Effects — Scene Theming

Each scene should have a **unique visual identity** through background + accent color + ambient effect.
This prevents visual monotony in multi-scene episodes.

---

## The Pattern: Background + Accent + Ambient

Every content scene gets three visual layers:

| Layer | Purpose | Example |
|-------|---------|---------|
| Background image | Sets the location | `classroom-morning.png`, `cafe.png`, `bedroom-night.png` |
| Accent color | Tints overlays, indicators, glow | `#F472B6` (pink), `#FBBF24` (gold), `#60A5FA` (blue) |
| Ambient effect | Atmospheric overlay | Warm lamp glow, golden "大餅" glow, night monitor, fluorescent |

---

## Accent Color

Each scene picks ONE accent color. Used consistently for:
- Scene indicator text + underline
- Glow effects
- Ambient light tinting
- Comic effect color hints

```tsx
// Scene-specific accent — defined once at top of scene component
const ACCENT = "#FBBF24"; // golden, for boss-promises scene
```

**Color selection tips:**
- Warm scenes (interview, date): pink, gold, orange
- Professional scenes (meeting, office): indigo, blue, teal
- Night scenes (overtime, studying): blue, purple, dark cyan
- Comedy scenes: vary widely — match the joke's mood

---

## Scene Indicator

A brief scene name that fades in at the start of each content scene:

```tsx
const SceneIndicator: React.FC<{ text: string; color: string }> = ({ text, color }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [5, 25], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", top: 40, left: 60, opacity, zIndex: 50 }}>
      <div style={{ color, fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
        {text}
      </div>
      <div style={{
        width: lineWidth,
        height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        marginTop: 4,
      }} />
    </div>
  );
};

// Usage
<SceneIndicator text="面試現場" color="#F472B6" />
```

**Pattern:** Scene name + animated underline that grows 0→200px. Fades in (0-15f), holds (15-45f), fades out (45-60f).

---

## Common Ambient Effects

### Warm Study Lamp Glow

```tsx
// Top-left warm light source — interview, study scenes
<div style={{
  position: "absolute", top: -100, left: -50,
  width: 600, height: 600,
  background: "radial-gradient(circle, rgba(251,191,36,0.15) 0%, transparent 70%)",
  pointerEvents: "none",
}} />
```

### Golden "Big Pie" Glow (老闆畫大餅)

```tsx
// Center golden radiance — boss promise scenes
<div style={{
  position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)",
  width: 800, height: 800,
  background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 60%)",
  pointerEvents: "none",
}} />
```

### Fluorescent Meeting Room

```tsx
// Top-center cool white light — meeting/office scenes
<div style={{
  position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
  width: 1200, height: 400,
  background: "radial-gradient(ellipse, rgba(200,210,255,0.1) 0%, transparent 70%)",
  pointerEvents: "none",
}} />
```

### Night Monitor Glow

```tsx
// Blue-ish screen glow — overtime, late-night scenes
<div style={{
  position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
  width: 700, height: 500,
  background: "radial-gradient(ellipse, rgba(96,165,250,0.15) 0%, transparent 60%)",
  pointerEvents: "none",
}} />
```

### Moon / Night Sky

```tsx
// Top-right moon glow — night scenes
<div style={{
  position: "absolute", top: 60, right: 120,
  width: 80, height: 80,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(255,255,220,0.9) 0%, rgba(255,255,220,0.3) 50%, transparent 70%)",
  boxShadow: "0 0 40px rgba(255,255,220,0.4)",
  pointerEvents: "none",
}} />
```

---

## REC Timer (Meeting/Recording Scenes)

A recording indicator that adds visual variety:

```tsx
const RecTimer: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  if (f < 0) return null;

  const blink = Math.floor(f / 15) % 2 === 0; // blink every 0.5s

  return (
    <div style={{
      position: "absolute", top: 40, right: 60,
      display: "flex", alignItems: "center", gap: 8,
      zIndex: 50,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: "50%",
        background: blink ? "#EF4444" : "transparent",
        border: `2px solid #EF4444`,
      }} />
      <div style={{ color: "#EF4444", fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>
        REC {String(Math.floor(f / 30 / 60)).padStart(2, "0")}:{String(Math.floor(f / 30) % 60).padStart(2, "0")}
      </div>
    </div>
  );
};
```

---

## Scene Theming Checklist

When creating a new scene, ensure it has:

- [ ] **Unique background image** — different from other scenes in the episode
- [ ] **Accent color** — one consistent color for the scene
- [ ] **At least one ambient effect** — glow, light source, or atmospheric overlay
- [ ] **Scene indicator** — brief name + underline (first 60 frames)
- [ ] **Visual variety** — no two adjacent scenes should look the same

---

## See also

- [./dialog-driven.md](./dialog-driven.md) — How scenes are structured
- [./galgame.md](./galgame.md) — BackgroundLayer component implementation
- [animations](../animation/animations.md) — Interpolation and spring animation basics
