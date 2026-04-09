# Scene Preview — ClaudeCodeIntro

ASCII layout for each scene. Subtitles = voiceover narration spoken to viewer.

---

## Scene 1 — TitleScene  `[f0–f150+]`

```
┌──────────────────────────────────────── 1920×1080 ──────────────────────────────────────────┐
│                                                                                              │
│   · ·  ·    ·     ·  · ·     ·    ·  ·       ← 12 floating orange particles, subtle drift  │
│                                                                                              │
│                             ╭───────────╮                                                   │
│                             │           │                                                   │
│                             │    ⟨C⟩    │  ← 120×120 circle, orange border + glow          │
│                             │           │    springs in from scale 0.6 → 1.0               │
│                             ╰───────────╯                                                   │
│                                                                                              │
│                      ████████ Claude  Code ████████                                         │
│                      ↑ 80px bold, "Claude"=#D97757, "Code"=white                            │
│                                                                                              │
│                      ───────────────────────────────   ← divider, grows 0→320px             │
│                                                                                              │
│                       YOUR AI CODING COMPANION                                              │
│                       ↑ 28px, muted white, letter-spaced                                    │
│                                                                                              │
│                       An agentic coding tool that lives in your terminal                    │
│                       ↑ 20px, dim                                                           │
│                                                                                              │
│  Background: radial dark warm gradient (#1a1410 → #0d0d0d)                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Narration (en-US-AriaNeural):**
> "Meet Claude Code — your AI coding companion, built right into your terminal."

**Animation sequence:**
- f0–25: logo springs in (scale + opacity)
- f20–45: title fades + slides up
- f40–60: subtitle fades in
- f55–80: divider grows left→right
- f75–95: tagline fades in

---

## Scene 2 — FeaturesScene  `[f150–f330+]`

```
┌──────────────────────────────────────── 1920×1080 ──────────────────────────────────────────┐
│                                                                                              │
│                            What Can It  ████Do████?                                        │
│                                       ──────────── ← underline grows 0→200px               │
│                                                                                              │
│   ╔══════════════╗  ╔══════════════╗  ╔══════════════╗  ╔══════════════╗                   │
│   ║  ┌────────┐  ║  ║  ┌────────┐  ║  ║  ┌────────┐  ║  ║  ┌────────┐  ║                   │
│   ║  │  >_    │  ║  ║  │  { }   │  ║  ║  │  / ?   │  ║  ║  │  MR    │  ║                   │
│   ║  └────────┘  ║  ║  └────────┘  ║  ║  └────────┘  ║  ║  └────────┘  ║                   │
│   ║              ║  ║              ║  ║              ║  ║              ║                   │
│   ║ Terminal     ║  ║ Code         ║  ║ Ask          ║  ║ Full Stack   ║                   │
│   ║ Native       ║  ║ Understanding║  ║ Anything     ║  ║              ║                   │
│   ║              ║  ║              ║  ║              ║  ║              ║                   │
│   ║ Lives in     ║  ║ Reads,       ║  ║ Natural      ║  ║ Frontend,    ║                   │
│   ║ your CLI,    ║  ║ writes,      ║  ║ language     ║  ║ backend,     ║                   │
│   ║ understands  ║  ║ edits across ║  ║ to code,     ║  ║ infra —      ║                   │
│   ║ your project ║  ║ your codebase║  ║ instantly    ║  ║ handles all  ║                   │
│   ╚══════════════╝  ╚══════════════╝  ╚══════════════╝  ╚══════════════╝                   │
│       ↑ 340×wide cards, glass bg, staggered spring-in (delay +15f each)                     │
│                                                                                              │
│  Background: radial gradient #151210 → #0d0d0d                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Narration (en-US-AriaNeural):**
> "It reads your entire codebase, writes and refactors code, and answers any question you ask — in plain English."

**Animation sequence:**
- f0–20: section title fades + slides up
- f15–35: underline grows
- f25, f40, f55, f70: each card springs in (staggered)

---

## Scene 3 — TerminalScene  `[f330–f540+]`

