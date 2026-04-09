---
name: remotion-sequence-name
description: Always use name prop on Sequence/Series.Sequence for readable Studio timeline
type: feedback
---

Always add a `name` prop to every `<Sequence>` and `<Series.Sequence>` in Remotion. Without it, the Studio timeline displays `<Sequence>` for all segments, making it impossible to distinguish scenes.

**Why:** We hit this in claude-code-intro where 5 scenes all showed as `<Sequence>` in the web UI. Adding `name="Title"`, `name="Features"`, etc. made the timeline immediately readable.

**How to apply:** When scaffolding new compositions or scenes, always include a `name` field in the scene config array and pass it as `<Sequence name={name}>`. Updated the remotion-best-practices skill sequencing.md rule with this pattern.
