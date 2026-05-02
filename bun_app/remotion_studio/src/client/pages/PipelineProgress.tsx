import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { PageHeader, EmptyState, SkeletonCard } from "../components";
import { ProgressFilterBar } from "../components/ProgressFilterBar";
import { ProgressEpisodeTable, ProgressStepOverview } from "../components/ProgressEpisodeTable";
import type { EpisodeProgress, EpisodeProgressSummary, EpisodeStepProgress, BatchRequest, Job, BatchResult } from "../../shared/types";
import { toast } from "../components/ToastContainer";

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
        <EmptyState icon="📋" title={t.pipelineProgress.emptyTitle} description={t.pipelineProgress.emptyDesc} />
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

  const isBatching = batchRunning !== null;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <PageHeader title={t.pipelineProgress.title} description={t.pipelineProgress.description} />

      {/* Summary cards */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <SummaryCard label={t.pipelineProgress.summary.totalEpisodes} value={summary.totalEpisodes} color={theme.colors.primary} theme={theme} />
        <SummaryCard label={t.pipelineProgress.summary.completed} value={summary.completedEpisodes} color={theme.colors.success} theme={theme} />
        <SummaryCard label={t.pipelineProgress.summary.avgCompletion} value={`${Math.round(summary.avgCompletion * 100)}%`} color={theme.colors.warning} theme={theme} />
        {selected.size > 0 && (
          <SummaryCard label={t.pipelineProgress.summary.selected} value={selected.size} color={theme.colors.info} theme={theme} />
        )}
      </div>

      <ProgressFilterBar
        filter={filter} onFilterChange={setFilter}
        totalCount={episodes.length} completeCount={summary.completedEpisodes}
        selectedCount={selected.size} filteredCount={filtered.length}
        isBatching={isBatching} batchRunning={batchRunning}
        onSelectAll={selectAll} onBatchTts={() => handleBatch("tts")}
        onBatchRender={() => handleBatch("render")} onRefresh={load}
        labels={{
          filterAll: t.pipelineProgress.filter.all, filterComplete: t.pipelineProgress.filter.complete,
          filterIncomplete: t.pipelineProgress.filter.incomplete,
          selectAll: t.pipelineProgress.selection.selectAll, deselectAll: t.pipelineProgress.selection.deselectAll,
          tts: t.pipelineProgress.batch.tts, render: t.pipelineProgress.batch.render,
          runningTts: t.pipelineProgress.batch.runningTts, rendering: t.pipelineProgress.batch.rendering,
          refresh: t.pipelineProgress.refresh,
        }}
      />

      <ProgressEpisodeTable
        bySeries={bySeries} collapsedSeries={collapsedSeries} selected={selected}
        stepLabels={STEP_LABELS}
        onToggleSeries={toggleSeries} onToggleEpisode={toggleEpisode}
        onToggleSeriesSelect={toggleSeriesSelect}
        seriesLabel={t.pipelineProgress.episodes}
        selectedCountLabel={t.pipelineProgress.selectedCount}
        episodeLabel={t.pipelineProgress.episode}
        progressLabel={t.pipelineProgress.progress}
        scoreLabel={t.pipelineProgress.score}
      />

      <ProgressStepOverview
        summary={summary} stepLabels={STEP_LABELS}
        title={t.pipelineProgress.stepCompletionOverview}
      />
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
