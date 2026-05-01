import { useTheme } from "../theme";

export interface PipelineToolInfo {
  name: string;
  status: "running" | "done" | "error";
  result?: string;
  isError?: boolean;
}

type PipelineOpType = "scaffold" | "render" | "tts" | "image" | "pipeline" | "check" | "score" | "review" | "spawn" | "other";

const PIPELINE_TOOL_MAP: Record<string, { op: PipelineOpType; label: string }> = {
  sc_scaffold: { op: "scaffold", label: "Scaffold Episode" },
  render_episode: { op: "render", label: "Render Video" },
  render_status: { op: "render", label: "Check Render" },
  render_list: { op: "render", label: "List Renders" },
  tts_generate: { op: "tts", label: "Generate TTS" },
  tts_status: { op: "tts", label: "Check TTS" },
  tts_voices: { op: "tts", label: "List Voices" },
  image_generate: { op: "image", label: "Generate Image" },
  image_status: { op: "image", label: "Check Images" },
  image_characters: { op: "image", label: "Character Profiles" },
  sg_pipeline: { op: "pipeline", label: "Extract KG" },
  sg_check: { op: "check", label: "Quality Gate" },
  sg_score: { op: "score", label: "AI Score" },
  sg_dual_review: { op: "review", label: "Dual Review" },
  sg_health: { op: "check", label: "Health Check" },
  sg_regression: { op: "check", label: "Regression Check" },
  sg_suggest: { op: "check", label: "Suggestions" },
  sg_status: { op: "check", label: "Pipeline Status" },
  sg_baseline_list: { op: "check", label: "List Baselines" },
  sg_baseline_update: { op: "check", label: "Update Baseline" },
  rm_analyze: { op: "review", label: "Analyze" },
  rm_lint: { op: "review", label: "Lint" },
  rm_suggest: { op: "review", label: "Suggest" },
  sc_series_list: { op: "scaffold", label: "List Series" },
  sc_episode_list: { op: "scaffold", label: "List Episodes" },
  spawn_task: { op: "spawn", label: "Delegate Task" },
};

const OP_ICONS: Record<PipelineOpType, string> = {
  scaffold: "🏗️",
  render: "🎬",
  tts: "🔊",
  image: "🖼️",
  pipeline: "🕸️",
  check: "✅",
  score: "📊",
  review: "🔍",
  spawn: "📤",
  other: "🔧",
};

const OP_COLORS: Record<PipelineOpType, { bg: string; border: string; text: string }> = {
  scaffold: { bg: "#eff6ff", border: "#3b82f6", text: "#1e40af" },
  render: { bg: "#fef2f2", border: "#ef4444", text: "#991b1b" },
  tts: { bg: "#f0fdf4", border: "#22c55e", text: "#166534" },
  image: { bg: "#faf5ff", border: "#a855f7", text: "#6b21a8" },
  pipeline: { bg: "#fefce8", border: "#eab308", text: "#854d0e" },
  check: { bg: "#f0fdf4", border: "#16a34a", text: "#166534" },
  score: { bg: "#eff6ff", border: "#6366f1", text: "#312e81" },
  review: { bg: "#fdf2f8", border: "#ec4899", text: "#9d174d" },
  spawn: { bg: "#f5f5f4", border: "#78716c", text: "#44403c" },
  other: { bg: "#f5f5f4", border: "#78716c", text: "#44403c" },
};

/** Parse metrics from tool result text. Returns key-value pairs extracted from common patterns. */
function parseMetrics(text: string): Array<{ label: string; value: string }> {
  const metrics: Array<{ label: string; value: string }> = [];
  const patterns: Array<{ re: RegExp; label: string }> = [
    { re: /Files?(?:\s+written)?:\s*(\d+)/i, label: "Files" },
    { re: /Directory:\s*(.+)/i, label: "Dir" },
    { re: /Duration:\s*(\S+)/i, label: "Duration" },
    { re: /Size:\s*(\S+)/i, label: "Size" },
    { re: /Scenes:\s*(\d+)/i, label: "Scenes" },
    { re: /Nodes:\s*(\d+)/i, label: "Nodes" },
    { re: /Edges:\s*(\d+)/i, label: "Edges" },
    { re: /Score:\s*(\S+)/i, label: "Score" },
    { re: /Output:\s*(.+)/i, label: "Output" },
    { re: /Episodes?:\s*(\d+)/i, label: "Episodes" },
    { re: /Rendered:\s*(\d+)/i, label: "Rendered" },
    { re: /Characters:\s*(\d+)/i, label: "Characters" },
    { re: /Backgrounds:\s*(\d+)/i, label: "Backgrounds" },
  ];
  for (const { re, label } of patterns) {
    const m = text.match(re);
    if (m) {
      metrics.push({ label, value: m[1] });
      if (metrics.length >= 4) break;
    }
  }
  return metrics;
}

export function getPipelineOp(toolName: string): { op: PipelineOpType; label: string } {
  return PIPELINE_TOOL_MAP[toolName] ?? { op: "other" as PipelineOpType, label: toolName };
}

export function PipelineToolCard({ tc }: { tc: PipelineToolInfo }) {
  const theme = useTheme();
  const { op, label } = getPipelineOp(tc.name);
  const icon = OP_ICONS[op];
  const colors = OP_COLORS[op];
  const metrics = tc.result ? parseMetrics(tc.result) : [];
  const isError = tc.status === "error" || tc.isError;

  return (
    <div
      data-testid="pipeline-tool-card"
      style={{
        margin: "4px 0",
        borderRadius: theme.radii.lg,
        border: `1px solid ${isError ? theme.colors.error : colors.border}`,
        background: isError ? theme.colors.errorLight : colors.bg,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderBottom: metrics.length > 0 ? `1px solid ${theme.colors.border.light}` : "none",
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{
          fontSize: 13,
          fontWeight: 600,
          color: isError ? theme.colors.error : colors.text,
        }}>
          {label}
        </span>
        {tc.status === "running" && (
          <span style={{ fontSize: 12, color: theme.colors.text.muted }}>running...</span>
        )}
        {tc.status === "done" && !isError && (
          <span style={{
            fontSize: 11,
            padding: "1px 8px",
            borderRadius: theme.radii.sm,
            background: theme.colors.successLight,
            color: theme.colors.success,
          }}>
            Done
          </span>
        )}
        {isError && (
          <span style={{
            fontSize: 11,
            padding: "1px 8px",
            borderRadius: theme.radii.sm,
            background: theme.colors.errorLight,
            color: theme.colors.error,
          }}>
            Failed
          </span>
        )}
      </div>

      {/* Metrics */}
      {metrics.length > 0 && (
        <div style={{
          display: "flex",
          gap: 16,
          padding: "4px 12px 6px",
          flexWrap: "wrap",
        }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 4, alignItems: "baseline" }}>
              <span style={{ fontSize: 11, color: theme.colors.text.muted }}>{m.label}:</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: colors.text }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {isError && tc.result && (
        <pre style={{
          margin: 0,
          padding: "4px 12px 6px",
          fontSize: 11,
          color: theme.colors.error,
          whiteSpace: "pre-wrap",
          maxHeight: 100,
          overflow: "auto",
        }}>
          {tc.result.slice(0, 300)}
        </pre>
      )}
    </div>
  );
}
