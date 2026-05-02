import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { StatusBadge } from "./index";

interface PlanSection {
  key: string;
  title: string;
  body: string;
}

interface PlanData {
  raw: string;
  sections: PlanSection[];
  parsed: {
    seriesId: string;
    seriesName: string;
    characters: { id: string; name: string; voice: string; gender: string; color: string | null }[] | null;
    episodeGuide: { id: string; title: string; status: string; chapter: number | null; episode: number | null }[] | null;
    storyArcs: { chapter: number; title: string; theme: string }[] | null;
    runningGags: { gagTypes: string[]; episodeColumns: string[] } | null;
    chapters: { chapter: number; episodeCount: number; completedCount: number; status: string }[];
  };
}

export { type PlanData as StoryEditorPlanData };

export function StoryEditorSections({ data }: { data: PlanData }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { parsed } = data;
  return (
    <div style={{ display: "grid", gap: theme.spacing.xl }}>
      {parsed.characters && parsed.characters.length > 0 && (
        <SectionCard title={`${t.storyEditor.characters} (${parsed.characters.length})`}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
            <thead>
              <tr>
                <th style={thStyle(theme)}>ID</th>
                <th style={thStyle(theme)}>Name</th>
                <th style={thStyle(theme)}>Voice</th>
                <th style={thStyle(theme)}>Gender</th>
                <th style={thStyle(theme)}>Color</th>
              </tr>
            </thead>
            <tbody>
              {parsed.characters.map((c) => (
                <tr key={c.id}>
                  <td style={tdStyle(theme)}>{c.id}</td>
                  <td style={tdStyle(theme)}>{c.name}</td>
                  <td style={tdStyle(theme)}>{c.voice}</td>
                  <td style={tdStyle(theme)}>{c.gender}</td>
                  <td style={tdStyle(theme)}>{c.color ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {parsed.episodeGuide && parsed.episodeGuide.length > 0 && (
        <SectionCard title={`${t.storyEditor.episodeGuide} (${parsed.episodeGuide.length})`}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
            <thead>
              <tr>
                <th style={thStyle(theme)}>ID</th>
                <th style={thStyle(theme)}>Title</th>
                <th style={thStyle(theme)}>Status</th>
              </tr>
            </thead>
            <tbody>
              {parsed.episodeGuide.map((ep) => (
                <tr key={ep.id}>
                  <td style={tdStyle(theme)}><code>{ep.id}</code></td>
                  <td style={tdStyle(theme)}>{ep.title}</td>
                  <td style={tdStyle(theme)}><StatusBadge status={ep.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {parsed.chapters.length > 0 && (
        <SectionCard title={`${t.storyEditor.chapters} (${parsed.chapters.length})`}>
          <div style={{ display: "flex", gap: theme.spacing.md, flexWrap: "wrap" }}>
            {parsed.chapters.map((ch) => (
              <div
                key={ch.chapter}
                style={{
                  padding: `10px ${theme.spacing.xl}px`,
                  borderRadius: theme.radii.xl,
                  background: ch.status === "complete" ? theme.colors.successLight : ch.status === "in_progress" ? theme.colors.warningLight : theme.colors.bg.muted,
                  border: `1px solid ${theme.colors.border.medium}`,
                  minWidth: 140,
                }}
              >
                <div style={{ fontWeight: theme.font.weights.semibold }}>Chapter {ch.chapter}</div>
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>
                  {ch.completedCount}/{ch.episodeCount} done
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {parsed.storyArcs && parsed.storyArcs.length > 0 && (
        <SectionCard title={`${t.storyEditor.storyArcs} (${parsed.storyArcs.length})`}>
          {parsed.storyArcs.map((arc) => (
            <div key={arc.chapter} style={{ marginBottom: theme.spacing.sm, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`, background: theme.colors.bg.muted, borderRadius: theme.radii.lg }}>
              <strong>Chapter {arc.chapter}: {arc.title}</strong>
              {arc.theme && <span style={{ marginLeft: theme.spacing.sm, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.base }}>({arc.theme})</span>}
            </div>
          ))}
        </SectionCard>
      )}

      {parsed.runningGags && (
        <SectionCard title={`${t.storyEditor.runningGags} (${parsed.runningGags.gagTypes.length})`}>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.tertiary }}>
            {parsed.runningGags.gagTypes.join(", ")}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <div style={{ border: `1px solid ${theme.colors.border.default}`, borderRadius: theme.radii.xl, overflow: "hidden" }}>
      <div style={{ padding: `10px ${theme.spacing.xl}px`, background: theme.colors.bg.surface, borderBottom: `1px solid ${theme.colors.border.default}`, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.md }}>
        {title}
      </div>
      <div style={{ padding: theme.spacing.xl }}>{children}</div>
    </div>
  );
}

function thStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    textAlign: "left",
    padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
    borderBottom: `2px solid ${theme.colors.border.default}`,
    fontWeight: theme.font.weights.semibold,
    fontSize: theme.font.sizes.base,
  };
}

function tdStyle(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: `6px ${theme.spacing.md}px`,
    borderBottom: `1px solid ${theme.colors.border.light}`,
    fontSize: theme.font.sizes.base,
  };
}
