import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, Button, Card, InputField, type ChatMessage, loadHistory, saveHistory, VoiceManager } from "../components";
import { AdvisorPanelBase } from "../components/AdvisorPanelBase";
import { toast } from "../components/ToastContainer";
import type { Project, TTSStatus, Job, JobProgress } from "../../shared/types";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

export function TTS() {
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<string>("");
  const [status, setStatus] = useState<TTSStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [previewScene, setPreviewScene] = useState<string>("");
  const [previewJob, setPreviewJob] = useState<Job | null>(null);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [advisorMsgs, setAdvisorMsgs] = useState<ChatMessage[]>([]);

  const loadProjects = useCallback(async () => {
    const res = await api.listProjects();
    if (res.data) setProjects(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadStatus = useCallback(async (episodeId: string) => {
    if (!episodeId) { setStatus(null); return; }
    const res = await api.getTTSStatus(episodeId);
    if (res.data) setStatus(res.data);
  }, []);

  useEffect(() => { loadStatus(selectedEpisode); }, [selectedEpisode, loadStatus]);

  const handleGenerate = async () => {
    if (!selectedEpisode) return;
    const res = await api.generateTTS(selectedEpisode, { skipExisting: true });
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
      toast("error", t.tts.failedGenerate);
    }
  };

  // Flatten episodes from all projects
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
    <div style={{ display: "flex", gap: theme.spacing.xl }}>
      <div style={{ flex: 1 }}>
      <PageHeader title={t.tts.title} description={t.tts.description}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvisor(!showAdvisor)}
        >
          {showAdvisor ? t.tts.hideAdvisor : t.tts.askAdvisor}
        </Button>
      </PageHeader>

      <InfoPanel theme={theme}>
        <strong>{t.tts.infoText}</strong>
      </InfoPanel>

      <div style={{ marginBottom: theme.spacing.lg, display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
        <select
          value={selectedEpisode}
          onChange={(e) => setSelectedEpisode(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md, minWidth: 300 }}
        >
          <option value="">{t.tts.selectEpisode}</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>{ep.label}</option>
          ))}
        </select>

        <Button
          variant="primary"
          onClick={handleGenerate}
          disabled={!selectedEpisode || !status?.hasNarration || !!job}
        >
          {t.tts.generateTts}
        </Button>
      </div>

      {!selectedEpisode && (
        <EmptyState icon="🔊" title={t.tts.selectSeries} description={t.tts.selectSeriesDesc} />
      )}

      {status && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
            <Badge label={t.tts.narration} active={status.hasNarration} t={t} />
            <Badge label={t.tts.audio} active={status.hasAudio} t={t} />
          </div>

          {status.voiceMap && (
            <div style={{ fontSize: 12, color: theme.colors.text.tertiary, marginBottom: theme.spacing.sm }}>
              Voices: {Object.entries(status.voiceMap).map(([c, v]) => `${c}→${v}`).join(", ")}
            </div>
          )}

          {!status.hasNarration && (
            <div style={{ color: theme.colors.error, fontSize: theme.font.sizes.base }}>
              {t.tts.noNarration}
            </div>
          )}
        </div>
      )}

      {job && (
        <div style={{ marginBottom: theme.spacing.lg }}>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
            {job.type} — {job.status} ({job.progress}%)
          </div>
          <div style={{ background: theme.colors.border.default, borderRadius: theme.radii.md, height: 8, overflow: "hidden" }}>
            <div style={{ background: theme.colors.blue, height: "100%", width: `${job.progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {status && status.audioFiles.length > 0 && (
        <div>
          <h3 style={{ fontSize: theme.font.sizes.md, margin: `0 0 ${theme.spacing.sm}px` }}>{t.tts.audioFiles(status.audioFiles.length)}</h3>
          {status.audioFiles.map((file) => (
            <div key={file} style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: theme.colors.text.faint, minWidth: 160 }}>{file}</span>
              <audio
                controls
                src={api.assetFileUrl(status.episodeId + "/public/audio/" + file)}
                style={{ height: 32 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Scene Preview */}
      {status?.hasNarration && (
        <Card variant="outline" padding="none" style={{
          marginTop: theme.spacing.xl,
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 14px", background: theme.colors.bg.muted, fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
            Scene Preview — test TTS for a single scene
          </div>
          <div style={{ padding: 14, display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
            <InputField
              placeholder={t.tts.sceneNamePlaceholder}
              value={previewScene}
              onChange={(e) => setPreviewScene(e.target.value)}
              style={{ width: 200 }}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                if (!selectedEpisode || !previewScene) return;
                const res = await api.generateTTS(selectedEpisode, { scene: previewScene });
                if (res.data) {
                  setPreviewJob(res.data);
                  api.streamJob(res.data.id, (p: JobProgress) => {
                    setPreviewJob((prev) => prev ? { ...prev, progress: p.progress } : null);
                    if (p.progress >= 100) {
                      loadStatus(selectedEpisode);
                      setPreviewJob(null);
                    }
                  });
                } else {
                  toast("error", t.tts.failedPreview);
                }
              }}
              disabled={!previewScene || !!previewJob || !!job}
            >
              {previewJob ? t.tts.previewing(previewJob.progress) : t.tts.previewScene}
            </Button>
          </div>
        </Card>
      )}

      <VoiceManager projects={projects} />
      </div>
      {showAdvisor && (
        <AdvisorPanelBase
          agentName="studio-tts"
          title={t.tts.advisor}
          titleColor={theme.colors.blue}
          contextLabel={selectedEpisode || t.tts.title}
          historyKey="tts-advisor"
          systemPrefix={`Context: TTS Generation. Episode: ${selectedEpisode || "none"}. Helping with voice synthesis and audio production.`}
          placeholder={t.tts.advisorPlaceholder}
          messages={advisorMsgs}
          setMessages={setAdvisorMsgs}
          preferredAgents={["studio-tts", "studio-advisor"]}
        />
      )}
    </div>
  );
}

function Badge({ label, active, t }: { label: string; active: boolean; t: any }) {
  const theme = useTheme();
  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: theme.radii.md,
      fontSize: 12,
      background: active ? theme.colors.successLight : theme.colors.errorLight,
      color: active ? theme.colors.successDark : theme.colors.errorDark,
    }}>
      {label}: {active ? t.tts.yes : t.tts.no}
    </span>
  );
}

function InfoPanel({ children, theme }: { children: React.ReactNode; theme: ReturnType<typeof useTheme> }) {
  return (
    <div style={{
      padding: "8px 14px", marginBottom: theme.spacing.lg,
      border: `1px solid ${theme.colors.info}33`, borderRadius: theme.radii.md,
      background: `${theme.colors.info}08`, fontSize: theme.font.sizes.sm,
      color: theme.colors.text.secondary, lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}
