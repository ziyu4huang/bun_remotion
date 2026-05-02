import type { useTheme } from "../theme";

export function WizardProgressBar({ pct, color, theme }: {
  pct: number;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <div style={{
      height: 4,
      borderRadius: 2,
      background: theme.colors.bg.muted,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        borderRadius: 2,
        background: color,
        transition: "width 0.3s ease",
      }} />
    </div>
  );
}
