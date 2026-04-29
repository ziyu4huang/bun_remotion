import { useState, useCallback } from "react";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";
import { Storygraph } from "./pages/Storygraph";
import { Quality } from "./pages/Quality";
import { Assets } from "./pages/Assets";
import { TTS } from "./pages/TTS";
import { Render } from "./pages/Render";
import { Workflows } from "./pages/Workflows";
import { Monitoring } from "./pages/Monitoring";
import { StoryEditor } from "./pages/StoryEditor";
import { ImageGen } from "./pages/ImageGen";
import { Benchmark } from "./pages/Benchmark";
import { AgentChat } from "./pages/AgentChat";
import { PipelineProgress } from "./pages/PipelineProgress";
import { EpisodeKanban } from "./pages/EpisodeKanban";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { useTheme, useThemeMode } from "./theme";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { useSidebarState } from "./hooks/useSidebarState";
import { useI18n, type Locale } from "./i18n";

type Page = "dashboard" | "monitoring" | "pipelineProgress" | "kanban" | "projects" | "storyEditor" | "storygraph" | "quality" | "benchmark" | "agentChat" | "assets" | "tts" | "render" | "workflows" | "image";

const NAV_SECTIONS: { labelKey: keyof typeof import("./i18n/en.js").en.nav; items: { id: Page; labelKey: keyof typeof import("./i18n/en.js").en.pages; icon: string }[] }[] = [
  {
    labelKey: "overview",
    items: [
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
  const theme = useTheme();
  const { mode, toggle: toggleTheme } = useThemeMode();
  const { locale, setLocale, t } = useI18n();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile - 1}px)`);
  const sidebar = useSidebarState();

  const navigate = useCallback((p: Page) => {
    setPage(p);
    if (isMobile) sidebar.close();
  }, [isMobile, sidebar]);

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
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.colors.border.default}`, display: "flex", justifyContent: "center", gap: 8 }}>
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

      {/* Desktop: static sidebar */}
      {!isMobile && (
        <nav style={{ width: 210, padding: "16px 12px", borderRight: `1px solid ${theme.colors.border.default}`, background: theme.colors.bg.surface, overflowY: "auto", flexShrink: 0 }}>
          {navItems}
        </nav>
      )}

      <main style={{ flex: 1, padding: isMobile ? `${theme.spacing.xxl}px ${theme.spacing.lg}px` : theme.spacing.xxl, paddingTop: isMobile ? 64 : theme.spacing.xxl }}>
        <ErrorBoundary>
          <PageRouter page={page} />
        </ErrorBoundary>
      </main>
      <ToastContainer />
    </div>
  );
}

function PageRouter({ page }: { page: Page }) {
  switch (page) {
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
    default:
      return <Placeholder name={page} />;
  }
}

function Placeholder({ name }: { name: string }) {
  const theme = useTheme();
  const { t } = useI18n();
  return <div style={{ color: theme.colors.text.tertiary }}>{t.common.comingSoon(name)}</div>;
}
