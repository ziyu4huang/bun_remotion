# episodeforge — TODO

## Status

- **Version:** 0.3.0
- **Test status:** 87 tests passing across 5 files
- **Registered series:** weapon-forger, my-core-is-boss, galgame-meme-theater, storygraph-explainer

## Known Issues

- Templates reference `SceneIndicator`, `dialogTiming`, `QuestBadge` components that may not exist in all series' assets/components/

## P0 — Must Have

- [x] Add unit tests for `naming.ts` (computeNaming for chapter-based vs flat)
- [x] Add unit tests for `args.ts` (parseArgs + validateArgs edge cases)
- [x] Add unit tests for `templates.ts` (verify generated output contains correct imports/names)
- [x] Test end-to-end: scaffold a dry-run episode for each series, verify file count and naming

## P1 — Should Have

- [x] Validate that referenced assets/components exist in series before scaffolding
- [x] Add `--list-series` flag to show available series and their configs
- [x] Implement `reorderScripts()` to group scripts by series in package.json
- [x] Add `--force` flag to re-scaffold over existing episode (with backup)
- [x] Generate PLAN.md episode guide row automatically (not just TODO.md)

## P2 — Nice to Have

- [ ] Support custom template overrides per series (e.g., weapon-forger needs battle scenes)
- [ ] Interactive mode: prompt for series/episode if not provided
- [ ] Generate voice-config.json entry for new episodes
- [ ] Auto-run sync-images.sh after scaffolding
- [ ] Add new series via CLI (without editing series-config.ts)

## Done

- [x] v0.2.0: --list-series flag, --force flag (backup + overwrite), asset validation, reorderScripts() grouping, PLAN.md row generation
- [x] Initial scaffold implementation (weapon-forger, my-core-is-boss, galgame-meme-theater)
- [x] Chapter-based and flat episode numbering
- [x] Template generators for all episode files
- [x] Surgical updates to dev.sh and root package.json
- [x] --dry-run mode
- [x] Idempotency checks (won't overwrite existing episodes or duplicate scripts)
- [x] PLAN.md + TODO.md created for develop_bun_app registration
- [x] Fix narration audio filename mismatch — genNarration() produced "02-contentscene1.wav" but genMainComponent() expected "02-content1.wav"
- [x] storygraph-explainer series config (tech_explainer category with named scenes)
- [x] Unit tests for naming, args, templates, scaffold, series-config (78 tests)
- [x] Audio filename consistency tests (3 series)
