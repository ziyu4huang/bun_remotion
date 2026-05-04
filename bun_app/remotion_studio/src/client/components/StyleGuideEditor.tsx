import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { Button, Card } from ".";
import { useTheme } from "../theme";
import type { StyleGuide } from "../../shared/types";

interface StyleGuideEditorProps {
  seriesId: string;
  onApplyPrefix: (prefix: string) => void;
  labels: {
    title: string;
    description: string;
    artStyle: string;
    colorPalette: string;
    mood: string;
    recurringElements: string;
    additionalNotes: string;
    apply: string;
    save: string;
    deleteGuide: string;
    noGuide: string;
    saved: string;
  };
}

type GuideField = "artStyle" | "colorPalette" | "mood" | "recurringElements" | "additionalNotes";

const FIELDS: { key: GuideField; placeholder: string }[] = [
  { key: "artStyle", placeholder: "anime, watercolor, chibi, realistic..." },
  { key: "colorPalette", placeholder: "warm tones, pastel, dark moody..." },
  { key: "mood", placeholder: "dramatic, lighthearted, mysterious..." },
  { key: "recurringElements", placeholder: "cherry blossoms, moon, swords..." },
  { key: "additionalNotes", placeholder: "Any extra style notes..." },
];

export function StyleGuideEditor({ seriesId, onApplyPrefix, labels }: StyleGuideEditorProps) {
  const theme = useTheme();
  const [guide, setGuide] = useState<StyleGuide | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!seriesId) return;
    const res = await api.getStyleGuide(seriesId);
    setGuide(res.data ?? null);
    setDirty(false);
  }, [seriesId]);

  useEffect(() => { load(); }, [load]);

  const handleFieldChange = (key: GuideField, value: string) => {
    setGuide((prev) => prev ? { ...prev, [key]: value } : { seriesId, [key]: value, artStyle: "", colorPalette: "", mood: "", recurringElements: "", additionalNotes: "", updatedAt: new Date().toISOString(), [key]: value } as StyleGuide);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!seriesId) return;
    setSaving(true);
    const data: Record<string, string> = {};
    for (const f of FIELDS) {
      data[f.key] = (guide as any)?.[f.key] ?? "";
    }
    const res = await api.saveStyleGuide(seriesId, data);
    if (res.data) setGuide(res.data);
    setSaving(false);
    setDirty(false);
  };

  const handleDelete = async () => {
    await api.deleteStyleGuide(seriesId);
    setGuide(null);
    setDirty(false);
  };

  const handleApply = () => {
    if (!guide) return;
    const parts: string[] = [];
    if (guide.artStyle) parts.push(`art style: ${guide.artStyle}`);
    if (guide.colorPalette) parts.push(`colors: ${guide.colorPalette}`);
    if (guide.mood) parts.push(`mood: ${guide.mood}`);
    if (guide.recurringElements) parts.push(`elements: ${guide.recurringElements}`);
    onApplyPrefix(parts.join(", "));
  };

  const inputStyle: React.CSSProperties = {
    padding: `4px ${theme.spacing.sm}px`,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border.medium}`,
    fontFamily: "inherit",
    fontSize: theme.font.sizes.sm,
    width: "100%",
    maxWidth: 400,
  };

  return (
    <Card variant="surface" style={{ marginBottom: theme.spacing.lg }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <div style={{ fontWeight: theme.font.weights.semibold }}>{labels.title}</div>
          <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary }}>{labels.description}</div>
        </div>
        <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ marginTop: theme.spacing.md }}>
          {!guide && !dirty ? (
            <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, marginBottom: theme.spacing.sm }}>
              {labels.noGuide}
            </div>
          ) : null}
          {FIELDS.map((f) => (
            <div key={f.key} style={{ marginBottom: theme.spacing.sm }}>
              <label style={{ display: "block", fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.medium, marginBottom: 2 }}>
                {labels[f.key]}
              </label>
              {f.key === "additionalNotes" ? (
                <textarea
                  value={(guide as any)?.[f.key] ?? ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  rows={2}
                  style={inputStyle}
                />
              ) : (
                <input
                  value={(guide as any)?.[f.key] ?? ""}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? labels.saved + "..." : labels.save}
            </Button>
            <Button variant="outline" size="sm" onClick={handleApply} disabled={!guide}>
              {labels.apply}
            </Button>
            {guide && (
              <Button variant="ghost" size="sm" onClick={handleDelete}>
                {labels.deleteGuide}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
