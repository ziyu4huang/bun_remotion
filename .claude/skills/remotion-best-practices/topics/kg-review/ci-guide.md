# Storygraph CI Integration Guide

> Continuous integration patterns for storygraph quality gates and regression testing.

## Overview

Storygraph's `--ci` flag enables non-interactive quality checks that exit with standard codes:

| Exit Code | Meaning |
|-----------|---------|
| 0 | Pass — quality threshold met, no regressions |
| 1 | Fail — below threshold, regressions detected, or error |

### Commands with CI Support

| Command | Pass Condition | CLI |
|---------|---------------|-----|
| `check` | `gate.score >= 70` AND no FAIL | `bun run storygraph check <dir> --ci` |
| `score` | `blended.decision === 'ACCEPT'` | `bun run storygraph score <dir> --ci` |
| `write-gate` | `gate.score >= 70` AND no FAIL | `bun run storygraph write-gate <dir> --ci` |
| `regression` | No regressions above threshold | `bun run storygraph regression --ci` |

### Quality Gate Thresholds

- **PASS**: score >= 70 — pipeline output is usable
- **WARN**: score >= 40 — needs attention, not blocking
- **FAIL**: score < 40 or any FAIL check — blocking

## GitHub Actions

### Quality Gate Check

Runs after every push that touches series content or pipeline code:

```yaml
name: Storygraph Quality Gate

on:
  push:
    paths:
      - 'bun_remotion_proj/*/PLAN.md'
      - 'bun_remotion_proj/*/assets/**'
      - 'bun_app/storygraph/src/**'
      - 'bun_app/remotion_types/src/**'

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - run: bun install

      - name: Check weapon-forger
        run: bun run storygraph check bun_remotion_proj/weapon-forger --ci

      - name: Check storygraph-explainer
        run: bun run storygraph check bun_remotion_proj/storygraph-explainer --ci
```

### Regression Detection

Compares current pipeline output against stored baselines:

```yaml
name: Storygraph Regression

on:
  pull_request:
    paths:
      - 'bun_app/storygraph/src/**'
      - 'bun_app/remotion_types/src/**'

jobs:
  regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - run: bun install

      - name: Regression test
        run: bun run storygraph regression --ci --threshold 10

      - name: Upload regression report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: regression-report
          path: bun_app/storygraph/test-corpus/regression-report.md
```

### Full Pipeline + Score

Run extraction, quality check, and AI scoring together:

```yaml
name: Storygraph Pipeline

on:
  push:
    branches: [main]
    paths:
      - 'bun_remotion_proj/*/PLAN.md'

jobs:
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - run: bun install

      - name: Run pipeline
        run: bun run storygraph pipeline bun_remotion_proj/weapon-forger --mode hybrid
        env:
          Z_AI_API_KEY: ${{ secrets.Z_AI_API_KEY }}

      - name: Quality check
        run: bun run storygraph check bun_remotion_proj/weapon-forger --ci

      - name: AI scoring
        run: bun run storygraph score bun_remotion_proj/weapon-forger --ci
        env:
          Z_AI_API_KEY: ${{ secrets.Z_AI_API_KEY }}
```

## Pre-commit Hooks

### Using Husky

```bash
bun add -d husky
bunx husky init
```

Add a hook that runs quality checks on changed series:

```bash
# .husky/pre-commit
bun run storygraph regression --ci --threshold 10
```

### Using Lefthook

```yaml
# lefthook.yml
pre-commit:
  commands:
    storygraph-regression:
      run: bun run storygraph regression --ci --threshold 10
      glob:
        - bun_app/storygraph/src/**/*.ts
        - bun_remotion_proj/*/PLAN.md
```

### Lightweight: shell script

For repos without a hook manager:

```bash
# scripts/ci-pre-push.sh
#!/bin/bash
set -e

# Only run if pipeline code changed
changed=$(git diff --name-only HEAD~1 HEAD)
if echo "$changed" | grep -q "bun_app/storygraph/"; then
  echo "Storygraph code changed, running regression..."
  bun run storygraph regression --ci
fi
```

```bash
# Install as pre-push hook
cp scripts/ci-pre-push.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

## Regression Baselines

Baselines are stored in `bun_app/storygraph/test-corpus/baselines/<series>/`. Each baseline contains:
- `gate.json` — programmatic quality score + checks
- `kg-quality-score.json` — AI blended score + dimensions

### Update Baselines

After intentional changes that improve scores:

```bash
# Update all baselines to current output
bun run storygraph regression --update

# Update a specific series
bun run storygraph regression --series weapon-forger --update
```

Always commit updated baselines with a message explaining what changed:

```
chore: update storygraph baselines after hybrid mode dedup fix
```

### Threshold Tuning

Default regression threshold is 10% — a metric drops >10% from baseline = regression.

```bash
# Stricter: 5% threshold (catch subtle regressions)
bun run storygraph regression --ci --threshold 5

# Looser: 20% threshold (noisy metrics, acceptable variance)
bun run storygraph regression --ci --threshold 20
```

| Threshold | Use Case |
|-----------|----------|
| 5% | Mature series with stable scores |
| 10% (default) | General purpose |
| 20% | Early development, noisy metrics |

## Environment Variables

| Variable | Required For | Description |
|----------|-------------|-------------|
| `Z_AI_API_KEY` | `score`, `pipeline --mode hybrid/ai` | z.ai API key for GLM models |

CI commands that don't need AI (`check`, `regression`) work without an API key — they read existing output files.

## Multi-Series Matrix

For repos with many series, use a matrix strategy:

```yaml
jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        series:
          - weapon-forger
          - storygraph-explainer
          - galgame-meme-theater
          - xianxia-system-meme
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run storygraph check bun_remotion_proj/${{ matrix.series }} --ci
```
