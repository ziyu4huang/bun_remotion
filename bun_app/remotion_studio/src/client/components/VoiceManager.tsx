import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { Button, Card } from "../components";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { toast } from "../components/ToastContainer";
import type { VoiceInfo, CharacterProfile, Project } from "../../shared/types";

export function VoiceManager({ projects }: { projects: Project[] }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("");
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [editedVoices, setEditedVoices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    api.getVoices().then((res) => {
      if (res.data) setVoices(res.data);
    });
  }, []);

  const loadCharacters = useCallback(async (seriesId: string) => {
    if (!seriesId) { setCharacters([]); setEditedVoices({}); return; }
    setLoading(true);
    const res = await api.getVoiceCharacters(seriesId);
    if (res.data) {
      setCharacters(res.data);
      const map: Record<string, string> = {};
      for (const c of res.data) map[c.id] = c.voice;
      setEditedVoices(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadCharacters(selectedSeries); }, [selectedSeries, loadCharacters]);

  const handleSave = async (characterId: string) => {
    const voice = editedVoices[characterId];
    if (!voice || !selectedSeries) return;
    setSaving(characterId);
    const res = await api.updateCharacterVoice(selectedSeries, characterId, voice);
    if (res.ok) {
      const char = characters.find((c) => c.id === characterId);
      toast("success", t.tts.voiceSaved(char?.name ?? characterId));
      await loadCharacters(selectedSeries);
    } else {
      toast("error", t.tts.voiceSaveFailed);
    }
    setSaving(null);
  };

  const handlePreview = async (voiceId: string, engine: "mlx" | "gemini") => {
    if (previewRef.current) { previewRef.current.pause(); previewRef.current = null; }
    setPreviewUrl(null);
    setPreviewing(voiceId);
    const res = await api.previewVoice(voiceId, engine);
    if (res.data) {
      setPreviewUrl(res.data.url);
    } else {
      toast("error", t.tts.previewFailed);
    }
    setPreviewing(null);
  };

  const seriesOptions = projects.filter((p) => p.episodes.length > 0);

  return (
    <Card variant="outline" padding="none" style={{ marginTop: theme.spacing.xl, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", background: theme.colors.bg.muted,
        fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.sm,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{t.tts.voiceManager}</span>
        <select
          value={selectedSeries}
          onChange={(e) => setSelectedSeries(e.target.value)}
          style={{ padding: "4px 8px", borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm }}
        >
          <option value="">{t.tts.selectSeriesVoice}</option>
          {seriesOptions.map((p) => (
            <option key={p.seriesId} value={p.seriesId}>{p.name}</option>
          ))}
        </select>
      </div>

      {!selectedSeries && (
        <div style={{ padding: 14, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.sm }}>
          {t.tts.voiceManagerDesc}
        </div>
      )}

      {loading && <div style={{ padding: 14, color: theme.colors.text.tertiary }}>{t.tts.previewLoading}</div>}

      {selectedSeries && !loading && characters.length === 0 && (
        <div style={{ padding: 14, color: theme.colors.text.tertiary, fontSize: theme.font.sizes.sm }}>
          {t.tts.noCharacters}
        </div>
      )}

      {characters.map((char) => {
        const currentVoice = editedVoices[char.id] ?? char.voice;
        const voiceInfo = voices.find((v) => v.id === currentVoice);
        const isDirty = currentVoice !== char.voice;

        return (
          <div key={char.id} style={{
            padding: "10px 14px", borderTop: `1px solid ${theme.colors.border.default}`,
            display: "flex", alignItems: "center", gap: theme.spacing.md,
          }}>
            {/* Character info */}
            <div style={{ minWidth: 80 }}>
              <div style={{ fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.medium }}>
                {char.name}
              </div>
              <div style={{ fontSize: 11, color: theme.colors.text.tertiary }}>{char.id}</div>
            </div>

            {/* Voice selector */}
            <select
              value={currentVoice}
              onChange={(e) => setEditedVoices((prev) => ({ ...prev, [char.id]: e.target.value }))}
              style={{
                padding: "4px 8px", borderRadius: theme.radii.md, fontSize: theme.font.sizes.sm,
                minWidth: 180,
              }}
            >
              <option value="">—</option>
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.engine}, {v.gender === "male" ? t.tts.male : t.tts.female})
                </option>
              ))}
            </select>

            {/* Voice info */}
            {voiceInfo && (
              <div style={{ fontSize: 11, color: theme.colors.text.tertiary, minWidth: 100 }}>
                {voiceInfo.engine === "mlx" ? t.tts.mlx : t.tts.gemini}
                {voiceInfo.description ? ` — ${voiceInfo.description}` : ""}
              </div>
            )}

            {/* Preview */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handlePreview(currentVoice, voiceInfo?.engine ?? "mlx")}
              disabled={!currentVoice || previewing === currentVoice}
            >
              {previewing === currentVoice ? t.tts.previewLoading : t.tts.previewVoice}
            </Button>

            {/* Save */}
            <Button
              variant={isDirty ? "primary" : "ghost"}
              size="sm"
              onClick={() => handleSave(char.id)}
              disabled={!isDirty || saving === char.id}
            >
              {saving === char.id ? "..." : t.tts.saveVoice}
            </Button>
          </div>
        );
      })}

      {/* Audio preview player (hidden, triggered programmatically) */}
      <audio
        ref={(el) => { if (el && previewUrl) { el.src = previewUrl; el.play().catch(() => {}); } }}
        style={{ display: "none" }}
      />
    </Card>
  );
}
