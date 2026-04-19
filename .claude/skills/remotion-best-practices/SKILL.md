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
| new episode, series, PLAN.md, scaffold, assets, story, code quality | Episode Setup | `topics/episode-setup/_topic.md` |
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

## Strategic Roadmap

Dual-LLM architecture: pi-agent (GLM, free) + Claude Code (paid) supervisor.

| Doc | What | When to Read |
|-----|------|-------------|
| `NEXT.md` | Current status, next task, dependency graph | **Always read first** |
| `TODO.md` | Active tasks (Phase 25/28-B/31/32/33) | Picking next task |
| `PLAN.md` | Active phase specs (Phase 31–33) | Planning a phase |
| `TODO-archive.md` | Completed tasks (Phase 24–30) | Reference only |
| `PLAN-archive.md` | Completed phase specs (Phase 24–30) | Reference only |

**Keywords:** story quality, dual-agent, tier, gate.json, quality scoring, deploy, subagent, narrative pipeline

Read `NEXT.md` first (~60 lines), then load TODO/PLAN sections only for the active task.
