---
name: episode-polish-checklist
description: Post-scaffold polish rules for narrative episodes — effect pacing, background variety, title hooks, outro system UI
type: feedback
---

## Effect Pacing
- ≤ 50% of dialog lines per scene should have ComicEffects
- Remove effects from "setup" lines — keep only on punchlines, reactions, and emotional peaks
- **Why:** Overuse (7/7 lines) dilutes impact; key moments (shock, fire, gloating) need contrast from silence
- **How to apply:** Read `dialogLines[]`, for each effect ask "does this line need visual emphasis?" Remove if dialog is self-explanatory

## Background Variety
- No two adjacent content scenes share the same background
- Match background to mood: sect-plaza (gatherings), sect-interior (private), sect-training (confrontation), mysterious-forest (secrets)
- **Why:** Same background for 2/3 content scenes feels repetitive even if not technically adjacent
- **How to apply:** When scaffolding, assign unique backgrounds per scene from `assets/backgrounds/`

## TitleScene Hook
- Minimum 3 elements: flash (f5-22) + title scale-in (f10-40) + system stinger (f35-95)
- Add ambient glow pulse: `interpolate(frame % 120, [0, 60, 120], [0.12, 0.2, 0.12])`
- System stinger uses `<SystemNotification text="新集數已解鎖：..." type="info" delay={35} />`
- **Why:** Scale-in alone feels static; system notification ties to series theme

## OutroScene System UI
- Use `<QuestBadge>` (trophy + achievement box) from `assets/components/QuestBadge.tsx`
- Use `<UnlockingTeaser>` (blinking "system unlocking..." progress bar) at bottom
- Add subtle inline character notes: `[蕭長老筆記本 +1]` for cross-episode continuity
- **Why:** Text-only outros feel flat; game-UI badges match the series theme
- **How to apply:** Import QuestBadge + UnlockingTeaser, add with episode-specific title/subtitle
