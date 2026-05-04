import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { GlobalJobsPanel } from "./components/GlobalJobsPanel";
import { OnboardingTour, useOnboardingTour } from "./components/OnboardingTour";
import { AppSidebar } from "./components/AppSidebar";
import { type PaletteItem } from "./components/CommandPalette";
import { useTheme } from "./theme";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useSidebarState } from "./hooks/useSidebarState";
import { useJobStream } from "./hooks/useJobStream";
import { useI18n } from "./i18n";
import { NAV_SECTIONS, type Page } from "./lib/nav-config.js";

const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Projects = lazy(() => import("./pages/Projects").then(m => ({ default: m.Projects })));
const Storygraph = lazy(() => import("./pages/Storygraph").then(m => ({ default: m.Storygraph })));
const Quality = lazy(() => import("./pages/Quality").then(m => ({ default: m.Quality })));
const Assets = lazy(() => import("./pages/Assets").then(m => ({ default: m.Assets })));
const TTS = lazy(() => import("./pages/TTS").then(m => ({ default: m.TTS })));
const Render = lazy(() => import("./pages/Render").then(m => ({ default: m.Render })));
const Workflows = lazy(() => import("./pages/Workflows").then(m => ({ default: m.Workflows })));
const Monitoring = lazy(() => import("./pages/Monitoring").then(m => ({ default: m.Monitoring })));
const StoryEditor = lazy(() => import("./pages/StoryEditor").then(m => ({ default: m.StoryEditor })));
const ImageGen = lazy(() => import("./pages/ImageGen").then(m => ({ default: m.ImageGen })));
const Benchmark = lazy(() => import("./pages/Benchmark").then(m => ({ default: m.Benchmark })));
const AgentChat = lazy(() => import("./pages/AgentChat").then(m => ({ default: m.AgentChat })));
const PipelineProgress = lazy(() => import("./pages/PipelineProgress").then(m => ({ default: m.PipelineProgress })));
const EpisodeKanban = lazy(() => import("./pages/EpisodeKanban").then(m => ({ default: m.EpisodeKanban })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const PipelineWizard = lazy(() => import("./pages/PipelineWizard").then(m => ({ default: m.PipelineWizard })));
const SeriesOverview = lazy(() => import("./pages/SeriesOverview").then(m => ({ default: m.SeriesOverview })));
const CommandPalette = lazy(() => import("./components/CommandPalette").then(m => ({ default: m.CommandPalette })));

function PageLoadingFallback() {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 48, gap: 10, color: theme.colors.text.faint }}>
      <span style={{ display: "inline-block", width: 18, height: 18, border: `2px solid ${theme.colors.border.default}`, borderTopColor: theme.colors.primary, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      <span style={{ fontSize: 14 }}>Loading...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile - 1}px)`);
  const sidebar = useSidebarState();
  const { activeJobs, recentDone, cancelJob } = useJobStream();
  const tour = useOnboardingTour();

  const navigate = useCallback((p: Page) => {
    setPage(p);
    if (isMobile) sidebar.close();
  }, [isMobile, sidebar]);

  // Cmd+K / Ctrl+K to open command palette; Escape to close mobile sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape" && isMobile && sidebar.isOpen) {
        sidebar.close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobile, sidebar]);

  const paletteItems: PaletteItem[] = useMemo(() =>
    NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        id: item.id,
        label: t.pages[item.labelKey as keyof typeof t.pages] ?? item.labelKey,
        icon: item.icon,
        group: t.nav[section.labelKey as keyof typeof t.nav] ?? section.labelKey,
      }))
    ),
    [t]
  );

  // First-time visitor: redirect to Wizard (skip in Playwright)
  useEffect(() => {
    try {
      if (navigator.webdriver) return;
      if (!localStorage.getItem("remotion_studio_wizard_seen")) {
        setPage("wizard");
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: theme.font.family, background: theme.colors.bg.page, color: theme.colors.text.primary }}>
      <AppSidebar
        currentPage={page}
        onNavigate={navigate}
        isMobile={isMobile}
        isOpen={sidebar.isOpen}
        onToggle={sidebar.toggle}
        onClose={sidebar.close}
        collapsed={sidebar.collapsed}
        onToggleCollapsed={sidebar.toggleCollapsed}
      />
      <main style={{ flex: 1, minWidth: 0, overflowX: "hidden", padding: isMobile ? `${theme.spacing.xxl}px ${theme.spacing.lg}px` : theme.spacing.xxl, paddingTop: isMobile ? 64 : theme.spacing.xxl }}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
            <PageRouter page={page} navigate={navigate} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <ToastContainer />
      <GlobalJobsPanel activeJobs={activeJobs} recentDone={recentDone} onCancel={cancelJob} />
      {tour.show && <OnboardingTour onDismiss={tour.dismiss} />}
      {paletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            items={paletteItems}
            onSelect={(id) => navigate(id as Page)}
            onClose={() => setPaletteOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}

function PageRouter({ page, navigate }: { page: Page; navigate: (p: Page) => void }) {
  switch (page) {
    case "wizard": return <PipelineWizard navigate={navigate} />;
    case "dashboard": return <Dashboard />;
    case "seriesOverview": return <SeriesOverview />;
    case "monitoring": return <Monitoring />;
    case "pipelineProgress": return <PipelineProgress />;
    case "kanban": return <EpisodeKanban />;
    case "projects": return <Projects />;
    case "storyEditor": return <StoryEditor />;
    case "storygraph": return <Storygraph />;
    case "quality": return <Quality />;
    case "benchmark": return <Benchmark />;
    case "agentChat": return <AgentChat />;
    case "assets": return <Assets />;
    case "tts": return <TTS />;
    case "render": return <Render />;
    case "image": return <ImageGen />;
    case "workflows": return <Workflows />;
    case "settings": return <Settings />;
    default: return <Placeholder name={page} />;
  }
}

function Placeholder({ name }: { name: string }) {
  const theme = useTheme();
  const { t } = useI18n();
  return <div style={{ color: theme.colors.text.tertiary }}>{t.common.comingSoon(name)}</div>;
}
