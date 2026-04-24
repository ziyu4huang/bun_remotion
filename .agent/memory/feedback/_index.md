---
name: feedback-index
description: Full index of all feedback/lesson files in .agent/memory/feedback/ — read relevant ones before working on matching tasks
type: reference
---

# Feedback Index

Read relevant files before working on matching topics. Files are self-contained.

## Remotion / Animation
- shared-component-architecture — Unified @bun-remotion/shared: CharacterSprite, DialogBox, ComicEffects — use `emotion` not `pose`, import from shared
- character-facing-convention — ALL galgame character images face LEFT by default, Remotion flip rules by side position
- remotion-sequence-name — Always use name prop on Sequence for readable Studio timeline
- remotion-no-symlinks — Remotion static server can't follow symlinks — always copy files for public/ assets
- dialog-audio-sync — Proportional dialog timing via segment-durations.json + getLineIndex()
- battle-effects-ep2 — Battle FX: AnimatedLine, EnergyWave, KamehamehaBeam, ScreenShake
- weapon-forger-ep2-lessons — ScreenShake undefined delay = black frames, fadeOut durationInFrames, elder image prop
- my-core-is-boss-ep1-lessons — normalizeEffects export, deterministic ScreenShake, SceneIndicator extraction
- episode-polish-checklist — Post-scaffold polish: effect pacing (≤50%), background variety, title hook, outro QuestBadge
- dialog-name-plate-sizing — Dialog name plate dimensions and positioning
- sequential-render — Sequential render ordering requirements
- sequential-tts-render — Sequential TTS + render pipeline ordering

## Testing / Verification
- no-playwright-visual-verify — Don't use Playwright + image analysis to verify Remotion layout — trust math, let user verify
- no-duplicate-tool-runs — Don't re-run long commands (render, build) that already completed — check output instead

## Tooling / Workflow
- skill-creation — Skill structure: v2 load-on-demand (SKILL.md + engines/ + platforms/ + env-check.md)
- generate-image-skill — Lessons learned: browser_run_code for batch, Escape overlay, aria-label selectors
- no-cd-in-bash — Never cd in Bash tool — CWD persists across calls causing silent failures
- parallel-bash-failure-cascade — Isolate risky Bash calls; one failure cancels all parallel siblings
- always-update-roadmap — After ANY dev step: update NEXT.md + TODO.md. Mandatory.
- cli-cwd-bug-fix — storygraph CLI delegate commands had wrong CWD and resolved flag values as paths
- cross-skill-roadmap-update — After ANY dev: update NEXT/TODO/PLAN in ALL related skills + bun_apps
- plan-todo-sync-enforcement — Episode PLAN.md + workspace sections drift — sync check runs first in episode-setup
- plan-md-for-series — PLAN.md structure requirements for series
- plan-doc-sync — Keeping plan docs synchronized across skills

## Storygraph / Pipeline
- storygraph-story-kg — Story KG pipeline: subagent for NL analysis, federated merge, Playwright verify
- storygraph-phase23-lessons — Storygraph Phase 2-3 specific lessons
- storygraph-v0.4-reflection — Storygraph v0.4 reflection and improvements
- use-storygraph-skill — When and how to use the storygraph skill
- graphify-query-explain-lessons — querying graph.json: links vs edges, node ID disambiguation
- graphify-windows-lessons — graphify v0.3.20 on Windows: extension patching, tree-sitter API, encoding
- gate-section-language — Language conventions for gate.json sections
- pipeline-step-skipping — Pipeline step skipping and error handling

## Image Generation
- galimage-gen — Galgame char images: always generate transparent BG + half-body upfront, never post-process
- zai-image-gen — z.ai image generation lessons
- galgame-video-lessons — AI can't make transparent PNGs (use rembg), TTS must match dialog, solid BGs cause black frames
- cdp-browser-policy — ALWAYS use CDP (connectOverCDP) for external web resources like z.ai. Never launch Playwright-controlled Chrome for login-required sites.

## Content / Series
- galgame-auto-workflow — Automated galgame episode workflow
- confirm-format-zhtw — When presenting episode content for user confirmation, show all story/dialog in zh_TW
- fixture-to-assets-migration — SOP: fixture→assets rename + story guides + genre presets

## Audio / TTS
- tts-voices — TTS voice configuration and selection
