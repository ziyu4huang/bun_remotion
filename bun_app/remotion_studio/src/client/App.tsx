import { useState, useCallback, useEffect, useMemo, lazy, Suspense } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { GlobalJobsPanel } from "./components/GlobalJobsPanel";
import { type PaletteItem } from "./components/CommandPalette";
import { useTheme, useThemeMode } from "./theme";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useSidebarState } from "./hooks/useSidebarState";
import { useJobStream } from "./hooks/useJobStream";
import { useI18n, type Locale } from "./i18n";

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
const CommandPalette = lazy(() => import("./components/CommandPalette").then(m => ({ default: m.CommandPalette })));

const preloadedPages = new Set<string>();
function preloadPage(pageId: string) {
  if (preloadedPages.has(pageId)) return;
  preloadedPages.add(pageId);
  switch (pageId) {
    case "wizard": import("./pages/PipelineWizard"); break;
    case "dashboard": import("./pages/Dashboard"); break;
    case "monitoring": import("./pages/Monitoring"); break;
    case "pipelineProgress": import("./pages/PipelineProgress"); break;
    case "kanban": import("./pages/EpisodeKanban"); break;
    case "projects": import("./pages/Projects"); break;
    case "storyEditor": import("./pages/StoryEditor"); break;
    case "storygraph": import("./pages/Storygraph"); break;
    case "quality": import("./pages/Quality"); break;
    case "benchmark": import("./pages/Benchmark"); break;
    case "agentChat": import("./pages/AgentChat"); break;
    case "assets": import("./pages/Assets"); break;
    case "tts": import("./pages/TTS"); break;
    case "render": import("./pages/Render"); break;
    case "image": import("./pages/ImageGen"); break;
    case "workflows": import("./pages/Workflows"); break;
    case "settings": import("./pages/Settings"); break;
  }
}

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

type Page = "dashboard" | "monitoring" | "pipelineProgress" | "kanban" | "wizard" | "projects" | "storyEditor" | "storygraph" | "quality" | "benchmark" | "agentChat" | "assets" | "tts" | "render" | "workflows" | "image" | "settings";

const NAV_SECTIONS: { labelKey: keyof typeof import("./i18n/en.js").en.nav; items: { id: Page; labelKey: keyof typeof import("./i18n/en.js").en.pages; icon: string }[] }[] = [
  {
    labelKey: "overview",
    items: [
      { id: "wizard", labelKey: "wizard", icon: "\u{1F52E}" },
      { id: "dashboard", labelKey: "dashboard", icon: "■" },
      { id: "monitoring", labelKey: "monitoring", icon: "●" },
      { id: "pipelineProgress", labelKey: "progress", icon: "▣" },
      { id: "kanban", labelKey: "kanban", icon: "▦" },
    ],
  },
  {
    labelKey: "production",
    items: [
      { id: "projects", labelKey: "projects", icon: "\u{1F4C1}" },
      { id: "storyEditor", labelKey: "storyEditor", icon: "✍" },
      { id: "workflows", labelKey: "workflows", icon: "⚙" },
    ],
  },
  {
    labelKey: "analysis",
    items: [
      { id: "storygraph", labelKey: "storygraph", icon: "\u{1F578}" },
      { id: "quality", labelKey: "quality", icon: "✔" },
      { id: "benchmark", labelKey: "benchmark", icon: "\u{1F4CA}" },
    ],
  },
  {
    labelKey: "ai",
    items: [
      { id: "agentChat", labelKey: "agentChat", icon: "\u{1F916}" },
    ],
  },
  {
    labelKey: "assets",
    items: [
      { id: "assets", labelKey: "assets", icon: "\u{1F5BC}" },
      { id: "tts", labelKey: "tts", icon: "\u{1F50A}" },
      { id: "render", labelKey: "render", icon: "▶" },
      { id: "image", labelKey: "image", icon: "\u{1F3A8}" },
    ],
  },
];

