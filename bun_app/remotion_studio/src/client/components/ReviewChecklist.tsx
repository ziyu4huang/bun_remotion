import { useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { Episode } from "../../shared/types";

export function ReviewChecklist({ episodes }: { episodes: Episode[] }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const total = episodes.length;
  if (total === 0) return null;

  const checks = {
    scaffolded: episodes.filter((e) => e.hasScaffold).length,
    hasTTS: episodes.filter((e) => e.hasTTS).length,
    hasRender: episodes.filter((e) => e.hasRender).length,
    gateOk: episodes.filter((e) => (e.gateScore ?? 0) >= 50).length,
    gateScored: episodes.filter((e) => e.gateScore != null).length,
  };

  const rows: { label: string; done: number; total: number; ok: boolean }[] = [
    { label: "Scaffold complete", done: checks.scaffolded, total, ok: checks.scaffolded === total },
    { label: "TTS generated", done: checks.hasTTS, total, ok: checks.hasTTS === total },
    { label: "Rendered to MP4", done: checks.hasRender, total, ok: checks.hasRender === total },
    { label: "Gate scored (>= 50)", done: checks.gateOk, total, ok: checks.gateOk === total && checks.gateScored === total },
  ];

  const allOk = rows.every((r) => r.ok);

  return (
    <Card variant="outline" padding="none" style={{ marginTop: theme.spacing.xl, overflow: "hidden", borderColor: allOk ? theme.colors.successLight : undefined }}>
      <Button onClick={() => setOpen(!open)}
        variant="ghost"
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "10px 14px",
          background: allOk ? theme.colors.successLight : theme.colors.bg.muted,
          fontSize: theme.font.sizes.sm,
        }}>
        <span style={{ fontWeight: theme.font.weights.medium }}>
          {allOk ? `${t.projects.done}` : t.projects.reviewChecklist} ({total} episodes)
        </span>
        <span>{open ? "▲" : "▼"}</span>
      </Button>
      {open && (
        <div style={{ padding: 14 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{
                width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                background: r.ok ? theme.colors.successLight : theme.colors.warningLight,
                color: r.ok ? theme.colors.successDark : theme.colors.warningDark,
                fontSize: 12, fontWeight: 700,
              }}>
                {r.ok ? "+" : "-"}
              </span>
              <span style={{ flex: 1, fontSize: theme.font.sizes.sm }}>{r.label}</span>
              <span style={{ fontSize: theme.font.sizes.sm, color: r.ok ? theme.colors.success : theme.colors.text.secondary }}>
                {r.done}/{r.total}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
