import { useTheme } from "../theme";

export function SkeletonRow({ width = "100%", height = 16, count = 1 }: { width?: string; height?: number; count?: number }) {
  const theme = useTheme();
  return (
    <>
      <style>{`@keyframes skeleton-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{
          width, height, borderRadius: theme.radii.md, position: "relative", overflow: "hidden",
          background: theme.colors.border.default, marginBottom: i < count - 1 ? theme.spacing.sm : 0,
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(90deg, transparent 0%, ${theme.colors.bg.muted} 50%, transparent 100%)`,
            animation: "skeleton-shimmer 1.5s ease-in-out infinite",
          }} />
        </div>
      ))}
    </>
  );
}

export function SkeletonCard({ rows = 3, showHeader = true, imageHeight }: { rows?: number; showHeader?: boolean; imageHeight?: number }) {
  const theme = useTheme();
  return (
    <div style={{
      border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.xl, padding: theme.spacing.md, background: theme.colors.bg.surface,
      display: "flex", flexDirection: "column", gap: theme.spacing.sm,
    }}>
      {imageHeight && <SkeletonRow height={imageHeight} />}
      {showHeader && <SkeletonRow width="60%" height={20} />}
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} width={i === rows - 1 ? "75%" : "100%"} />
      ))}
    </div>
  );
}
