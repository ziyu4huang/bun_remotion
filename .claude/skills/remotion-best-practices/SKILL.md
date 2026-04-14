---
name: remotion-best-practices
description: Best practices for Remotion — video creation in React
version: 2.0.0
---

# remotion-best-practices

Best practices for Remotion — video creation in React.

## Quick Reference (always-visible)

- All animations MUST use `useCurrentFrame()`. CSS transitions and Tailwind `animate-*` are FORBIDDEN.
- `dialogLines[]` array is the single source of truth for narrative scenes.
- Never import Node.js built-ins (`fs`, `path`, `child_process`) in `src/` — webpack can't resolve them. Put I/O in `scripts/`.
- Use `staticFile()` for public folder assets; webpack `import` only for co-located files.
- Always add `name` prop to `<Sequence>` and `<TransitionSeries.Sequence>` for Studio readability.

## Topic Detection

Detect what the user is working on from conversation context, then read ONLY the matching topic summary.

| Keywords / Context | Topic | Read |
|---|---|---|
| scene, dialog, character, dialogLines, narrative, galgame, VN, comic effect, environmental | Narrative | `topics/narrative/_topic.md` |
| new episode, series, PLAN.md, scaffold, fixture, story, code quality | Episode Setup | `topics/episode-setup/_topic.md` |
| animate, interpolate, spring, sequence, transition, timing, typewriter, fade, slide, trim | Animation | `topics/animation/_topic.md` |
| audio, video, image, asset, gif, voiceover, TTS, sfx, sound | Media | `topics/media/_topic.md` |
| visualization, lottie, chart, light-leak, 3D, three.js, map, mapbox | Effects | `topics/effects/_topic.md` |
| composition, Root.tsx, metadata, parameter, zod, tailwind | Config | `topics/config/_topic.md` |
| font, caption, subtitle, srt, transcribe, measure text | Text | `topics/text/_topic.md` |
| ffmpeg, transparent, decode, extract frame, duration, dimensions | Utilities | `topics/utilities/_topic.md` |
| debug, black frame, verify, still, brightness, NaN, bug | Debugging | `topics/debugging/_topic.md` |

**Read ONLY the topic summary you need. Do NOT read all topic files.**
If a topic summary references a specific rule file for details, read that single file.
Multiple topics may apply — read up to 2 topic summaries if the task spans areas.
