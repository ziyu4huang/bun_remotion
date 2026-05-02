import { useState } from "react";
import { useTheme } from "../theme";
import { useI18n, type Locale } from "../i18n";
import { PageHeader, Card, Button } from "../components";
import { api } from "../api";

const GLOBAL_MODEL_KEY = "remotion_studio_global_model";
const OLD_API_KEY_STORAGE = "remotion_studio_api_key";

export type ApiProvider = "glm" | "deepseek" | "google";

const PROVIDER_STORAGE_KEYS: Record<ApiProvider, string> = {
  glm: "remotion_studio_key_glm",
  deepseek: "remotion_studio_key_deepseek",
  google: "remotion_studio_key_google",
};

const PROVIDER_ENV_VARS: Record<ApiProvider, string> = {
  glm: "Z_AI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  google: "GOOGLE_API_KEY",
};

export function providerFromModel(model: string): ApiProvider | null {
  if (model.startsWith("zai/")) return "glm";
  if (model.startsWith("deepseek/")) return "deepseek";
  if (model.startsWith("google/")) return "google";
  return null;
}

export function loadGlobalModel(): string {
  try { return localStorage.getItem(GLOBAL_MODEL_KEY) || ""; } catch { return ""; }
}

export function saveGlobalModel(model: string) {
  try { localStorage.setItem(GLOBAL_MODEL_KEY, model); } catch { /* noop */ }
}

function migrateOldKey() {
  try {
    const old = localStorage.getItem(OLD_API_KEY_STORAGE);
    if (old && !localStorage.getItem(PROVIDER_STORAGE_KEYS.glm)) {
      localStorage.setItem(PROVIDER_STORAGE_KEYS.glm, old);
    }
    localStorage.removeItem(OLD_API_KEY_STORAGE);
  } catch { /* noop */ }
}

export function loadApiKey(provider?: ApiProvider): string {
  migrateOldKey();
  if (!provider) {
    const model = loadGlobalModel();
    provider = providerFromModel(model) || "glm";
  }
  try { return localStorage.getItem(PROVIDER_STORAGE_KEYS[provider]) || ""; } catch { return ""; }
}

export function saveApiKey(key: string, provider: ApiProvider = "glm") {
  try {
    if (key) localStorage.setItem(PROVIDER_STORAGE_KEYS[provider], key);
    else localStorage.removeItem(PROVIDER_STORAGE_KEYS[provider]);
  } catch { /* noop */ }
}

export function getProviderEnvVar(provider: ApiProvider): string {
  return PROVIDER_ENV_VARS[provider];
}

/** Load API key + correct env var name for the currently selected model's provider. */
export function loadApiKeyWithEnvKey(): { apiKey: string; envKey: string } {
  const model = loadGlobalModel();
  const provider = providerFromModel(model) || "glm";
  return { apiKey: loadApiKey(provider), envKey: getProviderEnvVar(provider) };
}

const PROVIDER_OPTIONS = [
  { value: "", provider: "agent" as const },
  { value: "zai/glm-5-turbo", provider: "glm" as const },
  { value: "zai/glm-4.7", provider: "glm" as const },
  { value: "zai/glm-4.5-air", provider: "glm" as const },
  { value: "deepseek/deepseek-v4-pro", provider: "deepseek" as const },
  { value: "deepseek/deepseek-v4-flash", provider: "deepseek" as const },
];

const selectStyle = (theme: ReturnType<typeof useTheme>) => ({
  width: "100%",
  padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
  fontSize: theme.font.sizes.base,
  borderRadius: theme.radii.lg,
  border: `1px solid ${theme.colors.border.medium}`,
  background: theme.colors.bg.page,
  color: theme.colors.text.primary,
});

