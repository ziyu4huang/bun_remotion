---
name: storygraph-benchmark
description: Autonomous storygraph pipeline benchmark — discover series, run pipeline, check quality, regression test, and produce a structured report
trigger: /benchmark
---

# /benchmark — Autonomous Storygraph Benchmark

Run the full storygraph quality pipeline on one or more series and produce a structured report with PASS/WARN/FAIL decisions.

## Workflow

Follow these steps in order. After each tool call, read the result before proceeding.

### Step 1: Discover Target Series

If the user specified a series directory, use it directly. Otherwise, use `sg_baseline_list` to discover all series:

```
sg_baseline_list()
```

This returns all series with their baseline status. Run the benchmark on all discovered series (or the single specified one).

### Step 2: Check Current Status

Call `sg_status` for each series to see what artifacts already exist. Skip pipeline if all artifacts are fresh and the user didn't request a forced re-run.

### Step 3: Run Pipeline

Call `sg_pipeline` for each series:
```
sg_pipeline(seriesDir: "<path>", mode: "hybrid")
```

If pipeline fails, record the error and skip to reporting for that series.

### Step 4: Quality Check

Call `sg_check` to get gate.json score and individual check results:
```
sg_check(seriesDir: "<path>", mode: "hybrid")
```

### Step 5: Regression Check

Call `sg_regression` to compare against stored baselines:
```
sg_regression(seriesDir: "<path>", threshold: 10)
```

If no baseline exists, note it in the report. Do NOT create baselines unless the user explicitly requests it.

### Step 5.5: Story Health Check

Call `sg_health` for a quick summary of story quality dimensions:
```
sg_health(seriesDir: "<path>")
```

Record the debt count and any alert-level dimensions in the report.

### Step 5.6: Story Suggestions (optional)

If the user requests actionable suggestions, call `sg_suggest`:
```
sg_suggest(seriesDir: "<path>")
```

Include the prioritized suggestions in the report. Optionally pass `targetEpId` to scope suggestions to a specific upcoming episode.

### Step 6: Blended Score (optional)

If the user requests deep scoring, call `sg_score`:
```
sg_score(seriesDir: "<path>", mode: "hybrid")
```

### Step 7: Report

Produce a markdown report with this structure:

```markdown
# Storygraph Benchmark Report

**Date:** <ISO timestamp>
**Series tested:** <count>

## <series-name>

| Metric | Value |
|--------|-------|
| Gate Score | <score>/100 |
| Decision | PASS / WARN / FAIL |
| Regression | OK / FLAGGED (delta: <N>) |
| Baseline | exists / missing |
| Pipeline | OK / FAILED |

### Check Results
| Check | Status | Impact |
|-------|--------|--------|
| <check-name> | PASS/FAIL | <score_impact> |

### Issues
- <list any FAIL checks or regression warnings>

### Story Health
| Dimension | Status | Score |
|-----------|--------|-------|
| <dimension> | GOOD/WARN/ALERT | <score> |

**Story Debt:** <N> items
- <debt item 1>

---

## Summary

| Series | Score | Decision | Regression |
|--------|-------|----------|------------|
| <name> | <score> | PASS/WARN/FAIL | OK/FLAGGED |

**Overall:** <PASS if all PASS, WARN if any WARN, FAIL if any FAIL>
```

## Decision Logic

| Score | Decision | Action |
|-------|----------|--------|
| ≥ 70 | PASS | No action needed |
| 40–69 | WARN | List issues, suggest fixes |
| < 40 | FAIL | List critical issues, block progression |

### Regression Rules

- Score delta > threshold (default 10): FLAGGED
- Any individual check flipped from PASS → FAIL: FLAGGED
- Improvement deltas (score went up): note but do not flag

### Baseline Management

Baselines are stored at `<series>/storygraph_out/baseline-gate.json`. To save a new baseline after a successful run:

```
sg_baseline_update(seriesDir: "<path>")
```

To list all series and their baseline status:

```
sg_baseline_list()
```

Only update baselines when the user explicitly approves.

## Error Handling

- Pipeline failure: record error, skip to report, mark series as FAILED
- Missing baseline: note in report, skip regression step for that series
- Directory not found: report as error, skip series
- Tool returns error: include error message verbatim in report

## CI Mode

When the user includes `--ci`:
- After reporting, exit with code 0 if all PASS, 1 if any WARN or FAIL
- Output structured JSON alongside the markdown report
- Do not prompt for baseline updates
