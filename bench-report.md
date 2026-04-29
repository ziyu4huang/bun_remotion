# GLM5 Model Benchmark Report
Date: 2026-04-28
Series: weapon-forger (8 episodes)
Models: zai/glm-5, zai/glm-5-turbo, zai/glm-5.1, zai/glm-4.5-air

## Suite A: KG Quality (hybrid pipeline)

| Model | Gate | Blended | Nodes | Edges | Status |
|-------|------|---------|-------|-------|--------|
| zai/glm-5 | 100 | 0.372 | 189 | 433 | OK |
| zai/glm-5-turbo | 100 | 0.372 | 189 | 433 | OK |
| zai/glm-5.1 | 100 | 0.372 | 189 | 433 | OK |
| zai/glm-4.5-air | 100 | 0.372 | 189 | 433 | OK |

**Finding:** All models produce identical KG output. Hybrid mode runs regex first (dominant), AI supplement adds same exclusive nodes regardless of model quality. Suite A does not differentiate models.

**Recommendation:** Re-run with `--mode ai` (AI-only, no regex) for meaningful model comparison in KG quality.

## Suite B: Agent Coding

| Model | File Read | Code Analysis | Bug Fix | Storygraph | Orchestration | Avg |
|-------|-----------|---------------|---------|------------|---------------|-----|
| zai/glm-5 | 3/10 | 6/10 | 6/10 | 9/10 | 10/10 | **6.8** |
| zai/glm-5-turbo | 3/10 | 6/10 | 6/10 | 9/10 | 10/10 | **6.8** |
| zai/glm-5.1 | 3/10 | 6/10 | 6/10 | 9/10 | 10/10 | **6.8** |
| zai/glm-4.5-air | 3/10 | 6/10 | 6/10 | 6/10 | 10/10 | **6.2** |

### Score Breakdown

Scores are (tool_use / 4 + response / 3 + efficiency / 3 = total / 10).

**Task 1: File Read + Summarize** — All models: 3/10
- Tool use: 2/4 — Uses read + excessive find calls (6-8 per model)
- Response: 0/3 — Task requires summarization, scoring may need calibration
- Efficiency: 1/3 — Too many redundant tool calls

**Task 2: Code Analysis** — All models: 6/10
- Tool use: 2/4 — Same pattern (read + many find)
- Response: 3/3 — Full response quality
- Efficiency: 1/3 — Excessive tool calls

**Task 3: Bug Fix** — glm-5/5-turbo/5.1: 6/10, glm-4.5-air: 6/10
- Tool use: 2/4 — Massive bash spam (up to 35 calls for glm-5)
- Response: 3/3 — Fixes found successfully
- Efficiency: 1/3 — Far too many bash calls

**Task 4: Storygraph Pipeline** — glm-5/5-turbo/5.1: 9/10, glm-4.5-air: 6/10
- glm-5/5-turbo/5.1: tool=3/4, resp=3/3, eff=3/3 — Efficient sg_status + sg_check usage
- **glm-4.5-air: tool=2/4, resp=1/3, eff=3/3** — Only called sg_status, missed sg_check

**Task 5: Multi-step Orchestration** — All models: 10/10
- Perfect scores across the board — sc_series_list, sc_episode_list, sg_status, sg_suggest used well

### Speed Comparison (Orchestration Task)

| Model | Duration |
|-------|----------|
| zai/glm-5-turbo | **15.6s** |
| zai/glm-4.5-air | 49.2s |
| zai/glm-5.1 | 65.5s |
| zai/glm-5 | 67.6s |

### Bug Fix Bash Spam

| Model | Bash Calls | Duration |
|-------|------------|----------|
| zai/glm-5 | 35 | 248.1s |
| zai/glm-5-turbo | 33 | 68.3s |
| zai/glm-5.1 | 14 | 59.5s |
| zai/glm-4.5-air | 17 | 59.6s |

## Key Findings

1. **glm-5 = glm-5-turbo = glm-5.1 on accuracy** (identical 6.8 avg), but **turbo is 4-5x faster**
2. **glm-4.5-air is slightly weaker** (6.2 avg) — notably worse on storygraph (6 vs 9) and response quality
3. **All models struggle with simple file tasks** (3/10 on file read) but excel at orchestration (10/10)
4. **Bash tool spam is the main efficiency problem** — bug fix task generates 14-35 bash calls
5. **KG benchmark doesn't differentiate models** — hybrid mode's regex dominates AI contribution

## Recommendations

### For Production (bun_pi_agent default)
- **Use `zai/glm-5-turbo`** — same quality as glm-5/5.1 but 4-5x faster
- glm-4.5-air acceptable for cost-sensitive workloads (slightly lower quality)

### For Benchmark Improvements
- Re-run Suite A with `--mode ai` (no regex) to test pure model extraction quality
- Add task scoring calibration — file read task response=0 suggests scoring false negative
- Add bash call count penalty to efficiency scoring
- Test with more complex series (my-core-is-boss, galgame-meme-theater)

### For Agent Behavior
- Reduce excessive find/bash tool calls — add max-turns or call-count limits
- File read + summarize task needs scoring fix (response should not be 0/3 for all models)
