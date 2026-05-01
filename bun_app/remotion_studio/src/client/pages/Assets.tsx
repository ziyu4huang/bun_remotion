import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, SkeletonCard, Button, InputField } from "../components";
import type { AssetSummary, SeriesAssets, Asset } from "../../shared/types";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";

type Tab = "characters" | "backgrounds" | "audio";

export function Assets() {
  const theme = useTheme();
  const { t } = useI18n();
  const [summaries, setSummaries] = useState<AssetSummary[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [assets, setAssets] = useState<SeriesAssets | null>(null);
  const [tab, setTab] = useState<Tab>("characters");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");

  const loadSummaries = useCallback(async () => {
    const res = await api.listAssets();
    if (res.data) setSummaries(res.data);
    setLoading(false);
  }, []);

  const loadAssets = useCallback(async (seriesId: string) => {
    if (!seriesId) return;
    const res = await api.getAssets(seriesId);
    if (res.data) setAssets(res.data);
  }, []);

  useEffect(() => { loadSummaries(); }, [loadSummaries]);

  useEffect(() => {
    if (selected) loadAssets(selected);
    else setAssets(null);
  }, [selected, loadAssets]);

  // All hooks must be called before any conditional return
  const currentList: Asset[] = assets
    ? tab === "characters" ? assets.characters
      : tab === "backgrounds" ? assets.backgrounds
      : assets.audio
    : [];

  const filtered = useMemo(() => {
    if (!search.trim()) return currentList;
    const q = search.toLowerCase();
    return currentList.filter((a) => a.name.toLowerCase().includes(q));
  }, [currentList, search]);

  // Group audio by episode
  const audioByEpisode = useMemo(() => {
    const map = new Map<string, Asset[]>();
    for (const a of filtered) {
      const key = a.episodeId ?? "unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return map;
  }, [filtered]);

  const tabs: { id: Tab; label: string; count: number }[] = assets ? [
    { id: "characters", label: t.assets.characters, count: assets.characters.length },
    { id: "backgrounds", label: t.assets.backgrounds, count: assets.backgrounds.length },
    { id: "audio", label: t.assets.audio, count: assets.audio.length },
  ] : [];

  if (loading) return (
    <div>
      <PageHeader title={t.assets.title} description={t.assets.description} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: theme.spacing.md }}>
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} rows={0} showHeader={false} imageHeight={120} />
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader title={t.assets.title} description={t.assets.description} />

      <div style={{ marginBottom: theme.spacing.lg, display: "flex", gap: theme.spacing.sm, alignItems: "center" }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ padding: "6px 12px", borderRadius: theme.radii.lg, fontSize: theme.font.sizes.md }}
        >
          <option value="">{t.assets.selectSeries}</option>
          {summaries.map((s) => (
            <option key={s.seriesId} value={s.seriesId}>
              {s.seriesName} ({s.characters} chars, {s.backgrounds} bgs, {s.audio} audio)
            </option>
          ))}
        </select>
        {assets && (
          <InputField
            placeholder={t.assets.searchPlaceholder(tab)}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
        )}
      </div>

      {assets && (
        <>
          <div style={{ display: "flex", gap: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
            {tabs.map((t) => (
              <Button
                key={t.id}
                variant="outline"
                size="sm"
                onClick={() => { setTab(t.id); setSearch(""); }}
                style={tab === t.id ? { background: theme.colors.primaryLight } : undefined}
              >
                {t.label} ({t.count})
              </Button>
            ))}
            {search.trim() && (
              <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, alignSelf: "center", marginLeft: 8 }}>
                {t.assets.matchCount(filtered.length, currentList.length)}
              </span>
            )}
          </div>

          {tab !== "audio" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: theme.spacing.md }}>
              {filtered.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setPreview(asset)}
                  style={{
                    border: `1px solid ${theme.colors.border.light}`,
                    borderRadius: theme.radii.xl,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: theme.colors.bg.surface,
                  }}
                >
                  <img
                    src={api.assetFileUrl(asset.seriesId + "/" + (asset.episodeId ? asset.episodeId + "/" : "") + asset.id.split("/").pop())}
                    alt={asset.name}
                    style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                  <div style={{ padding: `${theme.spacing.xs}px ${theme.spacing.sm}px`, fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <HighlightText text={asset.name} query={search} theme={theme} />
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ color: theme.colors.text.muted }}>
                  {currentList.length === 0 ? t.assets.noTabFound(tab) : t.assets.noTabSearchMatch(tab, search)}
                </div>
              )}
            </div>
          ) : (
            <div>
              {[...audioByEpisode.entries()].map(([epId, files]) => (
                <div key={epId} style={{ marginBottom: theme.spacing.lg }}>
                  <h4 style={{ margin: `0 0 ${theme.spacing.sm}px`, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>{epId}</h4>
                  {files.map((asset) => (
                    <div key={asset.id} style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: theme.colors.text.faint, minWidth: 120 }}>
                        <HighlightText text={asset.name} query={search} theme={theme} />
                      </span>
                      <audio
                        controls
                        src={api.assetFileUrl(asset.seriesId + "/" + asset.id)}
                        style={{ height: 32 }}
                      />
                      <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.faint }}>{formatSize(asset.size)}</span>
                    </div>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ color: theme.colors.text.muted }}>
                  {currentList.length === 0 ? t.assets.noTabFound("audio") : t.assets.noTabSearchMatch("audio", search)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!selected && summaries.length === 0 && (
        <EmptyState icon="🖼" title={t.assets.noAssetsFound} description={t.assets.noSeriesWithAssets} />
      )}

      {!selected && summaries.length > 0 && (
        <EmptyState icon="🖼" title={t.assets.selectSeriesPrompt} description={t.assets.selectSeriesDesc} />
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed", inset: 0, background: theme.colors.bg.overlay,
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: theme.colors.bg.page, borderRadius: theme.radii.xxl, padding: theme.spacing.lg, maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={api.assetFileUrl(preview.seriesId + "/" + (preview.episodeId ? preview.episodeId + "/" : "") + preview.id.split("/").pop())}
              alt={preview.name}
              style={{ maxWidth: "80vw", maxHeight: "75vh", display: "block", borderRadius: theme.radii.xl }}
            />
            <div style={{ marginTop: theme.spacing.sm, fontSize: theme.font.sizes.base, color: theme.colors.text.secondary }}>
              {preview.name} ({preview.format}, {formatSize(preview.size)})
            </div>
            <Button onClick={() => setPreview(null)} variant="outline" size="sm" style={{ marginTop: theme.spacing.sm }}>{t.assets.close}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function HighlightText({ text, query, theme }: { text: string; query: string; theme: Theme }) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: theme.colors.warningLight, padding: "0 1px", borderRadius: 2 }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
