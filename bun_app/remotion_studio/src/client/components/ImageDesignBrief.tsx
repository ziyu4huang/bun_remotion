import { useState } from "react";
import { Button, Card } from "../components";
import { useTheme } from "../theme";

export interface DesignBrief {
  name: string;
  artStyle: string;
  gender: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  outfit: string;
  accessories: string;
  expression: string;
  extra: string;
}

export const EMPTY_BRIEF: DesignBrief = {
  name: "", artStyle: "anime", gender: "", hairColor: "", hairStyle: "",
  eyeColor: "", outfit: "", accessories: "", expression: "neutral", extra: "",
};

const ART_STYLES = ["anime", "watercolor", "chibi", "realistic", "pixel art", "comic"];
const EXPRESSIONS = ["neutral", "happy", "angry", "sad", "surprised", "smirking", "determined"];

export function briefToPrompt(b: DesignBrief): string {
  const parts: string[] = [];
  if (b.artStyle) parts.push(b.artStyle);
  if (b.gender) parts.push(b.gender);
  if (b.name) parts.push(`character named ${b.name}`);
  if (b.hairColor || b.hairStyle) {
    const hair = [b.hairStyle, b.hairColor].filter(Boolean).join(" ");
    parts.push(`${hair} hair`);
  }
  if (b.eyeColor) parts.push(`${b.eyeColor} eyes`);
  if (b.outfit) parts.push(`wearing ${b.outfit}`);
  if (b.accessories) parts.push(b.accessories);
  if (b.expression) parts.push(`${b.expression} expression`);
  if (b.extra) parts.push(b.extra);
  return parts.join(", ");
}

interface ImageDesignBriefProps {
  brief: DesignBrief;
  onChange: (brief: DesignBrief) => void;
  onApply: () => void;
  title: string;
  description: string;
}

export function ImageDesignBrief({ brief, onChange, onApply, title, description }: ImageDesignBriefProps) {
  const theme = useTheme();
  const [show, setShow] = useState(false);

  return (
    <Card variant="outline" padding="none" style={{ marginBottom: theme.spacing.lg }}>
      <Button onClick={() => setShow(!show)}
        variant="ghost"
        size="sm"
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: theme.colors.bg.muted }}>
        <span style={{ fontWeight: theme.font.weights.medium }}>{title} — {description}</span>
        <span>{show ? "▲" : "▼"}</span>
      </Button>
      {show && (
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
          <BriefField label="Name" value={brief.name} onChange={(v) => onChange({ ...brief, name: v })} theme={theme} />
          <BriefField label="Art Style" value={brief.artStyle} onChange={(v) => onChange({ ...brief, artStyle: v })} theme={theme} options={ART_STYLES} />
          <BriefField label="Gender" value={brief.gender} onChange={(v) => onChange({ ...brief, gender: v })} theme={theme} placeholder="e.g. girl, boy, androgynous" />
          <BriefField label="Expression" value={brief.expression} onChange={(v) => onChange({ ...brief, expression: v })} theme={theme} options={EXPRESSIONS} />
          <BriefField label="Hair Color" value={brief.hairColor} onChange={(v) => onChange({ ...brief, hairColor: v })} theme={theme} placeholder="e.g. silver, blue, black" />
          <BriefField label="Hair Style" value={brief.hairStyle} onChange={(v) => onChange({ ...brief, hairStyle: v })} theme={theme} placeholder="e.g. long, short, twin-tails" />
          <BriefField label="Eye Color" value={brief.eyeColor} onChange={(v) => onChange({ ...brief, eyeColor: v })} theme={theme} placeholder="e.g. red, green, gold" />
          <BriefField label="Outfit" value={brief.outfit} onChange={(v) => onChange({ ...brief, outfit: v })} theme={theme} placeholder="e.g. school uniform, armor, casual" />
          <BriefField label="Accessories" value={brief.accessories} onChange={(v) => onChange({ ...brief, accessories: v })} theme={theme} placeholder="e.g. sword, glasses, hat" />
          <div style={{ gridColumn: "1 / -1" }}>
            <BriefField label="Extra details" value={brief.extra} onChange={(v) => onChange({ ...brief, extra: v })} theme={theme} placeholder="Any additional details..." />
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, alignItems: "center" }}>
            <Button onClick={onApply} variant="primary" size="sm">Apply to Prompt</Button>
            <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
              Generated: {briefToPrompt(brief) || "(empty)"}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}

function BriefField({ label, value, onChange, theme, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  theme: ReturnType<typeof useTheme>; options?: string[]; placeholder?: string;
}) {
  const style: React.CSSProperties = {
    padding: "4px 8px", borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border.medium}`, width: "100%",
    fontSize: theme.font.sizes.sm, fontFamily: "inherit",
  };
  return (
    <div>
      <label style={{ display: "block", fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 2 }}>{label}</label>
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={style}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
      )}
    </div>
  );
}
