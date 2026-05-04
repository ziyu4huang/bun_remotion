# episodeforge — Plan

> Full specs → GitHub issue #33 (PRD)

## Quick Reference

- **Version:** v0.3.0 — 87 tests, 4 series registered
- **Purpose:** CLI episode scaffolding for Remotion projects
- **No external deps** — Pure TypeScript/Bun

## Architecture

- `index.ts` — CLI entry: parse args → load config → write files → update shared
- `args.ts` — CLI parsing + validation (--series, --ch, --ep, --scenes, --dry-run)
- `series-config.ts` — SeriesConfig registry (naming, scenes, imports, transitions)
- `naming.ts` — NamingContext: dirName, packageName, compositionId, scriptAlias
- `templates.ts` — Template generators (package.json, Root.tsx, scenes, narration)
- `writer.ts` — File writer with --dry-run + verification
- `updaters.ts` — Surgical updates to dev.sh + root package.json
- `scaffold.ts` — scaffold() orchestration

## Usage

```bash
bun run episodeforge --series galgame-meme-theater --ep 8
bun run episodeforge --series weapon-forger --ch 2 --ep 1 --dry-run
```
