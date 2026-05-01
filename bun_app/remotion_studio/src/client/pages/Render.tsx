import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, Button } from "../components";
import { toast } from "../components/ToastContainer";
import type { Project, RenderStatus, Job, JobProgress } from "../../shared/types";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

export function Render() {
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);

  const loadProjects = useCallback(async () => {
    const res = await api.listProjects();
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadStatus = useCallback(async (episodeId: string) => {
    if (!episodeId) { setStatus(null); return; }
    const res = await api.getRenderStatus(episodeId);
    if (res.data) setStatus(res.data);
  }, []);

  useEffect(() => { loadStatus(selectedEpisode); }, [selectedEpisode, loadStatus]);

  const handleRender = async () => {
    if (!selectedEpisode) return;
    const res = await api.triggerRender(selectedEpisode);
    if (res.data) {
      setJob(res.data);
      api.streamJob(res.data.id, (p: JobProgress) => {
        setJob((prev) => prev ? { ...prev, progress: p.progress } : null);
        if (p.progress >= 100) {
          loadStatus(selectedEpisode);
          setJob(null);
        }
      });
    } else {
      toast("error", t.render.failedStart);
    }
  };

  // Flatten scaffolded episodes
  const episodes: { id: string; label: string }[] = [];
  for (const p of projects) {
    for (const ep of p.episodes) {
      if (ep.hasScaffold) {
        episodes.push({ id: `${p.seriesId}/${ep.id}`, label: `${p.seriesId}/${ep.id}` });
      }
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title={t.render.title} description={t.render.description} />

      <div style={{
        padding: "8px 14px", marginBottom: theme.spacing.lg,
        border: `1px solid ${theme.colors.info}33`, borderRadius: theme.radii.md,
        background: `${theme.colors.info}08`, fontSize: theme.font.sizes.sm,
        color: theme.colors.text.secondary, lineHeight: 1.5,
      }}>
        <strong>{t.render.infoText}</strong>
      </div>

      <div style={{ marginBottom: theme.spacing.lg, display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
        <select
          value={selectedEpisode}
          onChange={(e) => setSelectedEpisode(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md, minWidth: 300 }}
        >
          <option value="">{t.render.selectEpisode}</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>{ep.label}</option>
          ))}
        </select>

        <Button
          variant="primary"
          onClick={handleRender}
          disabled={!selectedEpisode || !!job}
        >
          {t.render.renderMp4}
        </Button>
      </div>

      {!selectedEpisode && (
        <EmptyState icon="▶" title={t.render.selectSeries} description={t.render.selectSeriesDesc} />
      )}

      {status && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <span style={{
              padding: "2px 8px",
              borderRadius: theme.radii.md,
              fontSize: 12,
              background: status.hasRender ? theme.colors.successLight : theme.colors.errorLight,
              color: status.hasRender ? theme.colors.successDark : theme.colors.errorDark,
            }}>
              {status.hasRender ? t.render.rendered : t.render.notRendered}
            </span>
            {status.fileSize && (
              <span style={{ fontSize: 12, color: theme.colors.text.tertiary }}>
                {formatSize(status.fileSize)}
              </span>
            )}
            {status.modifiedAt && (
              <span style={{ fontSize: 12, color: theme.colors.text.muted }}>
                {new Date(status.modifiedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}

      {job && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
            {job.type} — {job.status} ({job.progress}%)
          </div>
          <div style={{ background: theme.colors.border.default, borderRadius: theme.radii.md, height: 8, overflow: "hidden" }}>
            <div style={{ background: theme.colors.violet, height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {status?.hasRender && selectedEpisode && (
        <div style={{ marginTop: theme.spacing.lg }}>
          <h3 style={{ fontSize: theme.font.sizes.md, margin: `0 0 ${theme.spacing.sm}px` }}>Preview</h3>
          <video
            controls
            src={api.renderPreviewUrl(selectedEpisode)}
            style={{ width: "100%", maxWidth: 640, borderRadius: theme.radii.xl, background: theme.colors.bg.overlay }}
          />
        </div>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
