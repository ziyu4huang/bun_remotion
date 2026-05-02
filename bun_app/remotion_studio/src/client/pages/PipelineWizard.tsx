import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, Button, StatusBadge } from "../components";
import { WizardStepper } from "../components/WizardStepper";
import { WizardOverviewCards } from "../components/WizardOverviewCards";
import { WizardSeriesBreakdown } from "../components/WizardSeriesBreakdown";
import { findCurrentStep, type SeriesProgress } from "../components/WizardTypes";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { EpisodeProgress, EpisodeStepProgress, Project } from "../../shared/types";

function computeSeriesProgress(episodes: EpisodeProgress[]): SeriesProgress[] {
  const bySeries = new Map<string, EpisodeProgress[]>();
  for (const ep of episodes) {
    const list = bySeries.get(ep.seriesId) ?? [];
    list.push(ep);
    bySeries.set(ep.seriesId, list);
  }

  const stepKeys: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

  return Array.from(bySeries.entries()).map(([seriesId, eps]) => {
    const steps = {} as Record<keyof EpisodeStepProgress, { done: number; total: number }>;
    for (const key of stepKeys) {
      steps[key] = {
        done: eps.filter((e) => e.steps[key]).length,
        total: eps.length,
      };
    }
    return {
      seriesId,
      seriesName: eps[0].seriesName,
      steps,
      completedEpisodes: eps.filter((e) => e.completedSteps === e.totalSteps).length,
      totalEpisodes: eps.length,
    };
  }).sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}

interface PipelineWizardProps {
  navigate: (page: string) => void;
}