export function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const theme = useTheme();
  const { mode, toggle: toggleTheme } = useThemeMode();
  const { locale, setLocale, t } = useI18n();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile - 1}px)`);
  const sidebar = useSidebarState();
  const { activeJobs, recentDone, cancelJob } = useJobStream();

  const navigate = useCallback((p: Page) => {
    setPage(p);
    if (isMobile) sidebar.close();
  }, [isMobile, sidebar]);

  // Cmd+K / Ctrl+K to open command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Build palette items from nav sections
  const paletteItems: PaletteItem[] = useMemo(() =>
    NAV_SECTIONS.flatMap((section) =>
      section.items.map((item) => ({
        id: item.id,
        label: t.pages[item.labelKey] ?? item.labelKey,
        icon: item.icon,
        group: t.nav[section.labelKey] ?? section.labelKey,
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

  const navItems = (
    <>
      <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, letterSpacing: 0.5, color: theme.colors.text.primary }}>
        {t.app.title}
      </h2>
      {NAV_SECTIONS.map((section) => (
        <div key={section.labelKey} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: theme.colors.text.muted, padding: "0 12px", marginBottom: 4 }}>
            {t.nav[section.labelKey]}
          </div>
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              onMouseEnter={() => preloadPage(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: isMobile ? "11px 12px" : "7px 12px",
                marginBottom: 2,
                border: "none",
                background: page === item.id ? theme.colors.primaryLight : "transparent",
                borderRadius: theme.radii.lg,
                cursor: "pointer",
                fontSize: theme.font.sizes.base,
                color: page === item.id ? theme.colors.primaryDark : theme.colors.text.secondary,
                fontWeight: page === item.id ? theme.font.weights.medium : theme.font.weights.normal,
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {t.pages[item.labelKey]}
            </button>
          ))}
        </div>
      ))}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.colors.border.default}` }}>
        <button
          onClick={() => navigate("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            textAlign: "left",
            padding: isMobile ? "11px 12px" : "7px 12px",
            marginBottom: 8,
            border: "none",
            background: page === "settings" ? theme.colors.primaryLight : "transparent",
            borderRadius: theme.radii.lg,
            cursor: "pointer",
            fontSize: theme.font.sizes.base,
            color: page === "settings" ? theme.colors.primaryDark : theme.colors.text.secondary,
            fontWeight: page === "settings" ? theme.font.weights.medium : theme.font.weights.normal,
          }}
        >
          <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>⚙</span>
          {t.pages.settings}
        </button>
        <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
          <button
            onClick={toggleTheme}
            style={{
              width: 36, height: 36, borderRadius: theme.radii.lg,
              border: `1px solid ${theme.colors.border.default}`, background: theme.colors.bg.muted,
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={t.app.switchTheme(mode)}
          >
            {mode === "light" ? "◐" : "◑"}
          </button>
          <button
            onClick={() => setLocale(locale === "en" ? "zh_TW" : "en")}
            style={{
              width: 36, height: 36, borderRadius: theme.radii.lg,
              border: `1px solid ${theme.colors.border.default}`, background: theme.colors.bg.muted,
              cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 600,
            }}
            title={locale === "en" ? "切換至中文" : "Switch to English"}
          >
            {locale === "en" ? "中" : "En"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: theme.font.family, background: theme.colors.bg.page, color: theme.colors.text.primary }}>
      {/* Mobile: hamburger + overlay sidebar */}
      {isMobile && (
        <>
          <button
            onClick={sidebar.toggle}
            style={{
              position: "fixed", top: 12, left: 12, zIndex: 1001,
              width: 44, height: 44, borderRadius: theme.radii.lg,
              border: `1px solid ${theme.colors.border.default}`, background: theme.colors.bg.surface,
              cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: theme.shadows.md,
            }}
            aria-label="Toggle navigation"
          >
            {sidebar.isOpen ? "✕" : "☰"}
          </button>

          {/* Backdrop */}
          {sidebar.isOpen && (
            <div
              onClick={sidebar.close}
              style={{
                position: "fixed", inset: 0, zIndex: 999,
                background: theme.colors.bg.overlayLight,
              }}
            />
          )}

          {/* Sidebar overlay */}
          <nav style={{
            position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 1000,
            width: 260, padding: "16px 12px",
            borderRight: `1px solid ${theme.colors.border.default}`,
            background: theme.colors.bg.surface,
            overflowY: "auto",
            transform: sidebar.isOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.25s ease",
          }}>
            {navItems}
          </nav>
        </>
      )}

      {/* Desktop: static sidebar (collapsible) */}
      {!isMobile && (
        <nav style={{
          width: sidebar.collapsed ? 56 : 210,
          padding: "16px 8px",
          borderRight: `1px solid ${theme.colors.border.default}`,
          background: theme.colors.bg.surface,
          overflowY: "auto",
          flexShrink: 0,
          transition: "width 0.2s ease",
          position: "relative",
        }}>
          {/* Collapse toggle */}
          <button
            onClick={sidebar.toggleCollapsed}
            style={{
              position: "absolute",
              top: 12,
              right: sidebar.collapsed ? 6 : -10,
              width: 20,
              height: 20,
              borderRadius: theme.radii.full,
              border: `1px solid ${theme.colors.border.medium}`,
              background: theme.colors.bg.surface,
              color: theme.colors.text.muted,
              cursor: "pointer",
              fontSize: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            {sidebar.collapsed ? "▸" : "◂"}
          </button>
          {sidebar.collapsed ? (
            // Collapsed: icons only with tooltips
            <>
              <div style={{ height: 24, marginBottom: 12 }} />
              {NAV_SECTIONS.map((section) => (
                <div key={section.labelKey} style={{ marginBottom: 8 }}>
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      title={t.pages[item.labelKey] ?? item.labelKey}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 36,
                        margin: "0 auto 2px",
                        border: "none",
                        background: page === item.id ? theme.colors.primaryLight : "transparent",
                        borderRadius: theme.radii.lg,
                        cursor: "pointer",
                        fontSize: 16,
                        transition: "background 0.15s",
                      }}
                    >
                      {item.icon}
                    </button>
                  ))}
                </div>
              ))}
            </>
          ) : (
            navItems
          )}
        </nav>
      )}

      <main style={{ flex: 1, padding: isMobile ? `${theme.spacing.xxl}px ${theme.spacing.lg}px` : theme.spacing.xxl, paddingTop: isMobile ? 64 : theme.spacing.xxl }}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoadingFallback />}>
            <PageRouter page={page} navigate={navigate} />
          </Suspense>
        </ErrorBoundary>
      </main>
      <ToastContainer />
      <GlobalJobsPanel activeJobs={activeJobs} recentDone={recentDone} onCancel={cancelJob} />
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
    case "wizard":
      return <PipelineWizard navigate={navigate} />;
    case "dashboard":
      return <Dashboard />;
    case "monitoring":
      return <Monitoring />;
    case "pipelineProgress":
      return <PipelineProgress />;
    case "kanban":
      return <EpisodeKanban />;
    case "projects":
      return <Projects />;
    case "storyEditor":
      return <StoryEditor />;
    case "storygraph":
      return <Storygraph />;
    case "quality":
      return <Quality />;
    case "benchmark":
      return <Benchmark />;
    case "agentChat":
      return <AgentChat />;
    case "assets":
      return <Assets />;
    case "tts":
      return <TTS />;
    case "render":
      return <Render />;
    case "image":
      return <ImageGen />;
    case "workflows":
      return <Workflows />;
    case "settings":
      return <Settings />;
    default:
      return <Placeholder name={page} />;
  }
}

function Placeholder({ name }: { name: string }) {
  const theme = useTheme();
  const { t } = useI18n();
  return <div style={{ color: theme.colors.text.tertiary }}>{t.common.comingSoon(name)}</div>;
}
