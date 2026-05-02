import type { FC } from "react";
import { Button } from "./Button";

interface ImageItem {
  filename: string;
  prompt: string;
  aspectRatio?: string;
}

interface WorkflowImageEditorProps {
  imageItems: ImageItem[];
  onChange: (items: ImageItem[]) => void;
  labels: {
    title: string;
    add: string;
    placeholderFilename: string;
    placeholderPrompt: string;
  };
  theme: any;
}

export const WorkflowImageEditor: FC<WorkflowImageEditorProps> = ({
  imageItems,
  onChange,
  labels,
  theme,
}) => (
  <div style={{ marginBottom: theme.spacing.lg }}>
    <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
      <span style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, fontWeight: theme.font.weights.semibold }}>
        {labels.title} ({imageItems.length})
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...imageItems, { filename: "", prompt: "" }])}
      >
        {labels.add}
      </Button>
    </div>
    {imageItems.map((item, idx) => (
      <div key={idx} style={{ display: "flex", gap: theme.spacing.xs, marginBottom: theme.spacing.xs, alignItems: "center" }}>
        <input
          placeholder={labels.placeholderFilename}
          value={item.filename}
          onChange={(e) => {
            const next = [...imageItems];
            next[idx] = { ...next[idx], filename: e.target.value };
            onChange(next);
          }}
          style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border.medium}`, fontSize: theme.font.sizes.base, width: 150 }}
        />
        <input
          placeholder={labels.placeholderPrompt}
          value={item.prompt}
          onChange={(e) => {
            const next = [...imageItems];
            next[idx] = { ...next[idx], prompt: e.target.value };
            onChange(next);
          }}
          style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.border.medium}`, fontSize: theme.font.sizes.base, flex: 1 }}
        />
        <Button
          variant="danger"
          size="sm"
          onClick={() => onChange(imageItems.filter((_, i) => i !== idx))}
        >
          x
        </Button>
      </div>
    ))}
  </div>
);
