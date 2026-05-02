import { useState, useEffect } from "react";
import { api } from "../api";
import { Button } from "./Button";
import { Card } from "./Card";
import { InputField } from "./InputField";
import { PageHeader } from "./PageHeader";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { Job, Project } from "../../shared/types";

export const CATEGORY_LABELS: Record<string, string> = {
  narrative_drama: "Narrative Drama",
  galgame_vn: "Galgame VN",
  tech_explainer: "Tech Explainer",
  data_story: "Data Story",
  listicle: "Listicle",
  tutorial: "Tutorial",
  shorts_meme: "Shorts / Meme",
};

interface ScaffoldResultData {
  success: boolean;
  naming: {
    dirName: string;
    packageName: string;
    compositionId: string;
    scriptAlias: string;
    episodeDir: string;
    seriesDir: string;
    numScenes: number;
    numTransitions: number;
    isStandalone: boolean;
  };
  filesWritten: number;
  skipped: string[];
  errors: string[];
}

export function ScaffoldEpisode({ onBack, onCreated, projects, initialSeries }: {
  onBack: () => void;
  onCreated: () => void;
  projects: Project[];
  initialSeries?: string | null;
}) {
  const theme = useTheme();
  const { t } = useI18n();
  const [series, setSeries] = useState(initialSeries ?? "");
  const [customSeries, setCustomSeries] = useState("");
  const [inited, setInited] = useState(false);
  const [chapter, setChapter] = useState("");
  const [episode, setEpisode] = useState("");
  const [scenes, setScenes] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isCustom = series === "__custom__";
  const resolvedSeries = isCustom ? customSeries.trim() : series;

  useEffect(() => {
    if (!inited && initialSeries) {
      handleSeriesChange(initialSeries);
      setInited(true);
    }
  }, [initialSeries, inited]);

  const handleSeriesChange = (val: string) => {
    setSeries(val);
    if (val === "__custom__" || !val) {
      setChapter("");
      setEpisode("");
      return;
    }
    const project = projects.find((p) => p.seriesId === val);
    if (!project || project.episodes.length === 0) {
      setChapter("1");
      setEpisode("1");
      return;
    }
    const chapters = [...new Set(project.episodes.map((e) => e.chapter ?? 1))].sort((a, b) => b - a);
    const latestCh = chapters[0];
    const epsInLatestCh = project.episodes.filter((e) => (e.chapter ?? 1) === latestCh);
    const maxEp = Math.max(...epsInLatestCh.map((e) => e.episode));
    setChapter(String(latestCh));
    setEpisode(String(maxEp + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    const res = await api.scaffold({
      series: resolvedSeries,
      chapter: chapter ? +chapter : undefined,
      episode: episode ? +episode : undefined,
      scenes: scenes ? +scenes : undefined,
      dryRun,
    });
    if (!res.ok || !res.data) {
      setError(res.error ?? "Unknown error");
      return;
    }
    const job = res.data;
    setJob(job);

    api.streamJob(job.id, (p) => {
      setProgress(p.progress);
    });

    const poll = async () => {
      const status = await api.getJob(job.id);
      if (status.data) setJob(status.data);
      if (status.data?.status === "completed" || status.data?.status === "failed") {
        if (status.data.status === "completed") onCreated();
        return;
      }
      setTimeout(poll, 500);
    };
    poll();
  };

  const selectedProject = !isCustom && series ? projects.find((p) => p.seriesId === series) : null;

  return (
    <div>
      <Button onClick={onBack} variant="ghost" style={{ marginBottom: theme.spacing.lg, padding: 0, fontSize: theme.font.sizes.md }}>
        &larr; {t.projects.backToList}
      </Button>
      <PageHeader title={t.projects.scaffoldTitle} description={t.projects.scaffoldDesc} />

      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.md, maxWidth: 400 }}>
        <label style={{ fontSize: theme.font.sizes.md }}>
          {t.projects.seriesLabel}
          <select
            value={series}
            onChange={(e) => handleSeriesChange(e.target.value)}
            style={{ display: "block", width: "100%", padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, marginTop: theme.spacing.xs, border: `1px solid ${theme.colors.border.medium}`, borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md, background: theme.colors.bg.page }}
          >
            <option value="">{t.projects.selectSeries}</option>
            {projects.map((p) => (
              <option key={p.seriesId} value={p.seriesId}>
                {p.name} ({CATEGORY_LABELS[p.category] ?? p.category}, {p.episodeCount} ep{p.episodeCount !== 1 ? "s" : ""})
              </option>
            ))}
            <option value="__custom__">{t.projects.newSeries}</option>
          </select>
        </label>
        {isCustom && (
          <InputField
            label={t.projects.newSeriesId}
            value={customSeries}
            onChange={(e) => setCustomSeries(e.target.value)}
            placeholder={t.projects.newSeriesPlaceholder}
          />
        )}
        {selectedProject && (
          <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, background: theme.colors.bg.muted, padding: `${theme.spacing.xs + 2}px ${theme.spacing.sm + 2}px`, borderRadius: theme.radii.md }}>
            {t.projects.category}: {CATEGORY_LABELS[selectedProject.category] ?? selectedProject.category} &middot;
            {" "}{selectedProject.episodeCount} episode{selectedProject.episodeCount !== 1 ? "s" : ""} existing
          </div>
        )}
        <div style={{ display: "flex", gap: theme.spacing.md }}>
          <InputField
            label={t.projects.chapter}
            type="number"
            min={1}
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="1"
            style={{ flex: 1 }}
          />
          <InputField
            label={t.projects.episodeLabel}
            type="number"
            min={1}
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            placeholder="1"
            style={{ flex: 1 }}
          />
        </div>
        <InputField
          label={t.projects.scenes}
          type="number"
          value={scenes}
          onChange={(e) => setScenes(e.target.value)}
          placeholder="7"
        />
        <label style={{ fontSize: theme.font.sizes.md, display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          {t.projects.dryRun}
        </label>

        {error && <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.md, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.errorLight, borderRadius: theme.radii.lg }}>{error}</div>}

        {job && (
          <Card variant="default" padding="md" style={{ fontSize: theme.font.sizes.md }}>
            <div>Status: <b>{job.status}</b></div>
            {job.status === "running" && (
              <div style={{ marginTop: theme.spacing.sm }}>
                <div style={{ background: theme.colors.border.default, borderRadius: theme.radii.sm, height: 8, overflow: "hidden" }}>
                  <div style={{ background: theme.colors.primary, height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
                </div>
              </div>
            )}
            {job.status === "completed" && (
              <ScaffoldResultPreview result={job.result as ScaffoldResultData} dryRun={dryRun} />
            )}
            {job.status === "failed" && <div style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>{job.error}</div>}
          </Card>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!resolvedSeries || !episode || job?.status === "running"}
          size="lg"
        >
          {dryRun ? t.projects.previewScaffold : t.projects.scaffoldEpisode}
        </Button>
      </div>
    </div>
  );
}

function ScaffoldResultPreview({ result, dryRun }: { result: ScaffoldResultData; dryRun: boolean }) {
  const theme = useTheme();
  const n = result.naming;
  return (
    <div style={{ marginTop: theme.spacing.sm, fontSize: theme.font.sizes.base }}>
      <div style={{ color: theme.colors.success, fontWeight: theme.font.weights.semibold, marginBottom: theme.spacing.sm }}>
        {dryRun ? "Preview — no files written" : "Scaffold complete!"}
      </div>
      <Card variant="surface" padding="sm" style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: `${theme.spacing.xs}px ${theme.spacing.md}px` }}>
        <span style={{ color: theme.colors.text.tertiary }}>Directory</span>
        <span style={{ fontFamily: theme.font.mono }}>{n.dirName}</span>
        <span style={{ color: theme.colors.text.tertiary }}>Package</span>
        <span style={{ fontFamily: theme.font.mono }}>{n.packageName}</span>
        <span style={{ color: theme.colors.text.tertiary }}>Composition</span>
        <span style={{ fontFamily: theme.font.mono }}>{n.compositionId}</span>
        <span style={{ color: theme.colors.text.tertiary }}>Scenes</span>
        <span>{n.numScenes} scenes, {n.numTransitions} transitions</span>
        <span style={{ color: theme.colors.text.tertiary }}>Files</span>
        <span>{dryRun ? `${result.filesWritten} would be created` : `${result.filesWritten} written`}</span>
      </Card>
      {result.skipped.length > 0 && (
        <div style={{ marginTop: 6, color: theme.colors.warning, fontSize: theme.font.sizes.sm }}>
          Skipped: {result.skipped.join(", ")}
        </div>
      )}
      {result.errors.length > 0 && (
        <div style={{ marginTop: 6, color: theme.colors.error, fontSize: theme.font.sizes.sm }}>
          Errors: {result.errors.join(", ")}
        </div>
      )}
    </div>
  );
}
