# NEXT.md — mflux Next Actions

## Priority 1: Speed (immediate impact)

**Goal:** Reduce generation time from ~51s to under 30s.

1. Benchmark step counts 2-6 with identical seed/prompt → find quality floor
2. Test `z-image-turbo` model — designed for speed, may beat klein-4b
3. Test pre-quantized model (`filipstrand/Z-Image-Turbo-mflux-4bit`) — skips on-the-fly quantization

## Priority 2: Memory (enables larger resolutions)

**Goal:** Enable 768×512 or 1024×512 generation without OOM.

1. Profile memory by phase (load → encode → diffuse → decode)
2. Test 3-bit quantization — quality hit may be acceptable for prototyping
3. Test `--mlx-cache-limit-gb 1.5` — more aggressive eviction
4. Test 384×384 for rapid iteration mode

## Priority 3: Skill Integration

**Goal:** Seamless `/generate-image mflux` experience.

1. Add mflux backend to `/generate-image` skill
2. Auto-create `./output/mflux/` directory
3. Sequential file naming (mflux-001.png, mflux-002.png, ...)
4. Auto-detect macOS + Apple Silicon before offering mflux option
