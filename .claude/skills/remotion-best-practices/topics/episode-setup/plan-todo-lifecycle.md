---
name: plan-todo-lifecycle
description: Stable templates and update rules for workspace PLAN.md, workspace TODO.md, and episode TODO.md — prevents data loss during episode creation
metadata:
  tags: PLAN, TODO, lifecycle, template, pipeline, episode, series
---

# PLAN/TODO Lifecycle — Stable Templates & Update Rules

Three files track every series. Each has a **fixed section order** and **update triggers**.
Follow these rules to prevent data loss and keep files in sync.

---

## File Roles

| File | Level | Role | Source of truth for |
|------|-------|------|-------------------|
| `PLAN.md` | Workspace | Series bible | Characters, arcs, episode guide, commands, style rules |
| `TODO.md` | Workspace | Phased progress tracker | Which episodes exist, overall completion status |
| `TODO.md` | Episode folder | Task checklist | Per-episode scaffold progress (what's done, what's left) |

**Rule: PLAN.md is ALWAYS the source of truth.** TODOs reflect PLAN status, never the reverse.

---

## Workspace PLAN.md — Section Order (stable, never reorder)

Numbered for reference. A real PLAN.md does NOT need section numbers — these are for this spec only.

| # | Section | Content | Update trigger |
|---|---------|---------|---------------|
| 1 | Header + description | Series name, one-line description, tone | Only at creation |
| 2 | Story Background | World-building, setting, lore | Only at creation, or when expanding lore for later chapters |
| 3 | Characters table | name, voice, color, image per character | **New character introduced** (e.g., chenmo in Ch8) |
| 4 | Character Descriptions | Personality text per character | New character, or after significant character development |
| 5 | Emotion Image System | Emotion set, character emotion map, how it works | Only at creation (shared across all episodes) |
| 6 | Project Structure | Directory layout, file naming, import conventions | New shared component added to assets/ |
| 7 | Episode Guide (short) | Summary table — episode, title, language, characters, **status** | **Every new episode** + **every status change** |
| 8 | Adding a New Episode | Workflow summary + file checklist | Rarely (only when workflow changes) |
| 9 | Commands | Studio, render, TTS commands for all episodes | **Every new episode** |
| 10 | Story Arcs | Per-chapter/episode story summaries | **Every new episode** |
| 11 | Episode Guide (full) | Expanded table with Ch/Ep columns, all episodes | **Every new episode** + **every status change** |
| 12 | Running Gags / Signatures | Per-episode gag evolution table (if applicable) | **Every new episode** (chapter-based series) |
| 13 | Style Notes | Font, color, transition conventions | Only at creation |

### Status values

| Status | Meaning |
|--------|---------|
| `Planned` | Listed in story arcs, not yet scaffolded |
| `Scaffolding` | Episode directory created, some files exist, not yet complete |
| `Scaffolding Complete` | All source files written, TTS generated, ready for Studio verify |
| `Complete` | Rendered MP4, done |

### Update rules for PLAN.md

**When adding a new episode**, update these sections (in this order):
1. Story Arcs — add the episode's story summary under the correct chapter
2. Episode Guide (short) — add new row with `Scaffolding` status
3. Episode Guide (full) — add new row with `Scaffolding` status
4. Commands — add studio/render/TTS lines
5. Running Gags — add new column (if chapter-based series)

**When episode status changes** (e.g., scaffolding done, or MP4 rendered):
1. Episode Guide (short) — update status cell
2. Episode Guide (full) — update status cell

**When a new character appears** (rare, usually planned):
1. Characters table — add row
2. Character Descriptions — add paragraph
3. Emotion Image System — add character emotion map block
4. Image Generation Progress — add row

**Never:**
- Never delete a completed episode row from Episode Guide tables
- Never reorder sections
- Never remove Running Gag columns for past episodes
- Never move commands — always append

---

## Workspace TODO.md — Section Order (stable)

| # | Section | Content | Update trigger |
|---|---------|---------|---------------|
| 1 | Phase 1: Foundation | Shared assets (images, components, scripts) | Check off as each shared asset is done |
| 2 | Phase 2: First Episode | First episode's full task list | Check off as first episode progresses |
| 3 | Phase 2.5+: Subsequent episodes | One sub-section per episode (inline) | **Every new episode** |
| 4 | Phase N: Future chapters | Planned but not started | Rarely |

### Template for workspace TODO.md

```markdown
# TODO — <Series Name> (<Series Name ZH>)

## Phase 1: Foundation

- [ ] PLAN.md — story, characters, emotions, project structure
- [ ] Character JSON manifests (N emotion configs)
- [ ] Background JSON manifests (N scene configs)
- [ ] Character images (N PNGs)
- [ ] Background images (N PNGs)
- [ ] Fixture shared components (list them)
- [ ] sync-images.sh script
- [ ] generate-tts.ts script (shared, multi-voice)

## Phase 2: Ch1-EP1 — <Title>

- [ ] Write narration.ts
- [ ] Scaffold episode (package.json, tsconfig, index.ts, Root.tsx)
- [ ] TitleScene.tsx
- [ ] ContentScene1.tsx
- [ ] ContentScene2.tsx
- [ ] OutroScene.tsx
- [ ] Main component (TransitionSeries)
- [ ] Update scripts/dev.sh (ALL_APPS + get_comp_id)
- [ ] Update root package.json (start/build/generate-tts scripts)
- [ ] Run sync-images.sh to copy assets images
- [ ] Run `bun install` to link workspace
- [ ] Code review
- [ ] Generate TTS
- [ ] Verify in Remotion Studio
- [ ] Render MP4

## Phase 2.5: Ch1-EP2 — <Title>

- [ ] Write narration.ts (N scenes: ...)
- [ ] Scaffold episode
- [ ] All scene components
- [ ] Update dev.sh + package.json
- [ ] Run sync-images.sh + bun install
- [ ] Generate TTS
- [ ] Verify in Remotion Studio
- [ ] Render MP4

## Phase 3: Remaining Ch1 Episodes

- [ ] Ch1-EP3 — <Title> (<characters>)
- [ ] Ch1-EP4 — <Title> (<characters>) (if applicable)

## Phase 4: Ch2+ (Future)

- [ ] Ch2 (N ep) — <chapter title>
- [ ] Ch3 (N ep) — <chapter title>
```

