import { useTheme, type Theme } from "../theme";
import { Button } from "./Button";
import type { Project } from "../../shared/types";

type Mode = "regex" | "hybrid" | "ai";

function HelpTip({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <span role="img" aria-label={text} title={text} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: theme.colors.border.default, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.xs, cursor: "help", marginLeft: theme.spacing.xs, flexShrink: 0 }}>
      ?
    </span>
  );
}

interface StorygraphActionPanelProps {
  projects: Project[];
  selected: string;
  mode: Mode;
  isRunning: boolean;
  onSeriesChange: (id: string) => void;
  onModeChange: (mode: Mode) => void;
  onRun: (action: "pipeline" | "check" | "score") => void;
  labels: {
    selectSeries: string;
    hybrid: string;
    regex: string;
    aiOnly: string;
    extractKg: string;
    qualityGate: string;
    aiScore: string;
  };
  modeHelp: Record<Mode, string>;
  actionHelp: { pipeline: string; check: string; score: string };
}

export function StorygraphActionPanel({
  projects, selected, mode, isRunning,
  onSeriesChange, onModeChange, onRun,
  labels, modeHelp, actionHelp,
}: StorygraphActionPanelProps) {
  const theme = useTheme();
  const selectStyle: React.CSSProperties = {
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    fontSize: theme.font.sizes.md,
    borderRadius: theme.radii.lg,
    border: `1px solid ${theme.colors.border.medium}`,
  };

  return (
    <>
      <div style={{ display: "flex", gap: theme.spacing.xl, marginBottom: theme.spacing.sm, alignItems: "center", flexWrap: "wrap" }}>
        <select value={selected} onChange={(e) => onSeriesChange(e.target.value)} aria-label={labels.selectSeries} style={{ ...selectStyle, minWidth: 200 }}>
          <option value="">{labels.selectSeries}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div style={{ display: "flex", alignItems: "center" }}>
          <select value={mode} onChange={(e) => onModeChange(e.target.value as Mode)} aria-label="Extraction mode" style={selectStyle}>
            <option value="hybrid">{labels.hybrid}</option>
            <option value="regex">{labels.regex}</option>
            <option value="ai">{labels.aiOnly}</option>
          </select>
          <HelpTip text={modeHelp[mode]} />
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Button variant="primary" size="sm" onClick={() => onRun("pipeline")} disabled={!selected || isRunning}>
            {labels.extractKg}
          </Button>
          <HelpTip text={actionHelp.pipeline} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button variant="secondary" size="sm" onClick={() => onRun("check")} disabled={!selected || isRunning}>
            {labels.qualityGate}
          </Button>
          <HelpTip text={actionHelp.check} />
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button variant="ai" size="sm" onClick={() => onRun("score")} disabled={!selected || isRunning}>
            {labels.aiScore}
          </Button>
          <HelpTip text={actionHelp.score} />
        </div>
      </div>

      {selected && (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.faint, marginBottom: theme.spacing.xl, maxWidth: 700 }}>
          Mode: <b>{mode}</b> — {modeHelp[mode]}
        </div>
      )}
    </>
  );
}
