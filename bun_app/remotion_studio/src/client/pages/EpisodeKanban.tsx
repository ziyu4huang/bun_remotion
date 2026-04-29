import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { PageHeader, EmptyState, SkeletonCard, StatusBadge } from "../components";
import type { EpisodeProgress, EpisodeProgressSummary, EpisodeStepProgress } from "../../shared/types";

const KANBAN_STAGES: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

export function EpisodeKanban() {
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
  const [seriesFilter, setSeriesFilter] = useState<string>("all");

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
        <PageHeader title={t.kanban.title} description={t.kanban.description} />
        <EmptyState title={t.kanban.emptyTitle} description={t.kanban.emptyDesc} />
      </div>
    );
  }

  const { episodes } = data;
  const filtered = seriesFilter === "all" ? episodes : episodes.filter((e) => e.seriesId === seriesFilter);

  const seriesIds = [...new Set(episodes.map((e) => e.seriesId))];

  // Determine each episode's "current stage" = first incomplete step
  // Episodes that are fully complete go in the last column
  const columns: Map<string, EpisodeProgress[]> = new Map();
  for (const stage of KANBAN_STAGES) {
    columns.set(stage, []);
  }

  for (const ep of filtered) {
    let placed = false;
    for (const stage of KANBAN_STAGES) {
      if (!ep.steps[stage]) {
        columns.get(stage)!.push(ep);
        placed = true;
        break;
      }
    }
    if (!placed) {
      // All steps complete — place in last column
      columns.get(KANBAN_STAGES[KANBAN_STAGES.length - 1])!.push(ep);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title={t.kanban.title} description={t.kanban.description} />

      {/* Series filter */}
      {seriesIds.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <button onClick={() => setSeriesFilter("all")}
            style={filterBtn(seriesFilter === "all", theme)}>
            {t.kanban.all} ({episodes.length})
          </button>
          {seriesIds.map((id) => (
            <button key={id} onClick={() => setSeriesFilter(id)}
              style={filterBtn(seriesFilter === id, theme)}>
              {id} ({episodes.filter((e) => e.seriesId === id).length})
            </button>
          ))}
          <button onClick={load} style={{
            marginLeft: "auto", padding: "6px 12px", borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border.default}`, background: "transparent",
            cursor: "pointer", color: theme.colors.text.secondary, fontSize: theme.font.sizes.sm,
          }}>
            {t.kanban.refresh}
          </button>
        </div>
      )}

      {/* Kanban columns */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {KANBAN_STAGES.map((stage) => {
          const eps = columns.get(stage) ?? [];
          const done = eps.filter((e) => e.steps[stage]).length;
          const waiting = eps.length - done;
          return (
            <div key={stage} style={{
              flex: "1 1 180px", minWidth: 180,
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: theme.radii.lg, background: theme.colors.bg.surface,
              display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 200px)",
            }}>
              <div style={{
                padding: "10px 14px", borderBottom: `1px solid ${theme.colors.border.default}`,
                background: theme.colors.bg.muted, borderRadius: `${theme.radii.lg} ${theme.radii.lg} 0 0`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
                  {STEP_LABELS[stage]}
                </span>
                <span style={{
                  fontSize: theme.font.sizes.xs, padding: "2px 8px", borderRadius: theme.radii.full,
                  background: waiting > 0 ? theme.colors.warningLight : theme.colors.successLight,
                  color: waiting > 0 ? theme.colors.warningDark : theme.colors.successDark,
                }}>
                  {waiting} {t.kanban.waiting}
                </span>
              </div>
              <div style={{ padding: 8, overflowY: "auto", flex: 1 }}>
                {eps.length === 0 && (
                  <div style={{ padding: "16px 8px", textAlign: "center", color: theme.colors.text.tertiary, fontSize: theme.font.sizes.sm }}>
                    {t.kanban.emptyColumn}
                  </div>
                )}
                {eps.map((ep) => (
                  <KanbanCard key={ep.episodeId} ep={ep} stageKey={stage} theme={theme} t={t} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ ep, stageKey, theme, t }: {
  ep: EpisodeProgress; stageKey: keyof EpisodeStepProgress; theme: ReturnType<typeof useTheme>; t: ReturnType<typeof useI18n>["t"];
}) {
  const isDone = ep.steps[stageKey];
  const label = ep.chapter != null ? `Ch${ep.chapter}-Ep${ep.episode}` : `Ep${ep.episode ?? ""}`;
  const completedSteps = STEP_KEYS.filter((k) => ep.steps[k]).length;

  return (
    <div style={{
      padding: "8px 10px", marginBottom: 6,
      border: `1px solid ${isDone ? theme.colors.successLight : theme.colors.border.light}`,
      borderRadius: theme.radii.md, background: isDone ? theme.colors.successLight : theme.colors.bg.muted,
      fontSize: theme.font.sizes.sm,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: theme.font.weights.medium }}>{label}</span>
        {isDone ? (
          <span style={{ color: theme.colors.success, fontSize: 12 }}>{t.kanban.done}</span>
        ) : (
          <span style={{ color: theme.colors.warning, fontSize: 12 }}>{t.kanban.waiting}</span>
        )}
      </div>
      <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 4 }}>
        {ep.seriesName}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {STEP_KEYS.map((k) => (
          <div key={k} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: ep.steps[k] ? theme.colors.success : theme.colors.bg.muted,
          }} />
        ))}
      </div>
      {(ep.gateScore != null || ep.blendedScore != null) && (
        <div style={{ marginTop: 4 }}>
          {ep.blendedScore != null ? (
            <StatusBadge status={ep.blendedScore >= 70 ? "pass" : ep.blendedScore >= 50 ? "warn" : "fail"} label={`${ep.blendedScore}`} />
          ) : (
            <StatusBadge status={ep.gateScore! >= 70 ? "pass" : ep.gateScore! >= 50 ? "warn" : "fail"} label={`${ep.gateScore}`} />
          )}
        </div>
      )}
    </div>
  );
}

const STEP_KEYS: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

function filterBtn(active: boolean, theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: "6px 14px", borderRadius: theme.radii.md,
    border: `1px solid ${active ? theme.colors.primary : theme.colors.border.default}`,
    background: active ? theme.colors.primaryLight : "transparent",
    color: active ? theme.colors.primaryDark : theme.colors.text.secondary,
    cursor: "pointer", fontSize: theme.font.sizes.sm,
  };
}
