import { useState } from "react";
import { api } from "../api";
import { Button } from "./Button";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { JobProgress } from "../../shared/types";

export const TIME_OF_DAY = ["dawn", "day", "dusk", "night"] as const;
export type TimeOfDay = (typeof TIME_OF_DAY)[number];

export const TIME_OF_DAY_MODIFIERS: Record<TimeOfDay, string> = {
  dawn: "warm golden light, soft pink and orange sunrise hues, early morning mist",
  day: "bright daylight, clear sky, vibrant colors, natural sunlight",
  dusk: "warm orange and purple sunset, golden hour, long shadows",
  night: "moonlit scene, deep blue and purple tones, stars, soft cool lighting",
};

export function timeOfDayFilename(base: string, time: TimeOfDay): string {
  const baseNoExt = base.replace(/\.png$/i, "");
  return `${baseNoExt}-${time}.png`;
}

interface BackgroundVariantSheetProps {
  seriesId: string;
  prompt: string;
  filename: string;
  aspectRatio: string;
  onDone?: () => void;
}

export function BackgroundVariantSheet({
  seriesId,
  prompt,
  filename,
  aspectRatio,
  onDone,
}: BackgroundVariantSheetProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<TimeOfDay>>(
    () => new Set(TIME_OF_DAY)
  );
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const toggle = (time: TimeOfDay) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(time)) next.delete(time);
      else next.add(time);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!prompt || !filename) return;
    const times = TIME_OF_DAY.filter((t) => selected.has(t));
    if (times.length === 0) return;

    setGenerating(true);
    setProgress({ current: 0, total: times.length });

    const images = times.map((time) => ({
      filename: timeOfDayFilename(filename, time),
      prompt: `${prompt}, ${TIME_OF_DAY_MODIFIERS[time]}`,
      aspectRatio,
    }));

    const res = await api.generateImages({
      seriesId,
      images,
    });

    if (res.data) {
      let completed = 0;
      api.streamJob(res.data.id, (p: JobProgress) => {
        const est = Math.round((p.progress / 100) * times.length);
        setProgress({ current: Math.min(est, times.length), total: times.length });
        if (p.progress >= 100) {
          completed = times.length;
          setProgress({ current: completed, total: times.length });
          setGenerating(false);
          onDone?.();
        }
      });
    } else {
      setGenerating(false);
    }
  };

  const timeLabels: Record<TimeOfDay, string> = {
    dawn: t.imageGen.bgVariantDawn,
    day: t.imageGen.bgVariantDay,
    dusk: t.imageGen.bgVariantDusk,
    night: t.imageGen.bgVariantNight,
  };

  const labelStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border.medium}`,
    cursor: "pointer",
    userSelect: "none",
    fontSize: theme.font.sizes.base,
  };

  return (
    <div
      style={{
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.md,
        border: `1px solid ${theme.colors.border.medium}`,
        borderRadius: theme.radii.lg,
        background: theme.colors.surface,
      }}
    >
      <div style={{ fontWeight: theme.font.weights.semibold, marginBottom: theme.spacing.xs }}>
        {t.imageGen.bgVariantTitle}
      </div>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing.md }}>
        {t.imageGen.bgVariantDesc}
      </div>

      <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", marginBottom: theme.spacing.md }}>
        {TIME_OF_DAY.map((time) => (
          <label key={time} style={labelStyle}>
            <input
              type="checkbox"
              checked={selected.has(time)}
              onChange={() => toggle(time)}
              disabled={generating}
            />
            {timeLabels[time]}
          </label>
        ))}
      </div>

      {generating ? (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary }}>
          {t.imageGen.bgVariantGenerating
            .replace("{current}", String(progress.current))
            .replace("{total}", String(progress.total))}
        </div>
      ) : progress.total > 0 ? (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.primary }}>
          {t.imageGen.bgVariantDone.replace("{count}", String(progress.total))}
        </div>
      ) : null}

      <div style={{ marginTop: theme.spacing.sm }}>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          disabled={!prompt || !filename || selected.size === 0 || generating}
        >
          {t.imageGen.bgVariantGenerate}
        </Button>
      </div>
    </div>
  );
}
