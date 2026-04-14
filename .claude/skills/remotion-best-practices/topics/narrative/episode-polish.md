---
name: episode-polish
description: Post-scaffold polish rules for narrative episodes — effect pacing, background variety, title hooks, outro system UI
metadata:
  tags: polish, quality, effects, background, title, outro, badge
---

# Episode Polish Checklist

Apply these rules after scaffolding scenes and generating TTS, before rendering final MP4.

---

## 1. Effect Pacing — Less is More

ComicEffects should accent **punchlines and emotional peaks**, not narrate every line.

**Rule: ≤ 50% of dialog lines in a scene should have an effect.**

```
❌ BAD — every line has an effect (7/7 = 100%)
Line 0: shock      ← peak, OK
Line 1: sparkle    ← filler, remove
Line 2: fire       ← peak, OK
Line 3: gloating   ← peak, OK
Line 4: sweat      ← reaction, OK
Line 5: sparkle    ← redundant with line 1, remove
Line 6: dots       ← closer, OK

✅ GOOD — only peaks and reactions (5/7 = 71%)
Line 0: shock      ← reveal moment
Line 1: (none)     ← setup, let dialog carry
Line 2: fire       ← escalation
Line 3: gloating   ← climax
Line 4: sweat      ← reaction
Line 5: (none)     ← setup for closer
Line 6: dots       ← deadpan punchline
```

**How to apply:** Read through `dialogLines[]`. For each effect, ask "does this line need visual emphasis?" If the dialog itself is already clear, remove the effect.

---

## 2. Background Variety — No Two Adjacent Content Scenes Share Background

Each content scene should feel visually distinct.

| Scene | Background | Why |
|-------|-----------|-----|
| ContentScene1 | sect-plaza.png | Public gathering, quest board |
| ContentScene2 | sect-interior.png OR spirit-beast-cave.png | Different location, different mood |
| ContentScene3 | mysterious-forest.png OR sect-training.png | Climax in new setting |

**Available backgrounds** (check `assets/backgrounds/`): `ancient-realm-entrance`, `ancient-realm-inside`, `boss-arena`, `demon-seal`, `dungeon-entrance`, `mysterious-forest`, `sect-interior`, `sect-plaza`, `sect-training`, `siege-battlefield`, `spirit-beast-cave`, `system-update`, `tournament-stage`, `world-reset`.

**Match background to mood:**
- `sect-plaza` → public announcements, gatherings
- `sect-interior` → private conversations, writing
- `sect-training` → confrontations, demonstrations
- `mysterious-forest` → secrets, over-interpretation
- `spirit-beast-cave` → missions, treasure

---

## 3. TitleScene Hook — Beyond Scale-in + Flash

Minimum viable title scene needs **3 elements**:

| Element | Timing | Purpose |
|---------|--------|---------|
| Flash/impact | frames 5–22 | Attention grab |
| Title scale-in | frames 10–40 | Establish identity |
| **System stinger** | frames 35–95 | Thematic hook |

The **system stinger** is a `SystemNotification` that ties the title to the series theme:

```tsx
{frame >= 35 && frame <= 95 && (
  <SystemNotification
    text={`新集數已解鎖：第${chapter}章第${episode}集`}
    type="info"
    delay={35}
  />
)}
```

Also add a **pulsing ambient glow** for the background to feel alive:

```tsx
const glowPulse = interpolate(frame % 120, [0, 60, 120], [0.12, 0.2, 0.12], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

---

## 4. OutroScene System UI — Quest Complete Badge

OutroScene should NOT be text-only. Add these system UI elements:

### QuestBadge component

Located at `assets/components/QuestBadge.tsx`. Drop-in component:

```tsx
import { QuestBadge, UnlockingTeaser } from "../../../assets/components/QuestBadge";

<QuestBadge
  title="任務跳過"                    // Episode title
  subtitle="三秒通關，直取天道本源"     // One-line summary
  color="#F59E0B"                     // Episode accent color
  delay={10}                          // Frame offset within scene
/>
```

### UnlockingTeaser component

Shows blinking "system unlocking next episode" text at bottom:

```tsx
<UnlockingTeaser
  text="Ch1-Ep3 解鎖進度：87%"
  color="#38BDF8"
  delay={130}
/>
```

### Timing layout for OutroScene

| Frame range | Element |
|-------------|---------|
| 0–70 | QuestBadge (delay=10) |
| 50–inf | Summary text (repositioned to top: 38%) |
| 110–inf | Divider line |
| 120–inf | Next episode teaser |
| 130–inf | UnlockingTeaser |

---

## 5. Cross-Character Mention in Outro

If the outro narration mentions a character who appears in the next episode (e.g., "蕭長老聽說此事後…"), add a subtle inline note in the summary:

```tsx
<span style={{ color: "#64748B", fontSize: 24 }}>
  [蕭長老筆記本 +1]
</span>
```

This reinforces the series continuity without needing a separate character sprite.

---

## Checklist (apply to every episode)

- [ ] ≤ 50% of lines per scene have ComicEffects
- [ ] No two adjacent content scenes share the same background
- [ ] TitleScene has flash + scale-in + system stinger notification
- [ ] TitleScene background glow pulses (not static)
- [ ] OutroScene has QuestBadge at top
- [ ] OutroScene has UnlockingTeaser at bottom
- [ ] OutroScene summary mentions key characters with subtle inline notes
- [ ] All new components imported from shared `assets/components/`

## See also

- [./comic-effects.md](./comic-effects.md) — Full effect type reference
- [./environmental-effects.md](./environmental-effects.md) — Scene theming and backgrounds
- [./galgame.md](./galgame.md) — Character sprite and dialog box patterns
