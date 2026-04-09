---
name: parallel-bash-failure-cascade
description: When one parallel Bash call fails, sibling calls get cancelled — avoid by isolating risky calls
type: feedback
---

# Parallel Bash Failure Cascade

## Rule
When making parallel Bash calls, do NOT group a risky call (e.g., importing an unverified module) with independent safe calls. If one fails, **all** parallel calls in the same message get cancelled.

## Why
On 2026-04-10, I ran 3 parallel Bash calls: one tried `import graphify.query` which didn't exist (`ModuleNotFoundError`). The other two calls (inspecting `graphify.cache` and `graphify.analyze`) were perfectly fine but got cancelled because the first one errored. This wasted time and required re-running.

## How to apply
1. **Verify before parallel:** If unsure whether a module/function exists, test it in a single call first, then parallelize the rest
2. **Use try/except in Python:** When probing APIs, wrap imports in `try/except ImportError` so failures are non-fatal
3. **Separate risky from safe:** If one call is exploratory (might fail), run it alone; parallelize only the confirmed-safe calls
4. **Don't assume module existence:** Even if documentation mentions a module, the installed version may not have it (e.g., SKILL.md mentions `graphify.query` but it doesn't exist in v0.3.20)
