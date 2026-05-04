import { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import type { Project } from "../../shared/types";
import { PageHeader, LoadingSpinner, EmptyState, Card, StatusBadge } from "../components";
import { useTheme, type Theme } from "../theme";
import { useI18n } from "../i18n";

export function SeriesOverview() {
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    api.listProjects().then((r) => {
      if (r.ok && r.data) setProjects(r.data);
      else setError("Failed to load projects");
      setLoading(false);
    });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category));
    return ["all", ...Array.from(cats).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (categoryFilter !== "all") {
      list = list.filter((p) => p.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.seriesId.toLowerCase().includes(q));
    }
    return list;
  }, [projects, categoryFilter, search]);

  if (loading) return <div><PageHeader title={t.seriesOverview.title} description={t.seriesOverview.description} /><LoadingSpinner /></div>;
  if (error) return <EmptyState icon="\u{26A0}" title={error} description="Could not retrieve series data from the server." />;

  const totalEpisodes = filtered.reduce((sum, p) => sum + p.episodeCount, 0);
  const totalScaffolded = filtered.reduce((sum, p) => sum + p.scaffoldedCount, 0);
  const overallRate = totalEpisodes > 0 ? Math.round((totalScaffolded / totalEpisodes) * 100) : 0;

  return (
    <div>
      <PageHeader title={t.seriesOverview.title} description={t.seriesOverview.description} />

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: theme.spacing.lg, marginBottom: theme.spacing.xl, flexWrap: "wrap" }}>
        <SummaryCard label={t.seriesOverview.totalSeries} value={filtered.length} theme={theme} />
        <SummaryCard label={t.seriesOverview.totalEpisodes} value={totalEpisodes} theme={theme} />
        <SummaryCard label={t.seriesOverview.scaffoldRate} value={`${overallRate}%`} theme={theme} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: theme.spacing.md, marginBottom: theme.spacing.xl, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.seriesOverview.searchPlaceholder}
          style={{
            padding: `${theme.spacing.sm}px ${theme.spacing.md}px`,
            fontSize: theme.font.sizes.md, borderRadius: theme.radii.lg,
            border: `1px solid ${theme.colors.border.medium}`, outline: "none",
            minWidth: 200,
          }}
        />
        <div style={{ display: "flex", gap: theme.spacing.xs, flexWrap: "wrap" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
                borderRadius: theme.radii.md, border: `1px solid ${categoryFilter === cat ? theme.colors.primary : theme.colors.border.medium}`,
                background: categoryFilter === cat ? theme.colors.primaryLight : "transparent",
                color: categoryFilter === cat ? theme.colors.primaryDark : theme.colors.text.secondary,
                fontSize: theme.font.sizes.sm, cursor: "pointer",
              }}
            >
              {cat === "all" ? t.seriesOverview.allCategories : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Series Cards */}
      {filtered.length === 0 ? (
        <EmptyState icon="\u{1F4C1}" title={t.seriesOverview.noSeries} description={t.seriesOverview.noSeriesDesc} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: theme.spacing.lg }}>
          {filtered.map((project) => (
            <SeriesCard key={project.id} project={project} theme={theme} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, theme }: { label: string; value: string | number; theme: Theme }) {
  return (
    <Card variant="default" padding="md" style={{ minWidth: 100 }}>
      <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary, marginBottom: theme.spacing.xs }}>{label}</div>
      <div style={{ fontSize: theme.font.sizes.xl, fontWeight: theme.font.weights.semibold }}>{value}</div>
    </Card>
  );
}

function SeriesCard({ project, theme, t }: { project: Project; theme: Theme; t: ReturnType<typeof useI18n>["t"] }) {
  const rate = project.episodeCount > 0 ? Math.round((project.scaffoldedCount / project.episodeCount) * 100) : 0;
  const barColor = rate >= 80 ? theme.colors.success : rate >= 40 ? theme.colors.warning : theme.colors.error;

  return (
    <Card variant="default" padding="lg">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: theme.spacing.sm }}>
        <div>
          <div style={{ fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.semibold, marginBottom: 2 }}>{project.name}</div>
          <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>{project.seriesId}</div>
        </div>
        <StatusBadge status={project.category} />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: theme.spacing.md }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 4 }}>
          <span>{t.seriesOverview.scaffolded(project.scaffoldedCount, project.episodeCount)}</span>
          <span>{rate}%</span>
        </div>
        <div style={{ width: "100%", height: 6, background: theme.colors.border.default, borderRadius: theme.radii.sm, overflow: "hidden" }}>
          <div style={{ width: `${rate}%`, height: "100%", background: barColor, borderRadius: theme.radii.sm, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Scores */}
      <div style={{ display: "flex", gap: theme.spacing.lg, fontSize: theme.font.sizes.sm }}>
        {project.gateScore != null && (
          <div>
            <span style={{ color: theme.colors.text.muted }}>{t.seriesOverview.gateScore}: </span>
            <span style={{ fontWeight: theme.font.weights.medium }}>{project.gateScore}/100</span>
          </div>
        )}
        {project.blendedScore != null && (
          <div>
            <span style={{ color: theme.colors.text.muted }}>{t.seriesOverview.blendedScore}: </span>
            <span style={{ fontWeight: theme.font.weights.medium }}>{project.blendedScore}%</span>
          </div>
        )}
        {project.hasPlan && (
          <div>
            <span style={{ color: theme.colors.success }}>{t.seriesOverview.hasPlan}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
