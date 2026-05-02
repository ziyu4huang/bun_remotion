import { Button } from "../components";
import { useTheme } from "../theme";
import { api } from "../api";
import type { CharacterProfile } from "../../shared/types";

interface ImageVariantGalleryProps {
  seriesId: string;
  character: CharacterProfile;
  onSelectVariant: (prompt: string) => void;
  variantsLabel: string;
  clickHint: string;
}

export function ImageVariantGallery({ seriesId, character, onSelectVariant, variantsLabel, clickHint }: ImageVariantGalleryProps) {
  const theme = useTheme();

  if (character.variants.length === 0) return null;

  return (
    <div style={{ marginBottom: theme.spacing.lg }}>
      <label style={{ display: "block", marginBottom: theme.spacing.xs, fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.base }}>
        {variantsLabel} ({clickHint})
      </label>
      <div style={{ display: "flex", gap: theme.spacing.sm, flexWrap: "wrap" }}>
        {character.variants.map((v) => (
          <Button
            key={v.file}
            variant="ghost"
            size="sm"
            onClick={() => onSelectVariant(v.prompt)}
            title={v.prompt}
            style={{ width: 64, height: 64, overflow: "hidden", position: "relative", padding: 0 }}
          >
            <img
              src={api.assetFileUrl(`${seriesId}/assets/characters/${v.file}`)}
              alt={v.emotion ?? v.type}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <span style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: theme.colors.bg.overlayLight,
              color: theme.colors.bg.page,
              fontSize: 9, textAlign: "center", padding: "1px 0",
            }}>
              {v.emotion ?? v.type}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
