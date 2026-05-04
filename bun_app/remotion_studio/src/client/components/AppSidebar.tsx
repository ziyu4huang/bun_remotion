import { useTheme, useThemeMode } from "../theme";
import { useI18n, type Locale } from "../i18n";
import { NAV_SECTIONS, preloadPage, type Page } from "../lib/nav-config.js";

interface AppSidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isMobile: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

function NavItems({ currentPage, onNavigate, isMobile }: { currentPage: Page; onNavigate: (p: Page) => void; isMobile: boolean }) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <>
      <h2 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 600, letterSpacing: 0.5, color: theme.colors.text.primary }}>
        {t.app.title}
      </h2>
      {NAV_SECTIONS.map((section) => (
        <div key={section.labelKey} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, color: theme.colors.text.muted, padding: "0 12px", marginBottom: 4 }}>
            {t.nav[section.labelKey as keyof typeof t.nav]}
          </div>
          {section.items.map((item) => (
            <button
              key={item.id}
              tabIndex={0}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => preloadPage(item.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onNavigate(item.id); } }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                textAlign: "left",
                padding: isMobile ? "11px 12px" : "7px 12px",
                marginBottom: 2,
                border: "none",
                background: currentPage === item.id ? theme.colors.primaryLight : "transparent",
                borderRadius: theme.radii.lg,
                cursor: "pointer",
                fontSize: theme.font.sizes.base,
                color: currentPage === item.id ? theme.colors.primaryDark : theme.colors.text.secondary,
                fontWeight: currentPage === item.id ? theme.font.weights.medium : theme.font.weights.normal,
                transition: "background 0.15s",
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {t.pages[item.labelKey as keyof typeof t.pages]}
            </button>
          ))}
        </div>
      ))}
      <SidebarFooter currentPage={currentPage} onNavigate={onNavigate} isMobile={isMobile} />
    </>
  );
}

function SidebarFooter({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void; isMobile: boolean }) {
  const theme = useTheme();
  const { mode, toggle: toggleTheme } = useThemeMode();
  const { locale, setLocale, t } = useI18n();

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${theme.colors.border.default}` }}>
      <button
        onClick={() => onNavigate("settings")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          textAlign: "left",
          padding: "7px 12px",
          marginBottom: 8,
          border: "none",
          background: currentPage === "settings" ? theme.colors.primaryLight : "transparent",
          borderRadius: theme.radii.lg,
          cursor: "pointer",
          fontSize: theme.font.sizes.base,
          color: currentPage === "settings" ? theme.colors.primaryDark : theme.colors.text.secondary,
          fontWeight: currentPage === "settings" ? theme.font.weights.medium : theme.font.weights.normal,
        }}
      >
        <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>⚙</span>
        {t.pages.settings}
      </button>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        <button
          onClick={toggleTheme}
          aria-label={t.app.switchTheme(mode)}
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
          aria-label={locale === "en" ? "切換至中文" : "Switch to English"}
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
  );
}

function CollapsedIcons({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <>
      <div style={{ height: 24, marginBottom: 12 }} />
      {NAV_SECTIONS.map((section) => (
        <div key={section.labelKey} style={{ marginBottom: 8 }}>
          {section.items.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={t.pages[item.labelKey as keyof typeof t.pages] ?? item.labelKey}
              aria-label={t.pages[item.labelKey as keyof typeof t.pages] ?? item.labelKey}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 36,
                margin: "0 auto 2px",
                border: "none",
                background: currentPage === item.id ? theme.colors.primaryLight : "transparent",
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
  );
}

export function AppSidebar({ currentPage, onNavigate, isMobile, isOpen, onToggle, onClose, collapsed, onToggleCollapsed }: AppSidebarProps) {
  const theme = useTheme();

  if (isMobile) {
    return (
      <>
        <button
          onClick={onToggle}
          style={{
            position: "fixed", top: 12, left: 12, zIndex: 1001,
            width: 44, height: 44, borderRadius: theme.radii.lg,
            border: `1px solid ${theme.colors.border.default}`, background: theme.colors.bg.surface,
            cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: theme.shadows.md,
          }}
          aria-label="Toggle navigation"
        >
          {isOpen ? "✕" : "☰"}
        </button>

        {isOpen && (
          <div
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, zIndex: 999,
              background: theme.colors.bg.overlayLight,
            }}
          />
        )}

        <nav style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 1000,
          width: 260, padding: "16px 12px",
          borderRight: `1px solid ${theme.colors.border.default}`,
          background: theme.colors.bg.surface,
          overflowY: "auto",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}>
          <NavItems currentPage={currentPage} onNavigate={onNavigate} isMobile={isMobile} />
        </nav>
      </>
    );
  }

  return (
    <nav style={{
      width: collapsed ? 56 : 210,
      padding: "16px 8px",
      borderRight: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.bg.surface,
      overflowY: "auto",
      flexShrink: 0,
      transition: "width 0.2s ease",
      position: "relative",
    }}>
      <button
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          position: "absolute",
          top: 12,
          right: collapsed ? 6 : -10,
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
        {collapsed ? "▸" : "◂"}
      </button>
      {collapsed ? (
        <CollapsedIcons currentPage={currentPage} onNavigate={onNavigate} />
      ) : (
        <NavItems currentPage={currentPage} onNavigate={onNavigate} isMobile={false} />
      )}
    </nav>
  );
}
