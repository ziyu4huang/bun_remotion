---
name: triage-label-mapping
description: GitHub label to bun_app directory mapping for triage
type: reference
updated: 2026-05-03
---

# Triage Label Mapping

## bun_app Labels

| Label | Directory | Description |
|-------|-----------|-------------|
| `storygraph` | `bun_app/storygraph/` | Knowledge graph extraction + quality scoring |
| `bun_image` | `bun_app/bun_image/` | AI image generation (ZAI/GLM/Gemini) |
| `bun_tts` | `bun_app/bun_tts/` | Text-to-speech generation |
| `bun_pi_agent` | `bun_app/bun_pi_agent/` | Claude Code agent tools |
| `remotion_types` | `bun_app/remotion_types/` | Shared TypeScript types for Remotion |
| `remotion_studio` | `bun_remotion_proj/remotion_studio/` | Remotion Studio web UI |
| `episodeforge` | `bun_remotion_proj/episodeforge/` | Episode generation pipeline |

## Usage

When triaging issues, use this mapping to:
1. Filter issues by app label (`--label <label>`)
2. Locate relevant codebase directories
3. Map issue context to project structure