export function PipelineWizard({ navigate }: PipelineWizardProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile - 1}px)`);
  const [episodes, setEpisodes] = useState<EpisodeProgress[]>([]);
  const [series, setSeries] = useState<Project[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [helpStep, setHelpStep] = useState<keyof EpisodeStepProgress | null>(null);
  const [mobileBreakdown, setMobileBreakdown] = useState<string | null>(null);

  useEffect(() => {
    const id = "wiz-animations";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = "@keyframes wizFadeSlide{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}";
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      api.getEpisodeProgress().then((r) => r.data?.episodes ?? []),
      api.listProjects().then((r) => r.data ?? []),
    ]).then(([eps, s]) => {
      setEpisodes(eps);
      setSeries(s);
      setLoading(false);
    });
    try {
      if (!localStorage.getItem("remotion_studio_wizard_seen")) {
        setShowWelcome(true);
      }
    } catch { /* ignore */ }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    if (dontShowAgain) {
      try { localStorage.setItem("remotion_studio_wizard_seen", "1"); } catch { /* ignore */ }
    }
  };

  const closeSkipOnOutside = useCallback((e: MouseEvent) => {
    setSkipOpen(false);
    document.removeEventListener("click", closeSkipOnOutside);
  }, []);

  const toggleSkip = () => {
    const next = !skipOpen;
    setSkipOpen(next);
    if (next) {
      setTimeout(() => document.addEventListener("click", closeSkipOnOutside), 0);
    }
  };

  if (loading) return <LoadingSpinner />;

  const filteredEpisodes = selectedSeries === "all"
    ? episodes
    : episodes.filter((e) => e.seriesId === selectedSeries);

  const progress = computeSeriesProgress(filteredEpisodes);
  const currentStep = findCurrentStep(filteredEpisodes);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <PageHeader title={t.wizard.title} description={t.wizard.description} />
        {!showWelcome && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWelcome(true)}
            title={t.wizard.helpTooltip}
            style={{
              marginTop: theme.spacing.md,
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap",
            }}
          >
            {"\u{2728}"} Guide
          </Button>
        )}
      </div>
      {showWelcome && (
        <WelcomeBanner
          theme={theme}
          t={t}
          dontShowAgain={dontShowAgain}
          onToggleDontShow={() => setDontShowAgain(!dontShowAgain)}
          onDismiss={dismissWelcome}
          isMobile={isMobile}
        />
      )}
      <SeriesSelector
        series={series}
        episodes={episodes}
        selected={selectedSeries}
        onSelect={setSelectedSeries}
        theme={theme}
        t={t}
        isMobile={isMobile}
      />
      {progress.length === 0 ? (
        <EmptyState icon="🎬" title={t.wizard.emptyTitle} description={t.wizard.emptyDesc} />
      ) : (
        <>
          <WizardOverviewCards progress={progress} theme={theme} t={t} isMobile={isMobile} />
          {currentStep && (
            <div style={{
              marginBottom: theme.spacing.md,
              padding: "8px 14px",
              borderRadius: theme.radii.md,
              background: `${theme.colors.primary}10`,
              borderLeft: `3px solid ${theme.colors.primary}`,
              fontSize: theme.font.sizes.sm,
              color: theme.colors.text.secondary,
              animation: "wizFadeSlide 0.3s ease-out",
            }}>
              {t.wizard.nextAction(t.dashboard.steps[currentStep] ?? currentStep)}
            </div>
          )}
          <WizardStepper
            progress={progress}
            currentStep={currentStep}
            selectedSeries={selectedSeries}
            onNavigate={navigate}
            theme={theme}
            t={t}
            isMobile={isMobile}
            skipOpen={skipOpen}
            onToggleSkip={toggleSkip}
            helpStep={helpStep}
            onHelp={setHelpStep}
          />
          <WizardSeriesBreakdown
            progress={progress}
            theme={theme}
            t={t}
            isMobile={isMobile}
            expanded={mobileBreakdown}
            onToggle={setMobileBreakdown}
          />
          <AIAssistantFAB theme={theme} t={t} onNavigate={navigate} currentStep={currentStep} />
        </>
      )}
    </div>
  );
}

function WelcomeBanner({ theme, t, dontShowAgain, onToggleDontShow, onDismiss, isMobile }: {
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  dontShowAgain: boolean;
  onToggleDontShow: () => void;
  onDismiss: () => void;
  isMobile: boolean;
}) {
  return (
    <div style={{
      padding: isMobile ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      borderRadius: theme.radii.xl,
      border: `2px solid ${theme.colors.primary}40`,
      background: `linear-gradient(135deg, ${theme.colors.primaryLight}, ${theme.colors.bg.surface})`,
    }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, justifyContent: "space-between", alignItems: isMobile ? "stretch" as const : "flex-start" as const, gap: isMobile ? 12 : 0 }}>
        <div>
          <div style={{ fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.bold, color: theme.colors.primaryDark, marginBottom: 6 }}>
            {t.wizard.welcomeTitle}
          </div>
          <div style={{ fontSize: theme.font.sizes.base, color: theme.colors.text.secondary, lineHeight: 1.6, maxWidth: 600 }}>
            {t.wizard.welcomeDesc}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: theme.spacing.md }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: theme.font.sizes.sm, color: theme.colors.text.muted, cursor: "pointer" }}>
              <input type="checkbox" checked={dontShowAgain} onChange={onToggleDontShow} style={{ cursor: "pointer" }} />
              {t.wizard.dontShowAgain}
            </label>
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            padding: "8px 20px",
            background: theme.colors.primary,
            color: theme.colors.bg.page,
            border: "none",
            borderRadius: theme.radii.lg,
            cursor: "pointer",
            fontSize: theme.font.sizes.base,
            fontWeight: theme.font.weights.medium,
            whiteSpace: "nowrap",
            minHeight: 44,
            alignSelf: isMobile ? "flex-end" as const : undefined,
          }}
        >
          {t.wizard.startPipeline}
        </button>
      </div>
    </div>
  );
}

function SeriesSelector({ series, episodes, selected, onSelect, theme, t, isMobile }: {
  series: Project[];
  episodes: EpisodeProgress[];
  selected: string;
  onSelect: (id: string) => void;
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  isMobile: boolean;
}) {
  const epCount = (seriesId: string) => episodes.filter((e) => e.seriesId === seriesId).length;

  return (
    <div style={{
      marginBottom: theme.spacing.lg,
      display: "flex",
      gap: isMobile ? 6 : 8,
      flexWrap: "wrap",
    }}>
      <Button
        variant={selected === "all" ? "primary" : "outline"}
        size="sm"
        onClick={() => onSelect("all")}
        style={{ minHeight: isMobile ? 44 : "auto" }}
      >
        {t.wizard.allSeries}
      </Button>
      {series.map((s) => (
        <Button
          key={s.seriesId}
          variant={selected === s.seriesId ? "primary" : "outline"}
          size="sm"
          onClick={() => onSelect(s.seriesId)}
          style={{ minHeight: isMobile ? 44 : "auto" }}
        >
          {s.name}
          <StatusBadge status="pending" label={`${epCount(s.seriesId)}`} />
        </Button>
      ))}
    </div>
  );
}

function AIAssistantFAB({ theme, t, onNavigate, currentStep }: {
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  onNavigate: (page: string) => void;
  currentStep: keyof EpisodeStepProgress | null;
}) {
  return (
    <button
      onClick={() => onNavigate("agentChat")}
      title={t.wizard.aiAssistantTip}
      style={{
        position: "fixed",
        bottom: 20,
        right: 84,
        width: 56,
        height: 56,
        borderRadius: "50%",
        border: "none",
        background: `linear-gradient(135deg, #7c3aed, ${theme.colors.primary})`,
        color: "#fff",
        fontSize: 24,
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 6px 24px rgba(124, 58, 237, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(124, 58, 237, 0.4)";
      }}
    >
      {"\u{1F916}"}
    </button>
  );
}