### Update rules for workspace TODO.md

**When starting a new episode:**
1. Add a `## Phase N.N: ChX-EPY — Title` sub-section above the "Remaining" phase
2. Copy the task checklist from the template
3. The "Remaining" phase keeps only unstarted episodes as single-line items

**When completing tasks within an episode:**
1. Check off `[x]` for completed tasks
2. Do NOT remove completed tasks — they serve as audit trail

**When an episode is fully rendered:**
1. All items in that episode's section should be `[x]`
2. Update the "Remaining" section to remove the completed episode
3. Do NOT delete the completed episode section — it stays as history

**Consistency check — workspace TODO vs PLAN.md Episode Guide:**
- If PLAN.md says `Scaffolding Complete`, workspace TODO should have all scaffold tasks checked
- If PLAN.md says `Complete`, workspace TODO should have ALL tasks including "Render MP4" checked
- The "Remaining" section should match PLAN.md episodes with `Planned` status

---

## Episode TODO.md — Section Order (stable)

| # | Section | Content | Update trigger |
|---|---------|---------|---------------|
| 1 | Header + Story | Title, 2-3 line summary, characters, language, chapter | Only at creation |
| 2 | Setup Tasks | Checklist of all scaffold steps | Check off as each step completes |
| 3 | Remaining | Tasks not yet done (Studio verify, render) | When all scaffold tasks are done |

### Template for episode TODO.md

```markdown
# TODO — <Series ZH> <ChapterLabel><EpisodeLabel>：<Title ZH>

## Story

<2-3 line zh_TW story summary>

Characters: <id1>, <id2>, ...
Language: zh-TW (Traditional Chinese)
Chapter: 第<N>章：<Chapter Title>（第<M>/<K>集）

## Setup Tasks

- [x] Create TODO.md
- [ ] Write narration.ts (<N> scenes: Title, Content1-3, Outro)
- [ ] Create package.json
- [ ] Create tsconfig.json
- [ ] Create src/index.ts
- [ ] Create src/Root.tsx
- [ ] Create src/<MainComponent>.tsx
- [ ] Write src/scenes/TitleScene.tsx
- [ ] Write src/scenes/ContentScene1.tsx (<background>: <description>)
- [ ] Write src/scenes/ContentScene2.tsx (<background>: <description>)
- [ ] Write src/scenes/ContentScene3.tsx (<background>: <description>) (if 3 content scenes)
- [ ] Write src/scenes/OutroScene.tsx
- [ ] Update PLAN.md (episode guide + commands)
- [ ] Update scripts/dev.sh ALL_APPS + get_comp_id()
- [ ] Update root package.json with scripts
- [ ] Run sync-images.sh to copy assets images
- [ ] Run `bun install` to link workspace
- [ ] Run `bun run generate-tts:<alias>` to generate audio

## Remaining

- [ ] Verify in Remotion Studio
- [ ] Render final MP4
```

### Update rules for episode TODO.md

**When creating:** All tasks unchecked except "Create TODO.md" which is `[x]`.

**When completing each scaffold step:**
1. Check off `[x]` for that task
2. The task description should match the actual file/command that was run

**When all scaffold tasks are done:**
1. Move "Verify in Remotion Studio" and "Render final MP4" into a `## Remaining` section at the bottom
2. Add a note about generated manifests if TTS was run: e.g., `(durations.json + segment-durations.json + voice-manifest.json)`

**Never:**
- Never remove completed tasks
- Never reorder tasks
- Never change the Story section after creation (unless user changes the story)

---

## Pipeline: How the Three Files Stay in Sync

```
Episode Creation Flow:

1. User approves story
   → Create episode TODO.md         (all unchecked)
   → Write narration.ts, scenes, etc.
   → Check off each task as done

2. Scaffold complete (all source files + TTS)
   → Update episode TODO.md         (all scaffold tasks [x], Remaining section at bottom)
   → Update workspace TODO.md       (check off that episode's tasks)
   → Update PLAN.md Episode Guide   (status → "Scaffolding Complete")

3. Studio verify + render
   → Update episode TODO.md         (all [x])
   → Update workspace TODO.md       (all [x] for that episode)
   → Update PLAN.md Episode Guide   (status → "Complete")
```

### Sync invariant

At any point, these MUST be consistent:

| Condition | PLAN.md Episode Guide | Workspace TODO | Episode TODO |
|-----------|----------------------|----------------|--------------|
| Episode not started | `Planned` | Single-line in "Remaining" | File doesn't exist yet |
| Episode in progress | `Scaffolding` | Phase section with some `[x]` | Some `[x]`, some `[ ]` |
| Scaffold done, not rendered | `Scaffolding Complete` | All scaffold `[x]`, verify/render `[ ]` | All scaffold `[x]`, Remaining has verify + render |
| Episode complete | `Complete` | All `[x]` | All `[x]`, no Remaining |

**If any file is out of sync, fix it immediately.** The sync check takes 10 seconds:
1. Read PLAN.md Episode Guide status
2. Verify workspace TODO matches
3. Verify episode TODO matches
