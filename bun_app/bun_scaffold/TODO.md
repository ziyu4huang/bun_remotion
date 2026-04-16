# bun_scaffold — TODO

## Status

- **Version:** 0.1.0
- **Test status:** No tests yet
- **Registered series:** weapon-forger, my-core-is-boss, galgame-meme-theater

## Known Issues

- No test coverage — scaffold output is verified manually via --dry-run
- `reorderScripts()` in updaters.ts is a no-op (scripts appended at end, not grouped)
- Templates reference `SceneIndicator`, `dialogTiming`, `QuestBadge` components that may not exist in all series' assets/components/
- No validation that assets/ (backgrounds, characters) actually exist before scaffolding

## P0 — Must Have

- [ ] Add unit tests for `naming.ts` (computeNaming for chapter-based vs flat)
- [ ] Add unit tests for `args.ts` (parseArgs + validateArgs edge cases)
- [ ] Add unit tests for `templates.ts` (verify generated output contains correct imports/names)
- [ ] Test end-to-end: scaffold a dry-run episode for each series, verify file count and naming

## P1 — Should Have

- [ ] Validate that referenced assets/components exist in series before scaffolding
- [ ] Add `--list-series` flag to show available series and their configs
- [ ] Implement `reorderScripts()` to group scripts by series in package.json
- [ ] Add `--force` flag to re-scaffold over existing episode (with backup)
- [ ] Generate PLAN.md episode guide row automatically (not just TODO.md)
- [ ] Support custom template overrides per series (e.g., weapon-forger needs battle scenes)

## P2 — Nice to Have

- [ ] Interactive mode: prompt for series/episode if not provided
- [ ] Generate voice-config.json entry for new episodes
- [ ] Auto-run sync-images.sh after scaffolding
- [ ] Add new series via CLI (without editing series-config.ts)

## Done

- [x] Initial scaffold implementation (weapon-forger, my-core-is-boss, galgame-meme-theater)
- [x] Chapter-based and flat episode numbering
- [x] Template generators for all episode files
- [x] Surgical updates to dev.sh and root package.json
- [x] --dry-run mode
- [x] Idempotency checks (won't overwrite existing episodes or duplicate scripts)
- [x] PLAN.md + TODO.md created for develop_bun_app registration
