## Remotion Development Conventions

### Code Quality Rules

- **No CSS transitions or animations** — All animations must use `useCurrentFrame()`. CSS `transition` and `@keyframes` are forbidden.
- **No Node.js built-in imports in `src/`** — Use browser-compatible APIs only.
- **Sequence components need `name` props** — All `<Sequence>` and `<TransitionSeries.Sequence>` must have a `name` prop.
- **Audio uses `require()` not `staticFile()`** — Always use `require()` for audio file references.
- **Shared imports from `@bun-remotion/shared`** — Never duplicate shared code; always import from the shared package.

### Episode Structure

- **Episode ID format**: `<series>-ch<N>-ep<M>` (e.g., `weapon-forger-ch1-ep1`).
- **Content source**: Use `dialogLines[]` for narrative/galgame categories. Use `narration_script` for tech_explainer/data_story categories.

### Quality Thresholds

- **PASS**: Gate score >= 70, no individual dimension below 40, no regression.
- **WARN**: Gate score 40-69, or any dimension below 40, or minor regression.
- **FAIL**: Gate score < 40, or critical structural issues, or significant regression.

### Content Quality Criteria

- Every defined character should appear in at least 30% of episodes.
- Running gags should evolve at least every 2 episodes.
- Episode pacing should be within 1.5 standard deviations of series mean.
