# episodeforge — Episode Scaffold Generator

Generates new Remotion episode directories with all required files, correct naming conventions, and workspace integration.

## Current State (v0.1.0)

- **Working:** CLI scaffolding for 3 series (weapon-forger, my-core-is-boss, galgame-meme-theater)
- **Test Coverage:** None yet (no `*.test.*` files)

## Architecture

```
episodeforge/
  src/
    index.ts          ← CLI entry: parse args → load config → write files → update shared → bun install
    args.ts           ← CLI parsing + validation (--series, --ch, --ep, --scenes, --dry-run)
    series-config.ts  ← SeriesConfig registry (naming, scenes, imports, transitions per series)
    naming.ts         ← NamingContext: derives dirName, packageName, compositionId, scriptAlias
    templates.ts      ← Template generators (package.json, tsconfig, Root.tsx, scenes, narration, TODO.md)
    writer.ts         ← File writer with --dry-run support + verification summary
    updaters.ts       ← Surgical updates to dev.sh (ALL_APPS + get_comp_id) and root package.json
```

## Module Reference

| File | Exports | Lines | Status |
|------|---------|-------|--------|
| index.ts | `main()` | ~92 | Working |
| args.ts | `parseArgs`, `validateArgs`, `showHelp` | ~117 | Working |
| series-config.ts | `SeriesConfig`, `SERIES_REGISTRY`, `getSeriesConfig` | ~111 | Working |
| naming.ts | `NamingContext`, `computeNaming` | ~89 | Working |
| templates.ts | `genPackageJson`, `genTsconfig`, `genIndexTs`, `genRootTsx`, `genMainComponent`, `genTitleScene`, `genContentScene`, `genOutroScene`, `genNarration`, `genTodoMd` | ~787 | Working |
| writer.ts | `collectFiles`, `writeFiles`, `verify` | ~149 | Working |
| updaters.ts | `updateDevSh`, `updateRootPackageJson` | ~99 | Working |

## Dependencies

| Package | Purpose |
|---------|---------|
| (none) | Pure TypeScript/Bun — no external deps |

## Usage

```bash
# From repo root
bun run episodeforge --series galgame-meme-theater --ep 8
bun run episodeforge --series my-core-is-boss --ch 1 --ep 4
bun run episodeforge --series weapon-forger --ch 2 --ep 1 --dry-run
```

## Trigger

Called by the `remotion-best-practices` skill during Episode Setup workflow:
- `topics/episode-setup/episode-creation.md` step 3 (scaffold)
- `topics/episode-setup/scaffolding.md` — manual guide (episodeforge automates it)

## Series Registry

| Series | Chapter-based | Content scenes | Prefix | Alias |
|--------|--------------|----------------|--------|-------|
| weapon-forger | Yes | 2 | Content | wf |
| my-core-is-boss | Yes | 3 | Content | mcb |
| galgame-meme-theater | No (flat) | 4 | Joke | meme |

## Generated Files per Episode

1. `package.json` — workspace package with start/build/generate-tts scripts
2. `tsconfig.json` — extends root tsconfig
3. `src/index.ts` — registerRoot()
4. `src/Root.tsx` — Composition with TTS-driven duration
5. `src/{CompositionId}.tsx` — Main component with TransitionSeries
6. `src/scenes/TitleScene.tsx` — Animated title with gradient, flash, system notification
7. `src/scenes/{Prefix}Scene{1..N}.tsx` — Content scenes with TODO placeholders
8. `src/scenes/OutroScene.tsx` — QuestBadge + teaser
9. `scripts/narration.ts` — Voice-character narration template
10. `TODO.md` — Task checklist

## Side Effects

After writing episode files, `updaters.ts` surgically modifies:
- `scripts/dev.sh` — appends to ALL_APPS + adds get_comp_id() case
- Root `package.json` — adds start/build/generate-tts scripts

## Cross-links

- [TODO.md](TODO.md) — Tasks and development history
- `remotion-best-practices` skill → Episode Setup topic → scaffolding
