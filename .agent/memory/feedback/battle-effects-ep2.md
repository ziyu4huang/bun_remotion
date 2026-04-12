---
name: battle-effects-ep2
description: Battle effect improvements for xianxia ep2 — EnergyWave (multi-line), KamehamehaBeam (charge→fire→impact), AnimatedLine primitive, ScreenShake
type: feedback
---

## Battle Effect Design Learnings (Ep1 → Ep2)

### Ep1 Root Cause: EnergyBeam was too simple
- Single `<line>` with noise jitter — no volume, no phases, no "charge then release" feel
- No reusable line primitive — each effect duplicated the 3-layer (glow→main→core) pattern
- No screen shake utility for impact moments

### Ep2 Improvements

**AnimatedLine primitive**: Extract the 3-layer SVG pattern into a pure-visual component. Takes `progress` and `opacity` as props (no useCurrentFrame). All higher-level effects compose from this.

**EnergyWave (攻擊光波)**:
- Multiple parallel curved SVG arcs (waveCount, default 7)
- Staggered timing: each line delayed 2 frames → creates "wave" sweep
- Center lines thicker/brighter, outer lines thinner/dimmer
- noise2D perturbs arc control points for organic variation
- Key: lines create the visual of an energy projectile made of light bands

**KamehamehaBeam (龜派氣功)**:
- **Why needed**: Ep1 had no "charge then release" mechanic — beam just appeared
- **Phase 1 (Charge)**: Growing pulsing sphere + spiral particles (angle increases, radius shrinks inward)
- **Phase 2 (Fire)**: Beam extends via SVG `<path>` with 7 control points jittered by noise2D. 5 rendering layers for depth (outer glow → outer beam → main → inner core → center highlight)
- **Phase 3 (Impact)**: ImpactBurst + ScreenFlash + ScreenShake wrapper
- **Why this works**: The three-phase structure creates dramatic tension (charge) → climax (fire) → resolution (impact)

**ScreenShake utility**:
- Wrapper div with `transform: translate(noise2D * intensity)` decaying over duration frames
- **Why**: Battle impacts feel flat without screen shake — essential for Kamehameha impact

### SVG Beam Technique
- For organic beams: use SVG `<path>` with multiple control points, each jittered by `noise2D(seed, pointIndex * 0.5, frame * 0.3) * jitterAmount`
- This creates a wobbling, energy-filled beam — not a rigid straight line
- **How to apply**: Any beam/large energy effect should use this multi-point jitter pattern

### Performance Notes
- Keep particle count reasonable (12-16, not hundreds)
- Return null when opacity ≤ 0 to remove from DOM
- SVG filters (feGaussianBlur) are the heaviest part — use sparingly
