import { Button } from "./index";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

export function StoryEditorRevision({
  revisions,
  selectedId,
  viewingRev,
  revContent,
  onViewRev,
  onRestore,
  onCloseRev,
}: {
  revisions: { id: string; timestamp: string; size: number }[];
  selectedId: string;
  viewingRev: string | null;
  revContent: string | null;
  onViewRev: (id: string, content: string) => void;
  onRestore: (content: string) => void;
  onCloseRev: () => void;
}) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <div style={{
      marginTop: theme.spacing.lg,
      border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.lg,
      overflow: "hidden",
    }}>
      <div style={{ padding: "10px 14px", background: theme.colors.bg.muted, fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
        {t.storyEditor.revisionHistory} ({revisions.length})
      </div>
      <div style={{ padding: 14, maxHeight: 400, overflowY: "auto" }}>
        {viewingRev && revContent !== null && (
          <div style={{ marginBottom: 14, padding: 10, border: `1px solid ${theme.colors.info}33`, borderRadius: theme.radii.md, background: `${theme.colors.info}08` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>{t.storyEditor.viewing} {viewingRev}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Button variant="primary" size="sm" onClick={() => onRestore(revContent)}>
                  {t.storyEditor.restore}
                </Button>
                <Button variant="ghost" size="sm" onClick={onCloseRev}>
                  {t.storyEditor.close}
                </Button>
              </div>
            </div>
            <pre style={{ fontSize: theme.font.sizes.xs, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap", margin: 0 }}>
              {revContent.slice(0, 2000)}{revContent.length > 2000 ? "..." : ""}
            </pre>
          </div>
        )}
        {revisions.length === 0 ? (
          <div style={{ color: theme.colors.text.muted, fontSize: theme.font.sizes.sm }}>{t.storyEditor.noRevisions}</div>
        ) : (
          revisions.map((rev) => (
            <Button key={rev.id} variant="ghost" size="sm" onClick={async () => {
              const res = await fetch(`/api/plans/${selectedId}/revisions/${rev.id}`);
              const data = await res.json();
              if (data.ok) onViewRev(rev.id, data.data);
            }} style={{
              display: "block", width: "100%", textAlign: "left",
              marginBottom: 4,
            }}>
              <span style={{ color: theme.colors.text.secondary }}>{rev.id.replace(/-/g, (m, o) => o < 10 ? "-" : o === 10 ? " " : o < 19 ? ":" : "")}</span>
              <span style={{ marginLeft: 8, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.xs }}>
                {Math.round(rev.size / 1024)}KB
              </span>
            </Button>
          ))
        )}
      </div>
    </div>
  );
}
