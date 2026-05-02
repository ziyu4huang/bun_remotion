import { useTheme } from "../theme";
import { useI18n } from "../i18n";

interface PlanData {
  parsed: {
    characters: { id: string; name: string; voice: string; gender: string; color: string | null }[] | null;
    episodeGuide: { id: string; title: string; status: string; chapter: number | null; episode: number | null }[] | null;
    storyArcs: { chapter: number; title: string; theme: string }[] | null;
    chapters: { chapter: number; episodeCount: number; completedCount: number; status: string }[];
  };
}

export function StoryEditorHints({ data }: { data: PlanData }) {
  const theme = useTheme();
  const { t } = useI18n();
  const hints: { icon: string; msg: string; level: "warn" | "info" }[] = [];
  const { parsed } = data;

  if (!parsed.characters || parsed.characters.length === 0) {
    hints.push({ icon: "!", msg: "No characters defined. Add a ## Characters section with id, name, voice, gender columns.", level: "warn" });
  } else {
    const missingVoice = parsed.characters.filter((c) => !c.voice);
    if (missingVoice.length > 0) {
      hints.push({ icon: "!", msg: `${missingVoice.length} character(s) missing voice assignment: ${missingVoice.map((c) => c.name).join(", ")}`, level: "warn" });
    }
    const missingColor = parsed.characters.filter((c) => !c.color);
    if (missingColor.length > 0) {
      hints.push({ icon: "i", msg: `${missingColor.length} character(s) missing color: ${missingColor.map((c) => c.name).join(", ")}`, level: "info" });
    }
  }

  if (!parsed.episodeGuide || parsed.episodeGuide.length === 0) {
    hints.push({ icon: "!", msg: "No episode guide defined. Add a ## Episode Guide section.", level: "warn" });
  } else {
    const pending = parsed.episodeGuide.filter((e) => e.status === "pending" || e.status === "planned");
    if (pending.length > 0) {
      hints.push({ icon: "i", msg: `${pending.length} episode(s) still pending/planned`, level: "info" });
    }
  }

  if (!parsed.storyArcs || parsed.storyArcs.length === 0) {
    hints.push({ icon: "i", msg: "No story arcs defined. Consider adding a ## Story Arcs section for continuity tracking.", level: "info" });
  }

  if (parsed.chapters.length === 0) {
    hints.push({ icon: "!", msg: "No chapters detected. Ensure episode IDs follow the pattern: series-chN-epM.", level: "warn" });
  }

  if (hints.length === 0) return null;

  return (
    <div style={{
      marginBottom: theme.spacing.lg,
      border: `1px solid ${theme.colors.warningLight}`, borderRadius: theme.radii.lg,
      overflow: "hidden",
    }}>
      <div style={{ padding: "8px 14px", background: theme.colors.warningLight, fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm }}>
        {t.storyEditor.qualityHints} ({hints.length})
      </div>
      <div style={{ padding: "8px 14px" }}>
        {hints.map((h, i) => (
          <div key={i} style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            marginBottom: i < hints.length - 1 ? 6 : 0,
            fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary,
          }}>
            <span style={{
              flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: h.level === "warn" ? theme.colors.warningLight : theme.colors.info + "22",
              color: h.level === "warn" ? theme.colors.warningDark : theme.colors.info,
              fontSize: 11, fontWeight: 700,
            }}>
              {h.icon}
            </span>
            {h.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
