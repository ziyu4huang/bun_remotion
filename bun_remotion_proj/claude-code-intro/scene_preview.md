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

---

## Scene 5 — FusionScene  `[f660–f870+]`  ⚡ DISCUSSION DRAFT ⚡

**Concept:** "Download a cool animation image — fuse with Claude Code — shock the world!"
A downloaded generative-AI / cosmic art image slams in from the void, merges with the Claude
logo in a burst of electric energy, and the whole frame erupts: "Claude Code × AI = ∞".

```
┌──────────────────────────────────────── 1920×1080 ──────────────────────────────────────────┐
│  [f0–f25]  BLACK — anticipation hold                                                         │
│                                                                                              │
│  [f25–f60]  IMAGE DOWNLOAD REVEAL                                                            │
│                                                                                              │
│  ╔══════════════════════════════════════════════════════════════════════════════════════════╗ │
│  ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║ │
│  ║  ░  🌌  COSMIC GENERATIVE ART (downloaded via staticFile / Img)  🌌             ░  ║ │
│  ║  ░      nebula swirls · neon fractals · deep-space palette                      ░  ║ │
│  ║  ░      e.g. Midjourney "cosmic neural network" or CC0 art from Unsplash        ░  ║ │
│  ║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ║ │
│  ╚══════════════════════════════════════════════════════════════════════════════════════════╝ │
│      ↑ fullscreen <Img> animates: scale 1.4→1.0 + blur 20px→0 (f25–60), dramatic zoom-out   │
│      progress bar at top: "Downloading..." 0%→100% sweeps left→right (f0–f25) [glitch style] │
│                                                                                              │
│  [f60–f110]  FUSION STRIKE — logo materializes from image energy                            │
│                                                                                              │
│              ╭──────────────────────────────────╮                                           │
│              │    ⚡  ╭───────────────╮  ⚡      │  ← electric arcs (CSS box-shadow          │
│              │   ⚡   │               │   ⚡     │    + multi-layer radial glow)              │
│              │  ⚡    │     ⟨C⟩       │    ⚡    │  ← 180×180 logo, springs in               │
│              │   ⚡   │               │   ⚡     │    scale 0→1.2→1.0, orange+white          │
│              │    ⚡  ╰───────────────╯  ⚡      │                                           │
│              ╰──────────────────────────────────╯                                           │
│                       ↑ logo slams onto image center; shockwave ring expands outward         │
│                         ring: border-radius 50%, scale 0→3, opacity 1→0 (f65–f90)           │
│                                                                                              │
│                    ·  ·  *  ·  ✦  ·  *  ·  ·   ← 30 particle sparks (random trajectories)  │
│                    ↑ burst from logo center at f65, fade by f100 (random dx/dy interpolate)  │
│                                                                                              │
│  [f110–f160]  TEXT SHOCK — stacked reveal                                                   │
│                                                                                              │
│                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                                   │
│                ░                                        ░                                   │
│                ░    C L A U D E   C O D E               ░  ← 96px, letter-spaced            │
│                ░    ×  AI  ART   =   ∞                  ░  ← 72px, #D97757 × white          │
│                ░                                        ░    slides up f110–f130             │
│                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                                   │
│                  ↑ semi-transparent dark pill / glass card overlays image                    │
│                                                                                              │
│  [f160–f200]  GLITCH FLASH + "SHOCKING THE WORLD" STAMP                                     │
│                                                                                              │
│     ╔══════════════════════════════════════════════════════════════════════════════╗         │
│     ║  ░▓░▒░▓░▒   S H O C K I N G   T H E   W O R L D   ░▒░▓░▒░▓░              ║         │
│     ╚══════════════════════════════════════════════════════════════════════════════╝         │
│       ↑ full-width stamp bar, #D97757 bg, white text, 56px bold, UPPERCASE                  │
│         glitch: RGB channel offset (translateX ±4px on R/G/B layers) for 3 frames           │
│         then settles at f175, holds until scene end                                          │
│                                                                                              │
│  [f190–f210]  GLOBAL FLASH → fade to dark                                                   │
│     white flash opacity 0→0.8→0 over 6 frames (f190–f196), then scene fades out f200–f210  │
│                                                                                              │
│  Background layers (back→front):                                                             │
│    1. cosmic art image (full bleed)                                                          │
│    2. radial vignette overlay (#000 edges, transparent center)                               │
│    3. subtle scanline overlay (5% opacity CSS repeating linear-gradient)                     │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Narration (en-US-AriaNeural):**
> "Claude Code doesn't just write code — it reshapes what's possible. The future of AI and creativity, fused together. Shocking the world."

**Animation sequence:**
- f0–25: progress bar sweeps "Downloading…" across top edge (glitch aesthetic)
- f25–60: cosmic image slams in, scale 1.4→1.0 + blur 20→0px
- f60–65: brief hold — logo coalesces from image energy
- f65–90: logo springs in (scale 0→1.2→1.0) + shockwave ring expands outward
- f65–100: 30 spark particles burst from logo center
- f110–130: "CLAUDE CODE × AI ART = ∞" glass card slides up
- f160–175: "SHOCKING THE WORLD" stamp bar drops in from top
- f160–175: RGB glitch flicker (3-frame channel offset)
- f190–196: white flash
- f200–210: scene fade-out

**Assets needed:**
- [ ] `public/cosmic-art.jpg` — source image (CC0 or generated; target: neon nebula / neural fractal)
  - Option A: download from Unsplash/Pixabay (free-to-use)
  - Option B: generate with `/generate-image` skill (Gemini Imagen)
  - Option C: Lottie animation file (`.json`) from LottieFiles — plays in-scene via `@remotion/lottie`
- [ ] glitch utility (CSS filter / inline style channel split — no extra dep needed)
- [ ] shockwave ring component (pure CSS, no extra dep)

**Implementation notes:**
- Use `<Img src={staticFile("cosmic-art.jpg")} />` inside `<AbsoluteFill>`
- Glitch: render 3 copies of text with `mix-blend-mode: screen`, each offset by `interpolate(f, [160,163], [0,4])` on X
- Shockwave: `<div style={{ borderRadius:'50%', border:'3px solid #D97757', transform:\`scale(${ring})\`, opacity:${ringOpacity} }} />`
- Particles: array of 30 `{angle, speed}` seeds, each `interpolate`d from center outward

---

## Duration Summary

| Scene | Default frames | Duration | Narration chars | Est. audio |
|-------|---------------|----------|-----------------|------------|
| TitleScene | 150 | 5.0s | ~70 chars | ~5s |
| FeaturesScene | 180 | 6.0s | ~90 chars | ~6s |
| TerminalScene | 210 | 7.0s | ~100 chars | ~7s |
| OutroScene | 120 | 4.0s | ~65 chars | ~5s |
| **FusionScene** *(draft)* | **210** | **7.0s** | **~90 chars** | **~6s** |
| **Total (4 scenes)** | **660** | **22.0s** | | **~23s** |
| **Total (+ FusionScene)** | **870** | **29.0s** | | **~29s** |

> Duration is dynamic via `calculateMetadata` — final length driven by actual audio files.
> Engine: edge-tts (en-US-AriaNeural) · MP3 output · no rate limits
