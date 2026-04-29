import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { PageHeader, StatusBadge, EmptyState, SkeletonCard } from "../components";
import type { EpisodeProgress, EpisodeProgressSummary, EpisodeStepProgress, BatchRequest, Job, BatchResult } from "../../shared/types";
import { toast } from "../components/ToastContainer";

const STEP_KEYS: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

export function PipelineProgress() {
  const theme = useTheme();
  const { t } = useI18n();
  const STEP_LABELS: Record<keyof EpisodeStepProgress, string> = {
    scaffold: t.pipelineProgress.steps.scaffold,
    pipeline: t.pipelineProgress.steps.pipeline,
    check: t.pipelineProgress.steps.check,
    score: t.pipelineProgress.steps.score,
    image: t.pipelineProgress.steps.image,
    tts: t.pipelineProgress.steps.tts,
    render: t.pipelineProgress.steps.render,
  };
  const [data, setData] = useState<{ episodes: EpisodeProgress[]; summary: EpisodeProgressSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "incomplete" | "complete">("all");
  const [collapsedSeries, setCollapsedSeries] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchRunning, setBatchRunning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getEpisodeProgress();
    if (res.data) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return <div style={{ padding: 24 }}><SkeletonCard rows={8} /></div>;
  }

  if (!data || data.episodes.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <PageHeader title={t.pipelineProgress.title} description={t.pipelineProgress.description} />
        <EmptyState title={t.pipelineProgress.emptyTitle} description={t.pipelineProgress.emptyDesc} />
      </div>
    );
  }

  const { episodes, summary } = data;
  const filtered = filter === "all" ? episodes
    : filter === "complete" ? episodes.filter((e) => e.completedSteps === e.totalSteps)
    : episodes.filter((e) => e.completedSteps < e.totalSteps);

  const bySeries = new Map<string, EpisodeProgress[]>();
  for (const ep of filtered) {
    const arr = bySeries.get(ep.seriesId) ?? [];
    arr.push(ep);
    bySeries.set(ep.seriesId, arr);
  }

  const toggleSeries = (id: string) => {
    setCollapsedSeries((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleEpisode = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSeriesSelect = (seriesId: string, eps: EpisodeProgress[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const ids = eps.map((e) => e.episodeId);
      const allSelected = ids.every((id) => next.has(id));
      for (const id of ids) {
        if (allSelected) next.delete(id); else next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((e) => e.episodeId)));
    }
  };

  const handleBatch = async (operation: "tts" | "render") => {
    const targets = filtered.filter((e) => selected.has(e.episodeId));
    if (targets.length === 0) {
      toast("Select episodes first", "warning");
      return;
    }

    const req: BatchRequest = { operation, episodeIds: targets.map((e) => e.episodeId) };
    setBatchRunning(operation);

    try {
      const res = await api.batch.trigger(req);
      if (res.data) {
        toast(`Batch ${operation} started (${targets.length} episodes)`, "success");
        pollBatchJob(res.data.id);
      } else {
        toast(res.error ?? "Failed to start batch", "error");
        setBatchRunning(null);
      }
    } catch {
      toast("Failed to start batch", "error");
      setBatchRunning(null);
    }
  };

  const pollBatchJob = (jobId: string) => {
    const poll = async () => {
      const res = await api.getJob(jobId);
      if (res.data) {
        const job = res.data as Job<BatchResult>;
        if (job.status === "completed") {
          const r = job.result;
          if (r) {
            toast(`Batch done: ${r.completed} ok, ${r.failed} failed, ${r.skipped} skipped`, r.failed > 0 ? "warning" : "success");
          }
          setBatchRunning(null);
          load();
          return;
        }
        if (job.status === "failed") {
          toast(`Batch failed: ${job.error ?? "unknown error"}`, "error");
          setBatchRunning(null);
          return;
        }
      }
      setTimeout(poll, 2000);
    };
    poll();
  };

  const hasSelection = selected.size > 0;
  const isBatching = batchRunning !== null;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <PageHeader title={t.pipelineProgress.title} description={t.pipelineProgress.description} />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <SummaryCard label={t.pipelineProgress.summary.totalEpisodes} value={summary.totalEpisodes} color={theme.colors.primary} theme={theme} />
        <SummaryCard label={t.pipelineProgress.summary.completed} value={summary.completedEpisodes} color={theme.colors.success} theme={theme} />
        <SummaryCard label={t.pipelineProgress.summary.avgCompletion} value={`${Math.round(summary.avgCompletion * 100)}%`} color={theme.colors.warning} theme={theme} />
        {hasSelection && (
          <SummaryCard label={t.pipelineProgress.summary.selected} value={selected.size} color={theme.colors.info} theme={theme} />
        )}
      </div>

      {/* Filter tabs + batch actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        {(["all", "incomplete", "complete"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px", borderRadius: theme.radii.md,
              border: `1px solid ${filter === f ? theme.colors.primary : theme.colors.border.default}`,
              background: filter === f ? theme.colors.primaryLight : "transparent",
              color: filter === f ? theme.colors.primaryDark : theme.colors.text.secondary,
              cursor: "pointer", fontSize: theme.font.sizes.sm,
            }}>
            {f === "all" ? `${t.pipelineProgress.filter.all} (${episodes.length})`
              : f === "complete" ? `${t.pipelineProgress.filter.complete} (${summary.completedEpisodes})`
              : `${t.pipelineProgress.filter.incomplete} (${episodes.length - summary.completedEpisodes})`}
          </button>
        ))}
        <button onClick={selectAll} style={{
          padding: "6px 12px", borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border.default}`, background: "transparent",
          cursor: "pointer", color: theme.colors.text.secondary, fontSize: theme.font.sizes.sm,
        }}>
          {selected.size === filtered.length ? t.pipelineProgress.selection.deselectAll : t.pipelineProgress.selection.selectAll}
        </button>
        {hasSelection && (
          <>
            <button onClick={() => handleBatch("tts")} disabled={isBatching}
              style={{
                marginLeft: "auto", padding: "6px 14px", borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.primary}`, background: theme.colors.primary,
                color: "#fff", cursor: isBatching ? "wait" : "pointer", fontSize: theme.font.sizes.sm,
                opacity: isBatching ? 0.6 : 1,
              }}>
              {batchRunning === "tts" ? t.pipelineProgress.batch.runningTts : `${t.pipelineProgress.batch.tts} ${selected.size}`}
            </button>
            <button onClick={() => handleBatch("render")} disabled={isBatching}
              style={{
                padding: "6px 14px", borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.success}`, background: theme.colors.success,
                color: "#fff", cursor: isBatching ? "wait" : "pointer", fontSize: theme.font.sizes.sm,
                opacity: isBatching ? 0.6 : 1,
              }}>
              {batchRunning === "render" ? t.pipelineProgress.batch.rendering : `${t.pipelineProgress.batch.render} ${selected.size}`}
            </button>
          </>
        )}
        <button onClick={load} disabled={isBatching} style={{
          marginLeft: hasSelection ? 8 : "auto", padding: "6px 12px", borderRadius: theme.radii.md,
          border: `1px solid ${theme.colors.border.default}`, background: "transparent",
          cursor: "pointer", color: theme.colors.text.secondary, fontSize: theme.font.sizes.sm,
        }}>
          {t.pipelineProgress.refresh}
        </button>
      </div>

      {/* Per-series tables */}
      {[...bySeries.entries()].map(([seriesId, eps]) => {
        const collapsed = collapsedSeries.has(seriesId);
        const pct = eps.reduce((s, e) => s + e.completedSteps, 0) / (eps.length * 7);
        const seriesSelected = eps.filter((e) => selected.has(e.episodeId)).length;
        return (
          <div key={seriesId} style={{
            marginBottom: 16, border: `1px solid ${theme.colors.border.default}`,
            borderRadius: theme.radii.lg, overflow: "hidden",
          }}>
            <div onClick={() => toggleSeries(seriesId)}
              style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                background: theme.colors.bg.muted, cursor: "pointer", userSelect: "none",
              }}>
              <span style={{ fontSize: 10 }}>{collapsed ? "▶" : "▼"}</span>
              <input type="checkbox" checked={seriesSelected === eps.length && eps.length > 0}
                onChange={(e) => { e.stopPropagation(); toggleSeriesSelect(seriesId, eps); }}
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: "pointer" }} />
              <span style={{ fontWeight: theme.font.weights.medium }}>{eps[0].seriesName}</span>
              <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted }}>
	                {t.pipelineProgress.episodes(eps.length)}
              </span>
              {seriesSelected > 0 && (
                <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.primary }}>
	                  {t.pipelineProgress.selectedCount(seriesSelected)}
                </span>
              )}
              <ProgressBar pct={pct} color={theme.colors.primary} bg={theme.colors.bg.muted} style={{ marginLeft: "auto", width: 120 }} />
              <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, width: 40, textAlign: "right" }}>
                {Math.round(pct * 100)}%
              </span>
            </div>

            {!collapsed && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.sm }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${theme.colors.border.default}` }}>
                    <th style={thStyle(theme)}></th>
	                    <th style={thStyle(theme)}>{t.pipelineProgress.episode}</th>
                    {STEP_KEYS.map((k) => <th key={k} style={{ ...thStyle(theme), textAlign: "center", minWidth: 56 }}>{STEP_LABELS[k]}</th>)}
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>{t.pipelineProgress.progress}</th>
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>{t.pipelineProgress.score}</th>
                  </tr>
                </thead>
                <tbody>
                  {eps.map((ep) => (
                    <tr key={ep.episodeId} style={{
                      borderBottom: `1px solid ${theme.colors.border.light}`,
                      background: selected.has(ep.episodeId) ? theme.colors.primaryLight : "transparent",
                    }}>
                      <td style={{ padding: "6px 8px", width: 32 }}>
                        <input type="checkbox" checked={selected.has(ep.episodeId)}
                          onChange={() => toggleEpisode(ep.episodeId)} style={{ cursor: "pointer" }} />
                      </td>
                      <td style={{ padding: "6px 14px" }}>
                        {ep.chapter != null ? `Ch${ep.chapter}-Ep${ep.episode}` : `Ep${ep.episode ?? ""}`}
                      </td>
                      {STEP_KEYS.map((k) => (
                        <td key={k} style={{ padding: "6px 8px", textAlign: "center" }}>
                          <StepCell done={ep.steps[k]} theme={theme} />
                        </td>
                      ))}
                      <td style={{ padding: "6px 14px", textAlign: "center" }}>
                        <span style={{
                          fontSize: theme.font.sizes.sm,
                          color: ep.completedSteps === ep.totalSteps ? theme.colors.success : theme.colors.text.secondary,
                        }}>
                          {ep.completedSteps}/{ep.totalSteps}
                        </span>
                      </td>
                      <td style={{ padding: "6px 14px", textAlign: "center" }}>
                        {ep.blendedScore != null ? (
                          <StatusBadge status={ep.blendedScore >= 70 ? "pass" : ep.blendedScore >= 50 ? "warn" : "fail"} label={`${ep.blendedScore}`} />
                        ) : ep.gateScore != null ? (
                          <StatusBadge status={ep.gateScore >= 70 ? "pass" : ep.gateScore >= 50 ? "warn" : "fail"} label={`${ep.gateScore}`} />
                        ) : (
                          <span style={{ color: theme.colors.text.tertiary }}>&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {/* Step completion overview */}
      <div style={{
        marginTop: 24, padding: 16,
        border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.lg,
      }}>
        <h3 style={{ margin: "0 0 12px", fontSize: theme.font.sizes.base, fontWeight: theme.font.weights.medium }}>
          {t.pipelineProgress.stepCompletionOverview}
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {STEP_KEYS.map((k) => {
            const info = summary.byStep[k];
            const p = info.total > 0 ? info.done / info.total : 0;
            return (
              <div key={k} style={{
                flex: "1 1 120px", padding: 10, borderRadius: theme.radii.md,
                background: theme.colors.bg.muted, textAlign: "center",
              }}>
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginBottom: 4 }}>
                  {STEP_LABELS[k]}
                </div>
                <div style={{
                  fontSize: 20, fontWeight: theme.font.weights.bold,
                  color: p === 1 ? theme.colors.success : theme.colors.text.primary,
                }}>
                  {info.done}/{info.total}
                </div>
                <ProgressBar pct={p} color={theme.colors.primary} bg={theme.colors.bg.muted} style={{ marginTop: 6 }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, theme }: {
  label: string; value: string | number; color: string; theme: ReturnType<typeof useTheme>;
}) {
  return (
    <div style={{
      flex: "1 1 140px", padding: "14px 18px",
      border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.lg,
      background: theme.colors.bg.surface,
    }}>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: theme.font.weights.bold, color }}>{value}</div>
    </div>
  );
}

function StepCell({ done, theme }: { done: boolean; theme: ReturnType<typeof useTheme> }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: theme.radii.md,
      background: done ? theme.colors.successLight : theme.colors.bg.muted,
      color: done ? theme.colors.successDark : theme.colors.text.tertiary,
      fontSize: 14, fontWeight: done ? 600 : 400,
    }}>
      {done ? "✓" : "—"}
    </span>
  );
}

function ProgressBar({ pct, color, bg, style }: { pct: number; color: string; bg: string; style?: React.CSSProperties }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: bg, overflow: "hidden", ...style }}>
      <div style={{
        height: "100%", width: `${Math.round(pct * 100)}%`, borderRadius: 3,
        background: pct === 1 ? color : color, transition: "width 0.3s",
      }} />
    </div>
  );
}

function thStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: "6px 14px", textAlign: "left",
    fontWeight: theme.font.weights.medium, color: theme.colors.text.muted,
  };
}
