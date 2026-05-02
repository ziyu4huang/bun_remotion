import { Card } from "../components";
import { useTheme, scoreColor } from "../theme";

interface QualityDimensionsProps {
  aiDimensions?: Record<string, number>;
  breakdown?: Record<string, number | null>;
}

export function QualityDimensions({ aiDimensions, breakdown }: QualityDimensionsProps) {
  const theme = useTheme();

  return (
    <>
      {aiDimensions && (
        <div style={{ marginBottom: theme.spacing.xxl }}>
          <h3 style={{ marginBottom: theme.spacing.sm }}>AI Quality Dimensions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: theme.spacing.sm }}>
            {Object.entries(aiDimensions).map(([key, value]) => (
              <Card key={key} variant="default" padding="sm">
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{formatDimensionName(key)}</div>
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                  <div style={{ fontSize: theme.font.sizes.xl, fontWeight: theme.font.weights.semibold, color: scoreColor(value, 10, theme) }}>
                    {value}
                  </div>
                  <div style={{ flex: 1, height: 4, background: theme.colors.border.default, borderRadius: 2 }}>
                    <div style={{ width: `${value * 10}%`, height: "100%", background: scoreColor(value, 10, theme), borderRadius: 2 }} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {breakdown && (
        <div style={{ marginBottom: theme.spacing.xxl }}>
          <h3 style={{ marginBottom: theme.spacing.sm }}>Quality Breakdown</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: theme.spacing.sm }}>
            {Object.entries(breakdown).map(([key, value]) => (
              <Card key={key} variant="default" padding="sm">
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{formatDimensionName(key)}</div>
                <div style={{ fontSize: theme.font.sizes.xl, fontWeight: theme.font.weights.semibold, color: value == null ? theme.colors.text.muted : scoreColor(value * 100, 100, theme) }}>
                  {value == null ? "N/A" : `${(value * 100).toFixed(0)}%`}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function formatDimensionName(key: string): string {
  const names: Record<string, string> = {
    entity_accuracy: "Entity Accuracy",
    relationship_correctness: "Relationship Correctness",
    completeness: "Completeness",
    cross_episode_coherence: "Cross-Episode Coherence",
    actionability: "Actionability",
    consistency: "Consistency",
    arc_structure: "Arc Structure",
    pacing: "Pacing",
    character_growth: "Character Growth",
    thematic_coherence: "Thematic Coherence",
    gag_evolution: "Gag Evolution",
  };
  return names[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
