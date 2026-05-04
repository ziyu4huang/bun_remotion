import { useState } from "react";
import { Button } from ".";
import { api } from "../api";
import { loadApiKey, saveApiKey, type ApiProvider } from "../pages/Settings";
import { useTheme } from "../theme";

interface SettingsApiKeysProps {
  t: {
    apiKey: string;
    apiKeyDesc: string;
    apiKeyHidden: (len: number) => string;
    apiKeySet: string;
    apiKeyClear: string;
    apiKeySave: string;
    apiKeyPlaceholder: string;
    apiKeyNotSet: string;
    saveToServer: string;
    serverKeySet: string;
    saved: string;
    common: { cancel: string };
  };
}

const PROVIDER_SLOTS: Array<{ id: ApiProvider; label: string; envVar: string; color: string }> = [
  { id: "glm", label: "GLM", envVar: "Z_AI_API_KEY", color: "#1e40af" },
  { id: "deepseek", label: "DeepSeek", envVar: "DEEPSEEK_API_KEY", color: "#166534" },
  { id: "google", label: "Google", envVar: "GOOGLE_API_KEY", color: "#9a3412" },
];

export function SettingsApiKeys({ t }: SettingsApiKeysProps) {
  const theme = useTheme();
  const [editingProvider, setEditingProvider] = useState<ApiProvider | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [savedProvider, setSavedProvider] = useState<ApiProvider | null>(null);
  const [serverSaved, setServerSaved] = useState<ApiProvider | null>(null);

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

  return (
    <>
      {PROVIDER_SLOTS.map((slot) => {
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
                  {t.apiKeyHidden(currentKey.length)}
                </span>
                <span style={{ fontSize: 12, color: theme.colors.success }}>{t.apiKeySet}</span>
                <Button variant="ghost" size="sm" onClick={() => handleClearKey(slot.id)}>{t.apiKeyClear}</Button>
                <Button variant="outline" size="sm" onClick={() => handleSaveToServer(slot.id)}>{t.saveToServer}</Button>
                <Button variant="outline" size="sm" onClick={() => { setEditingProvider(slot.id); setKeyInput(""); }}>
                  {t.apiKeySave}
                </Button>
              </div>
            ) : isEditing ? (
              <div style={{ display: "flex", gap: theme.spacing.sm }}>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={t.apiKeyPlaceholder}
                  style={{
                    flex: 1, padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
                    fontSize: theme.font.sizes.base, borderRadius: theme.radii.lg,
                    border: `1px solid ${theme.colors.border.medium}`,
                    background: theme.colors.bg.page, color: theme.colors.text.primary, outline: "none",
                  }}
                />
                <Button variant="primary" onClick={() => handleSaveKey(slot.id)} disabled={!keyInput.trim()}>
                  {t.apiKeySave}
                </Button>
                <Button variant="ghost" onClick={() => setEditingProvider(null)}>{t.common.cancel}</Button>
              </div>
            ) : (
              <div>
                <Button variant="outline" size="sm" onClick={() => { setEditingProvider(slot.id); setKeyInput(""); }}>
                  {t.apiKeySave}
                </Button>
                <span style={{ marginLeft: theme.spacing.sm, fontSize: 12, color: theme.colors.text.muted }}>
                  {t.apiKeyNotSet}
                </span>
              </div>
            )}

            {justSaved && (
              <span style={{ fontSize: 12, color: theme.colors.success, marginTop: theme.spacing.xs, display: "inline-block" }}>
                {t.saved}
              </span>
            )}
            {serverSaved === slot.id && (
              <span style={{ fontSize: 12, color: theme.colors.success, marginTop: theme.spacing.xs, display: "inline-block", marginLeft: theme.spacing.sm }}>
                {t.serverKeySet}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
