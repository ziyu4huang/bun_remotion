---
name: sequencing
description: Sequencing patterns for Remotion - delay, trim, limit duration of items
metadata:
  tags: sequence, series, timing, delay, trim
---

Use `<Sequence>` to delay when an element appears in the timeline.

```tsx
import { Sequence } from "remotion";

const {fps} = useVideoConfig();

<Sequence from={1 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Title />
</Sequence>
<Sequence from={2 * fps} durationInFrames={2 * fps} premountFor={1 * fps}>
  <Subtitle />
</Sequence>
```

## Always set the `name` prop

Without a `name` prop, Remotion Studio displays `<Sequence>` for every segment in the timeline — making it impossible to tell scenes apart at a glance. Always provide a short, human-readable label:

```tsx
// ❌ Shows as "<Sequence>" in the Studio timeline
<Sequence from={0} durationInFrames={180}>
  <TitleScene />
</Sequence>

// ✅ Shows as "Title" in the Studio timeline
<Sequence from={0} durationInFrames={180} name="Title">
  <TitleScene />
</Sequence>
```

This is especially important when mapping over scene arrays:

```tsx
const scenes = [
  { Scene: TitleScene,    audio: "audio/01-title.mp3",    name: "Title" },
  { Scene: FeaturesScene, audio: "audio/02-features.mp3", name: "Features" },
  { Scene: TerminalScene, audio: "audio/03-terminal.mp3", name: "Terminal" },
];

{scenes.map(({ Scene, audio, name }, i) => (
  <Sequence key={i} from={starts[i]} durationInFrames={d(i)} name={name}>
    <Scene />
    <Audio src={staticFile(audio)} volume={1} />
  </Sequence>
))}
```

The `name` also works on `<Series.Sequence>`:

```tsx
<Series>
  <Series.Sequence durationInFrames={45} name="Intro">
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60} name="Main Content">
    <MainContent />
  </Series.Sequence>
</Series>
```

This will by default wrap the component in an absolute fill element.  
If the items should not be wrapped, use the `layout` prop:

```tsx
<Sequence layout="none">
  <Title />
</Sequence>
```

## Premounting

This loads the component in the timeline before it is actually played.  
Always premount any `<Sequence>`!

```tsx
<Sequence premountFor={1 * fps}>
  <Title />
</Sequence>
```

## Series

Use `<Series>` when elements should play one after another without overlap.

```tsx
import { Series } from "remotion";

<Series>
  <Series.Sequence durationInFrames={45}>
    <Intro />
  </Series.Sequence>
  <Series.Sequence durationInFrames={60}>
    <MainContent />
  </Series.Sequence>
  <Series.Sequence durationInFrames={30}>
    <Outro />
  </Series.Sequence>
</Series>;
```

Same as with `<Sequence>`, the items will be wrapped in an absolute fill element by default when using `<Series.Sequence>`, unless the `layout` prop is set to `none`.

### Series with overlaps

Use negative offset for overlapping sequences:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneA />
  </Series.Sequence>
  <Series.Sequence offset={-15} durationInFrames={60}>
    {/* Starts 15 frames before SceneA ends */}
    <SceneB />
  </Series.Sequence>
</Series>
```

## Frame References Inside Sequences

Inside a Sequence, `useCurrentFrame()` returns the local frame (starting from 0):

```tsx
<Sequence from={60} durationInFrames={30}>
  <MyComponent />
  {/* Inside MyComponent, useCurrentFrame() returns 0-29, not 60-89 */}
</Sequence>
```

## Nested Sequences

Sequences can be nested for complex timing:

```tsx
<Sequence from={0} durationInFrames={120}>
  <Background />
  <Sequence from={15} durationInFrames={90} layout="none">
    <Title />
  </Sequence>
  <Sequence from={45} durationInFrames={60} layout="none">
    <Subtitle />
  </Sequence>
</Sequence>
```

## Nesting compositions within another

To add a composition within another composition, you can use the `<Sequence>` component with a `width` and `height` prop to specify the size of the composition.

```tsx
<AbsoluteFill>
  <Sequence width={COMPOSITION_WIDTH} height={COMPOSITION_HEIGHT}>
    <CompositionComponent />
  </Sequence>
</AbsoluteFill>
```