```
┌──────────────────────────────────────── 1920×1080 ──────────────────────────────────────────┐
│                                                                                              │
│                               See It In  ████Action████                                     │
│                               ↑ 36px, appears f0–20                                        │
│                                                                                              │
│       ┌──────────────────────────────────────────────────────────────────────┐              │
│       │ 🔴 🟡 🟢   claude — ~/my-awesome-app                               │  ← title bar  │
│       ├──────────────────────────────────────────────────────────────────────┤              │
│       │                                                                      │              │
│       │  $ claude                                                            │              │
│       │                                                                      │              │
│       │    Welcome to Claude Code!                          ← #D97757        │              │
│       │    Connected to project: my-awesome-app             ← dim           │              │
│       │                                                                      │              │
│       │    > Refactor the auth middleware to use JWT        ← user input    │              │
│       │                                                                      │              │
│       │    Analyzing auth middleware...                     ← #D97757        │              │
│       │    Reading src/middleware/auth.ts                   ← dim           │              │
│       │    Found 3 files to update                         ← dim           │              │
│       │                                                                      │              │
│       │    ✓ Updated auth.ts — added JWT validation        ← #7ec699 green  │              │
│       │    ✓ Updated routes.ts — integrated new middleware ← #7ec699        │              │
│       │    ✓ Updated tests/auth.test.ts — 12 tests passing ← #7ec699        │              │
│       │                                                                      │              │
│       │    Done. 3 files changed, all tests passing.       ← #D97757        │              │
│       │                                                                      │              │
│       │    █  ← blinking cursor                                              │              │
│       └──────────────────────────────────────────────────────────────────────┘              │
│         ↑ 1100px wide, scale 0.92→1.0, each line fades in every 12 frames                  │
│                                                                                              │
│  Background: radial #141210 → #0a0a0a                                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Narration (en-US-AriaNeural):**
> "Watch it in action. Claude Code reads the auth middleware, rewrites it for JWT, updates the routes, and runs every test — done in seconds."

**Animation sequence:**
- f0–25: terminal window fades + scales in
- f0–20: label fades in
- f20+: terminal lines appear one by one (every 12 frames)

---

## Scene 4 — OutroScene  `[f540–f660+]`

```
┌──────────────────────────────────────── 1920×1080 ──────────────────────────────────────────┐
│                                                                                              │
│                         ░░░░░░░░░░░░░░░░░░░░                                               │
│                        ░  radial orange glow  ░  ← 300×300 backdrop                        │
│                         ░░░░░░░░░░░░░░░░░░░░                                               │
│                                                                                              │
│                              ╭─────────╮                                                   │
│                              │   ⟨C⟩   │  ← 90×90 circle, smaller than title              │
│                              ╰─────────╯    springs in scale 0.8 → 1.0                     │
│                                                                                              │
│                   Start Building with  ████Claude Code████                                  │
│                   ↑ 44px bold, slides up f15–35                                             │
│                                                                                              │
│                            claude.ai/code                                                   │
│                            ↑ 20px, dim, f35–55                                              │
│                                                                                              │
│            ╔══════════════════════════════════════════════════════╗                         │
│            ║  $ npm install -g @anthropic-ai/claude-code          ║                        │
│            ╚══════════════════════════════════════════════════════╝                         │
│              ↑ orange-tinted box, 22px, f55–75                                              │
│                                                                                              │
│                          ↓ global fade-out f95→120                                          │
│                                                                                              │
│  Background: radial #1a1410 → #0d0d0d → #080808                                             │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Narration (en-US-AriaNeural):**
> "Ready to get started? Install Claude Code and start building smarter today."

**Animation sequence:**
- f0–20: logo fades in
- f0–25: logo springs in
- f15–35: tagline slides up
- f35–55: link fades in
- f55–75: install command fades in
- f95–120: global fade out

---

## Duration Summary

| Scene | Default frames | Duration | Narration chars | Est. audio |
|-------|---------------|----------|-----------------|------------|
| TitleScene | 150 | 5.0s | ~70 chars | ~5s |
| FeaturesScene | 180 | 6.0s | ~90 chars | ~6s |
| TerminalScene | 210 | 7.0s | ~100 chars | ~7s |
| OutroScene | 120 | 4.0s | ~65 chars | ~5s |
| **Total** | **660** | **22.0s** | | **~23s** |

> Duration is dynamic via `calculateMetadata` — final length driven by actual audio files.
> Engine: edge-tts (en-US-AriaNeural) · MP3 output · no rate limits
