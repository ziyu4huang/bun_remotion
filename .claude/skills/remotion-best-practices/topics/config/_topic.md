# Config

Compositions, dynamic metadata, Zod parameter schemas, and Tailwind.

---

## compositions -- `<Composition>`, `<Still>`, `<Folder>`
- `<Composition>` requires `id`, `component`, `durationInFrames`, `fps`, `width`, `height` in `src/Root.tsx`.
- `defaultProps` must be JSON-serializable; use `type` (not `interface`) for props. `<Still>` omits duration/fps. `<Folder>` organizes sidebar.
- For details, read `compositions.md`.

---

## calculate-metadata -- Dynamic duration, dimensions, props
- Runs once before rendering; returns `durationInFrames`, `width`, `height`, `fps`, `props`, `defaultOutName`, `defaultCodec`.
- Use with `getVideoDuration()`/`getVideoDimensions()`. Pass `abortSignal` to cancel stale Studio requests.
- For details, read `calculate-metadata.md`.

---

## parameters -- Zod schemas for editable props
- Add `schema` (top-level `z.object()`) to `<Composition>`. Props become editable in Studio sidebar.
- Use `zColor()` from `@remotion/zod-types` for color picker inputs.
- For details, read `parameters.md`.

---

## tailwind -- TailwindCSS in Remotion
- Never use `transition-*` or `animate-*` classes; animate via `useCurrentFrame()`.
- For details, read `tailwind.md`.

---

## Cross-References
- Related: `../utilities/get-video-duration.md` -- feed into `calculateMetadata`
- Related: `../utilities/get-video-dimensions.md` -- match composition to video resolution
