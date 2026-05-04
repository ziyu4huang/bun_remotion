# bun_tts — TODO

> **v0.1.0** — Stable. Full history → GitHub issues #32, #38, #39

## Open

| Priority | Issue | GitHub |
|----------|-------|--------|
| P0 | Error recovery + configurable throttle + pipeline tests | #38 |
| P2 | Parallel segments + MP3 output + progress events + setup script | #39 |

## Known Issues

- mlx_tts subprocess crashes leave partial files (fixed in #38)
- Throttle delays hardcoded 1500/2000ms (fixed in #38)
- Sequential-only generation (fixed in #39)
- WAV only, no compression (fixed in #39)
