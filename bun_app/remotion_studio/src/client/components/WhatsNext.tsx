import { useEffect, useState } from "react";
import { api } from "../api";
import { StatusBadge } from "./StatusBadge";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { EpisodeProgress, EpisodeStepProgress } from "../../shared/types";

const STEP_ROUTE: Record<string, { page: string; label: string }> = {
  scaffold: { page: "projects", label: "Scaffold Episode" },
  pipeline: { page: "storygraph", label: "Extract KG" },
  check: { page: "storygraph", label: "Quality Gate" },
  score: { page: "storygraph", label: "AI Score" },
  image: { page: "image", label: "Generate Images" },
  tts: { page: "tts", label: "Generate TTS" },
  render: { page: "render", label: "Render Video" },
};

export function WhatsNext() {
  const theme = useTheme();
  const { t } = useI18n();
  const [episodes, setEpisodes] = useState<EpisodeProgress[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getEpisodeProgress().then((res) => {
      if (res.data) setEpisodes(res.data.episodes);
      setLoaded(true);
    });
  }, []);

  if (!loaded || episodes.length === 0) return null;

  const stepCounts: Partial<Record<keyof EpisodeStepProgress, number>> = {};
  for (const ep of episodes) {
    if (ep.completedSteps === ep.totalSteps) continue;
    for (const key of ["scaffold", "pipeline", "check", "score", "image", "tts", "render"] as const) {
      if (!ep.steps[key]) {
        stepCounts[key] = (stepCounts[key] ?? 0) + 1;
        break;
      }
    }
  }

  const nextStep = (Object.entries(stepCounts) as [keyof EpisodeStepProgress, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (!nextStep) return null;

  const info = STEP_ROUTE[nextStep[0]];
  const incomplete = episodes.filter((e) => e.completedSteps < e.totalSteps).length;

  return (
    <section style={{ marginBottom: theme.spacing.xxl }}>
      <div style={{
        padding: "14px 18px",
        border: `1px solid ${theme.colors.primary}33`, borderRadius: theme.radii.lg,
        background: `${theme.colors.primary}08`,
      }}>
        <div style={{ fontSize: theme.font.sizes.base, fontWeight: theme.font.weights.semibold, marginBottom: 6, color: theme.colors.primaryDark }}>
          {t.dashboard.whatsNext}
        </div>
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, lineHeight: 1.6 }}>
          {t.dashboard.episodesInProgress(incomplete)}. {t.dashboard.mostCommonStep}{" "}
          <strong>{t.dashboard.steps[nextStep[0] as keyof typeof t.dashboard.steps] ?? nextStep[0]}</strong> ({t.dashboard.waiting(nextStep[1])}).
          {" "}{t.dashboard.goTo} <strong>{info?.page ?? nextStep[0]}</strong> to continue.
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {(Object.entries(stepCounts) as [string, number][])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([step, count]) => (
              <StatusBadge key={step} status="pending" label={`${t.dashboard.steps[step as keyof typeof t.dashboard.steps] ?? step}: ${count}`} />
            ))}
        </div>
      </div>
    </section>
  );
}
