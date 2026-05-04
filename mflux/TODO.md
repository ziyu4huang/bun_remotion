# TODO.md — mflux Optimization Backlog

## Memory Optimization

- [ ] **Test 3-bit quantization** — `--quantize 3` may further reduce peak memory below 4 GB. Trade-off: image quality degradation. Run A/B test with identical prompts/seeds.
- [ ] **Test resolution 384×384** — smaller resolution should proportionally reduce VAE memory. Useful for rapid prototyping/iteration before final 512×512 render.
- [ ] **Profile memory lifecycle** — use `memory_profiler` or `mlx.core.get_memory_info()` to identify which phase (model load, text encoding, diffusion, VAE decode) consumes the most memory and when.
- [ ] **Test --mlx-cache-limit-gb 1.5** — 2.0 GB is conservative but may not be optimal. Lower limit forces more aggressive eviction but may slow inference.
- [ ] **Explore pre-quantized 4-bit models from HuggingFace** — `filipstrand/Z-Image-Turbo-mflux-4bit` is a pre-quantized model that skips on-the-fly quantization, potentially reducing load-time memory spike.

## Speed Optimization

- [ ] **Benchmark step count vs quality** — 4 steps is the default. Test 2, 3, 5, 6 steps to find the quality/speed sweet spot. With distilled models, even 2 steps may be acceptable for prototyping.
- [ ] **Test z-image-turbo** — 6B model but specifically designed for fast generation. May outperform klein-4b in speed at similar quality.
- [ ] **Warm-start / model caching** — currently each `mflux-generate-flux2` invocation reloads and requantizes the model. Investigate if a long-running Python server could keep the model in memory between generations.
- [ ] **Batch generation** — mflux CLI supports `--seed 42 43 44` for multi-seed generation. Benchmark if generating 4 images in one invocation is faster than 4 separate invocations (amortized model load).
- [ ] **Benchmark flux2-klein-base-4b vs flux2-klein-4b** — the "base" variant may have different speed/quality trade-offs.

## Quality Optimization

- [ ] **Test guidance scale** — default is model-specific. Try `--guidance 1.0` through `--guidance 7.0` to find the best prompt adherence vs diversity trade-off.
- [ ] **Prompt engineering for local models** — FLUX models may respond differently to prompts than cloud APIs (z.ai, AI Studio). Build a prompt comparison matrix.
- [ ] **Post-processing pipeline** — integrate upscaling (mflux has `mflux-upscale-*` commands) and background removal (rembg) for game asset use cases.

## Integration

- [ ] **Add mflux to /generate-image skill** — add as third backend with `mflux`/`flux` trigger keywords.
- [ ] **Default output directory** — enforce `./output/mflux/` as default output location.
- [ ] **Auto-detect macOS** — skill should only offer mflux backend on macOS with Apple Silicon.
- [ ] **Cleanup old output files** — mflux/ directory accumulates output*.png files. Add auto-naming with timestamps or sequential numbering.
