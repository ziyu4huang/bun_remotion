import { useState, useCallback } from "react";
import { api } from "../api";
import { Button } from "./Button";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import type { CharacterProfile, Job, JobProgress } from "../../shared/types";

const EXPRESSIONS = [
  { id: "happy", label: "Happy" },
  { id: "angry", label: "Angry" },
  { id: "sad", label: "Sad" },
  { id: "surprised", label: "Surprised" },
  { id: "neutral", label: "Neutral" },
  { id: "smirk", label: "Smirk" },
  { id: "worried", label: "Worried" },
  { id: "determined", label: "Determined" },
  { id: "scared", label: "Scared" },
  { id: "laughing", label: "Laughing" },
] as const;

interface ExpressionSheetProps {
  seriesId: string;
  profiles: CharacterProfile[];
  selectedCharId: string;
  facing: "LEFT" | "RIGHT";
}

export function ExpressionSheet({ seriesId, profiles, selectedCharId, facing }: ExpressionSheetProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const char = profiles.find((p) => p.id === selectedCharId);
  const basePrompt = char?.basePrompt || char?.appearance || "";

  const toggleExpression = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === EXPRESSIONS.length ? new Set() : new Set(EXPRESSIONS.map((e) => e.id))
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!seriesId || !selectedCharId || !basePrompt || selected.size === 0) return;

    const images = Array.from(selected).map((exprId) => {
      const expr = EXPRESSIONS.find((e) => e.id === exprId);
      const exprLabel = expr?.label ?? exprId;
      return {
        filename: `${selectedCharId}-${exprId}.png`,
        prompt: `${basePrompt}, ${exprLabel.toLowerCase()} expression, facing ${facing.toLowerCase()}`,
        aspectRatio: "1:1",
      };
    });

    setGenerating(true);
    setProgress({ done: 0, total: images.length });

    const res = await api.generateImages({
      seriesId,
      images,
      skipExisting: true,
      enhanceWithCharacter: { facing },
    });

    if (res.data) {
      const jobId = res.data.id;
      api.streamJob(jobId, (p: JobProgress) => {
        const done = Math.round((p.progress / 100) * images.length);
        setProgress({ done, total: images.length });
        if (p.progress >= 100) {
          setGenerating(false);
          setProgress(null);
        }
      });
    } else {
      setGenerating(false);
      setProgress(null);
    }
  }, [seriesId, selectedCharId, basePrompt, facing, selected]);

  if (!char) return null;

  const cardStyle: React.CSSProperties = {
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radii.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  };

  const checkboxStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing.xs,
    padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border.light}`,
    cursor: "pointer",
    userSelect: "none",
    background: theme.colors.bg.surface,
    fontSize: theme.font.sizes.sm,
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.md, marginBottom: theme.spacing.md }}>
        {t.imageGen.expressionSheetTitle}
      </div>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: theme.spacing.md }}>
        {t.imageGen.expressionSheetDesc}
      </div>

      <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap", marginBottom: theme.spacing.md }}>
        {EXPRESSIONS.map((expr) => (
          <label key={expr.id} style={{
            ...checkboxStyle,
            borderColor: selected.has(expr.id) ? theme.colors.primary : theme.colors.border.light,
            background: selected.has(expr.id) ? theme.colors.primaryLight : theme.colors.bg.surface,
          }}>
            <input
              type="checkbox"
              checked={selected.has(expr.id)}
              onChange={() => toggleExpression(expr.id)}
            />
            {expr.label}
          </label>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md }}>
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {selected.size === EXPRESSIONS.length ? t.imageGen.expressionDeselectAll : t.imageGen.expressionSelectAll}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleGenerate}
          disabled={selected.size === 0 || generating || !basePrompt}
        >
          {generating
            ? `${t.imageGen.expressionGenerating} (${progress ? `${progress.done}/${progress.total}` : "..."})`
            : `${t.imageGen.expressionGenerate} (${selected.size})`}
        </Button>
      </div>
    </div>
  );
}