export function Settings() {
  const theme = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [model, setModel] = useState<string>(loadGlobalModel);
  const [modelSaved, setModelSaved] = useState(false);

  // Per-provider key editing state
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [savedProvider, setSavedProvider] = useState<ApiProvider | null>(null);
  const [serverSaved, setServerSaved] = useState<ApiProvider | null>(null);

  const handleModelChange = (value: string) => {
    setModel(value);
    saveGlobalModel(value);
    setModelSaved(true);
    setTimeout(() => setModelSaved(false), 2000);
  };

  const handleSaveKey = (provider: ApiProvider) => {
    saveApiKey(keyInput, provider);
    setKeyInput("");
    setEditingProvider(null);
    setSavedProvider(provider);
    setTimeout(() => setSavedProvider(null), 2000);
  };

  const handleClearKey = (provider: ApiProvider) => {
    saveApiKey("", provider);
    setSavedProvider(provider);
    setTimeout(() => setSavedProvider(null), 2000);
  };

  const handleSaveToServer = async (provider: ApiProvider) => {
    const key = loadApiKey(provider);
    if (!key) return;
    try {
      await api.saveApiKeysToServer({ [provider]: key });
      setServerSaved(provider);
      setTimeout(() => setServerSaved(null), 2000);
    } catch { /* server unreachable */ }
  };

  const selected = PROVIDER_OPTIONS.find((o) => o.value === model);
  const provider = selected?.provider ?? "agent";

  const cardGap = { marginTop: theme.spacing.xl, maxWidth: 560 };

  const providerSlots: Array<{ id: ApiProvider; label: string; envVar: string; color: string }> = [
    { id: "glm", label: "GLM", envVar: "Z_AI_API_KEY", color: "#1e40af" },
    { id: "deepseek", label: "DeepSeek", envVar: "DEEPSEEK_API_KEY", color: "#166534" },
    { id: "google", label: "Google", envVar: "GOOGLE_API_KEY", color: "#9a3412" },
  ];

  return (
    <div>
      <PageHeader title={t.settings.title} description={t.settings.description} />

      {/* Language */}
      <Card variant="surface" padding="lg" style={{ ...cardGap, marginTop: theme.spacing.xl }}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
          {t.settings.language}
        </h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
          {t.settings.languageDesc}
        </p>
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          style={selectStyle(theme)}
        >
          <option value="zh_TW">{t.settings.languageZhTW}</option>
          <option value="en">{t.settings.languageEn}</option>
        </select>
      </Card>

      {/* Default Model */}
      <Card variant="surface" padding="lg" style={cardGap}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
          {t.settings.defaultModel}
        </h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
          {t.settings.defaultModelDesc}
        </p>
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          style={selectStyle(theme)}
        >
          <option value="">{t.settings.providerDefault}</option>
          <option value="zai/glm-5-turbo">GLM 5 Turbo</option>
          <option value="zai/glm-4.7">GLM 4.7</option>
          <option value="zai/glm-4.5-air">GLM 4.5 Air</option>
          <option value="deepseek/deepseek-v4-pro">DeepSeek V4 Pro</option>
          <option value="deepseek/deepseek-v4-flash">DeepSeek V4 Flash</option>
        </select>
        {modelSaved && (
          <span style={{ fontSize: 12, color: theme.colors.success, marginLeft: theme.spacing.sm }}>
            {t.settings.saved}
          </span>
        )}
      </Card>

      {/* API Keys — per-provider */}
      <Card variant="surface" padding="lg" style={cardGap}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
          {t.settings.apiKey}
        </h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
          {t.settings.apiKeyDesc}
        </p>

        {providerSlots.map((slot) => {
          const currentKey = loadApiKey(slot.id);
          const isEditing = editingProvider === slot.id;
          const justSaved = savedProvider === slot.id;

          return (
            <div key={slot.id} style={{ marginTop: theme.spacing.md }}>
              <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                <span style={{ padding: "2px 8px", borderRadius: theme.radii.sm, fontSize: 12, fontWeight: 600, background: `${slot.color}15`, color: slot.color }}>
                  {slot.label}
                </span>
                <code style={{ fontSize: 11, color: theme.colors.text.muted }}>{slot.envVar}</code>
              </div>

              {currentKey && !isEditing ? (
                <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                  <span style={{
                    flex: 1, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border.medium}`,
                    background: theme.colors.bg.page, fontSize: theme.font.sizes.base,
                    fontFamily: "monospace", color: theme.colors.text.secondary,
                  }}>
                    {t.settings.apiKeyHidden(currentKey.length)}
                  </span>
                  <span style={{ fontSize: 12, color: theme.colors.success }}>{t.settings.apiKeySet}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleClearKey(slot.id)}>{t.settings.apiKeyClear}</Button>
                  <Button variant="outline" size="sm" onClick={() => handleSaveToServer(slot.id)}>{t.settings.saveToServer}</Button>
                  <Button variant="outline" size="sm" onClick={() => { setEditingProvider(slot.id); setKeyInput(""); }}>
                    {t.settings.apiKeySave}
                  </Button>
                </div>
              ) : isEditing ? (
                <div style={{ display: "flex", gap: theme.spacing.sm }}>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={t.settings.apiKeyPlaceholder}
                    style={{
                      flex: 1, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                      fontSize: theme.font.sizes.base, borderRadius: theme.radii.lg,
                      border: `1px solid ${theme.colors.border.medium}`,
                      background: theme.colors.bg.page, color: theme.colors.text.primary, outline: "none",
                    }}
                  />
                  <Button variant="primary" onClick={() => handleSaveKey(slot.id)} disabled={!keyInput.trim()}>
                    {t.settings.apiKeySave}
                  </Button>
                  <Button variant="ghost" onClick={() => setEditingProvider(null)}>{t.common.cancel}</Button>
                </div>
              ) : (
                <div>
                  <Button variant="outline" size="sm" onClick={() => { setEditingProvider(slot.id); setKeyInput(""); }}>
                    {t.settings.apiKeySave}
                  </Button>
                  <span style={{ marginLeft: theme.spacing.sm, fontSize: 12, color: theme.colors.text.muted }}>
                    {t.settings.apiKeyNotSet}
                  </span>
                </div>
              )}

              {justSaved && (
                <span style={{ fontSize: 12, color: theme.colors.success, marginTop: theme.spacing.xs, display: "inline-block" }}>
                  {t.settings.saved}
                </span>
              )}
              {serverSaved === slot.id && (
                <span style={{ fontSize: 12, color: theme.colors.success, marginTop: theme.spacing.xs, display: "inline-block", marginLeft: theme.spacing.sm }}>
                  {t.settings.serverKeySet}
                </span>
              )}
            </div>
          );
        })}
      </Card>

      {/* API Status */}
      <Card variant="surface" padding="lg" style={cardGap}>
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
                  {provider === "agent" ? t.settings.agentDefault : provider.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
              <td style={{ padding: "8px 0", fontWeight: 500 }}>{t.settings.selectedModel}</td>
              <td style={{ padding: "8px 0", textAlign: "right", color: theme.colors.text.secondary }}>
                {!model ? t.settings.providerDefault : selected?.value?.split("/").pop() ?? "—"}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Onboarding Tour */}
      <Card variant="surface" padding="lg" style={cardGap}>
        <h3 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold }}>
          {t.settings.onboardingTour}
        </h3>
        <p style={{ margin: `0 0 ${theme.spacing.md}px`, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
          {t.settings.onboardingTourDesc}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            try { localStorage.removeItem("remotion_studio_tour_seen"); } catch { /* ignore */ }
            window.location.reload();
          }}
        >
          {t.settings.replayTour}
        </Button>
      </Card>
    </div>
  );
}
