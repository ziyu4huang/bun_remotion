import { useState } from "react";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { PageHeader, Card } from "../components";

const GLOBAL_MODEL_KEY = "remotion_studio_global_model";

export function loadGlobalModel(): string {
  try { return localStorage.getItem(GLOBAL_MODEL_KEY) || ""; } catch { return ""; }
}

export function saveGlobalModel(model: string) {
  try { localStorage.setItem(GLOBAL_MODEL_KEY, model); } catch { /* noop */ }
}

const PROVIDER_OPTIONS = [
  { value: "", label: "Default (agent-defined)", provider: "agent" as const },
  { value: "zai/glm-5-turbo", label: "GLM 5 Turbo", provider: "glm" as const },
  { value: "zai/glm-4.7", label: "GLM 4.7", provider: "glm" as const },
  { value: "zai/glm-4.5-air", label: "GLM 4.5 Air", provider: "glm" as const },
  { value: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro", provider: "deepseek" as const },
  { value: "deepseek/deepseek-v4-flash", label: "DeepSeek V4 Flash", provider: "deepseek" as const },
];

export function Settings() {
  const theme = useTheme();
  const { t } = useI18n();
  const [model, setModel] = useState<string>(loadGlobalModel);
  const [saved, setSaved] = useState(false);

  const handleChange = (value: string) => {
    setModel(value);
    saveGlobalModel(value);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selected = PROVIDER_OPTIONS.find((o) => o.value === model);
  const provider = selected?.provider ?? "agent";

  return (
    <div>
      <PageHeader title={t.settings.title} description={t.settings.description} />

      <Card variant="surface" padding="lg" style={{ marginTop: theme.spacing.xl, maxWidth: 560 }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
          {t.settings.defaultModel}
        </h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
          {t.settings.defaultModelDesc}
        </p>

        <select
          value={model}
          onChange={(e) => handleChange(e.target.value)}
          style={{
            width: "100%",
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            fontSize: theme.font.sizes.base,
            borderRadius: theme.radii.lg,
            border: `1px solid ${theme.colors.border.medium}`,
            background: theme.colors.bg.page,
          }}
        >
          {PROVIDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {saved && (
          <span style={{ fontSize: 12, color: theme.colors.success, marginLeft: theme.spacing.sm }}>
            {t.settings.saved}
          </span>
        )}
      </Card>

      <Card variant="surface" padding="lg" style={{ marginTop: theme.spacing.xl, maxWidth: 560 }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
          {t.settings.apiStatus}
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.base }}>
          <tbody>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
              <td style={{ padding: "8px 0", fontWeight: 500 }}>{t.settings.currentProvider}</td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>
                <span style={{
                  padding: "2px 10px",
                  borderRadius: theme.radii.sm,
                  fontSize: 12,
                  fontWeight: 600,
                  background: provider === "agent" ? theme.colors.border.light
                    : provider === "glm" ? "#eff6ff" : "#f0fdf4",
                  color: provider === "agent" ? theme.colors.text.muted
                    : provider === "glm" ? "#1e40af" : "#166534",
                }}>
                  {provider === "agent" ? "Agent Default" : provider.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
              <td style={{ padding: "8px 0", fontWeight: 500 }}>{t.settings.selectedModel}</td>
              <td style={{ padding: "8px 0", textAlign: "right", color: theme.colors.text.secondary }}>
                {selected?.label ?? "—"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", fontWeight: 500 }}>{t.settings.apiKeys}</td>
              <td style={{ padding: "8px 0", textAlign: "right" }}>
                <span style={{ fontSize: 12, color: theme.colors.text.muted }}>
                  {t.settings.configuredInEnv}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{
          marginTop: theme.spacing.md,
          padding: theme.spacing.md,
          borderRadius: theme.radii.lg,
          background: theme.colors.border.light,
          fontSize: 12,
          color: theme.colors.text.secondary,
          lineHeight: 1.6,
        }}>
          <strong>{t.settings.envVars}:</strong>
          <code style={{ display: "block", marginTop: 4, fontSize: 11 }}>
            Z_AI_API_KEY (GLM) | DEEPSEEK_API_KEY (DeepSeek)
          </code>
        </div>
      </Card>
    </div>
  );
}
