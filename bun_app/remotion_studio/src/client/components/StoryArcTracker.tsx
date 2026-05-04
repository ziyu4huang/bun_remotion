import { useState, useEffect } from "react";
import { Card, StatusBadge, Button } from ".";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";
import { api } from "../api";
import type { EpisodeProgress } from "../../shared/types";

interface StoryArcEpisode {
  id: string;
  title: string;
  description: string;
}

interface StoryArcDef {
  chapter: number;
  title: string;
  theme: string;
  episodes: StoryArcEpisode[];
}

interface StoryArcTrackerProps {
  storyArcs: StoryArcDef[];
  seriesId: string;
  onSwitchToEdit: () => void;
}

export function matchEpisodeProgress(
  arcEpId: string,
  entries: EpisodeProgress[],
  seriesId: string,
): EpisodeProgress | undefined {
  const m = arcEpId.match(/^ch(\d+)ep(\d+)$/);
  if (!m) return undefined;
  const ch = parseInt(m[1], 10);
  const ep = parseInt(m[2], 10);
  return entries.find((p) => p.seriesId === seriesId && p.chapter === ch && p.episode === ep);
}

export function computeOverallStatus(progress: EpisodeProgress | undefined): string {
  if (!progress || progress.totalSteps === 0) return "pending";
  if (progress.completedSteps >= progress.totalSteps) return "completed";
  if (progress.completedSteps > 0) return "running";
  return "pending";
}

export function StoryArcTracker({ storyArcs, seriesId, onSwitchToEdit }: StoryArcTrackerProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const [progressMap, setProgressMap] = useState<Map<string, EpisodeProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getEpisodeProgress().then((res) => {
      if (cancelled || !res.ok || !res.data) return;
      const map = new Map<string, EpisodeProgress>();
      for (const ep of res.data.episodes) {
        if (ep.seriesId === seriesId && ep.chapter != null && ep.episode != null) {
          map.set(`ch${ep.chapter}ep${ep.episode}`, ep);
        }
      }
      setProgressMap(map);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [seriesId]);

  if (storyArcs.length === 0) {
    return (
      <Card variant="surface" style={{ textAlign: "center", padding: theme.spacing.xxxl }}>
        <div style={{ fontSize: theme.font.sizes.lg, color: theme.colors.text.secondary, marginBottom: theme.spacing.md }}>
          {t.storyEditor.arcNoArcs}
        </div>
        <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.muted, marginBottom: theme.spacing.lg }}>
          {t.storyEditor.arcNoArcsDesc}
        </div>
        <Button variant="primary" onClick={onSwitchToEdit}>{t.storyEditor.arcGoToEdit}</Button>
      </Card>
    );
  }

  return (
    <div style={{ position: "relative", padding: `${theme.spacing.lg}px 0` }}>
      {loading && (
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginBottom: theme.spacing.md }}>
          {t.storyEditor.arcLoading}
        </div>
      )}
      {storyArcs.map((arc, i) => (
        <div key={arc.chapter} style={{ marginBottom: i < storyArcs.length - 1 ? 0 : 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: theme.spacing.lg }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 40 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: theme.colors.primary, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: theme.font.sizes.base, fontWeight: theme.font.weights.semibold,
                flexShrink: 0,
              }}>
                {arc.chapter}
              </div>
              {i < storyArcs.length - 1 && (
                <div style={{
                  width: 2, flexGrow: 1, minHeight: 24,
                  background: theme.colors.border.default, marginTop: 4,
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: i < storyArcs.length - 1 ? theme.spacing.xl : 0 }}>
              <div style={{ marginBottom: theme.spacing.xs }}>
                <strong style={{ fontSize: theme.font.sizes.lg, color: theme.colors.text.primary }}>
                  {t.storyEditor.arcChapter} {arc.chapter}：{arc.title}
                </strong>
              </div>
              {arc.theme && (
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, marginBottom: theme.spacing.md }}>
                  {t.storyEditor.arcTheme}：{arc.theme}
                </div>
              )}
              {arc.episodes.length === 0 ? (
                <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, fontStyle: "italic" }}>
                  {t.storyEditor.arcNoEpisodes}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.sm }}>
                  {arc.episodes.map((ep) => {
                    const progress = progressMap.get(ep.id);
                    const status = computeOverallStatus(progress);
                    return (
                      <Card key={ep.id} variant="outline" style={{ padding: `${theme.spacing.sm}px ${theme.spacing.md}px` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                            background: status === "completed" ? theme.colors.success
                              : status === "running" ? theme.colors.warning
                              : theme.colors.text.muted,
                          }} />
                          <span style={{ fontWeight: theme.font.weights.medium, fontSize: theme.font.sizes.base }}>
                            {ep.title}
                          </span>
                          {progress && (
                            <StatusBadge status={status}>
                              {progress.completedSteps}/{progress.totalSteps}
                            </StatusBadge>
                          )}
                        </div>
                        {ep.description && (
                          <div style={{
                            fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary,
                            marginTop: theme.spacing.xs, marginLeft: 20,
                            overflow: "hidden", display: "-webkit-box",
                            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          }}>
                            {ep.description}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
