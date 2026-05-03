# remotion_studio — Code TODO

> **Status:** v0.64.0 released. 598 tests, 0 fail, 4443 expect(). 472KB, 32 chunks. 22/22 smoke pass.

## Known Issues

- 1 data-testid in entire app (`global-jobs-badge` only) — Low priority

## Open Items (tracked in GitHub)

| Item | GitHub Issue | Priority |
|------|-------------|----------|
| Fix job lifecycle: Clear Completed bug + separate Clear Failed + Clear All Terminal | [#3](https://github.com/ziyu4huang/bun_remotion/issues/3) | P1 |
| Background Variants: time-of-day batch generator on ImageGen | [#4](https://github.com/ziyu4huang/bun_remotion/issues/4) | P2 |
| Content Template Library: per-category templates + Story Editor integration | [#7](https://github.com/ziyu4huang/bun_remotion/issues/7) | P2 |
| UI Fix: base layer background respects theme instead of hard-coded white | [#8](https://github.com/ziyu4huang/bun_remotion/issues/8) | P2 |
| Storygraph workspace package: exports + dependency declaration | [#10](https://github.com/ziyu4huang/bun_remotion/issues/10) | P1 |
| Pipeline contract types in remotion_types + contract test suite | [#11](https://github.com/ziyu4huang/bun_remotion/issues/11) | P1 |
| Pipeline API error hardening: PipelineError + timeout + retry + schema validation | [#12](https://github.com/ziyu4huang/bun_remotion/issues/12) | P1 |
| Quality Dashboard: KG quality metrics + Pipeline job history + error state integration | [#13](https://github.com/ziyu4huang/bun_remotion/issues/13) | P1 |
| Workflow DAG verification + end-to-end pipeline integration tests | [#14](https://github.com/ziyu4huang/bun_remotion/issues/14) | P1 |

## Deferred (no issue yet)

- **Video preview before full render** — Requires Remotion still rendering infrastructure. Significant new dependency.
- **Export to platform formats** (YouTube, Bilibili, TikTok) — Requires per-platform FFmpeg pipeline, captions, thumbnails.
