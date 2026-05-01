import { useCallback, useEffect, useId, useRef, useState } from "react";
import { api } from "../api";
import { PageHeader, LoadingSpinner, EmptyState, Button, StatusBadge } from "../components";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";
import type { EpisodeProgress, EpisodeStepProgress, Project } from "../../shared/types";

type PageId = "storyEditor" | "projects" | "storygraph" | "image" | "tts" | "render" | "agentChat";

interface WizardStep {
  key: keyof EpisodeStepProgress;
  pageId: PageId;
  icon: string;
  estimatedTime: string;
}

const STEPS: WizardStep[] = [
  { key: "scaffold", pageId: "projects", icon: "\u{1F4E6}", estimatedTime: "~5s" },
  { key: "pipeline", pageId: "storygraph", icon: "\u{1F578}", estimatedTime: "~10s" },
  { key: "check", pageId: "storygraph", icon: "\u{1F6E1}", estimatedTime: "~3s" },
  { key: "score", pageId: "storygraph", icon: "\u{2B50}", estimatedTime: "~5s" },
  { key: "image", pageId: "image", icon: "\u{1F3A8}", estimatedTime: "~30s/img" },
  { key: "tts", pageId: "tts", icon: "\u{1F50A}", estimatedTime: "~20s/ep" },
  { key: "render", pageId: "render", icon: "\u{25B6}", estimatedTime: "~60s/ep" },
];

interface WizardStepStatus {
  done: number;
  total: number;
}

interface SeriesProgress {
  seriesId: string;
  seriesName: string;
  steps: Record<keyof EpisodeStepProgress, WizardStepStatus>;
  completedEpisodes: number;
  totalEpisodes: number;
}

function computeSeriesProgress(episodes: EpisodeProgress[]): SeriesProgress[] {
  const bySeries = new Map<string, EpisodeProgress[]>();
  for (const ep of episodes) {
    const list = bySeries.get(ep.seriesId) ?? [];
    list.push(ep);
    bySeries.set(ep.seriesId, list);
  }

  const stepKeys: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];

  return Array.from(bySeries.entries()).map(([seriesId, eps]) => {
    const steps = {} as Record<keyof EpisodeStepProgress, WizardStepStatus>;
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
          <OverviewCards progress={progress} theme={theme} t={t} isMobile={isMobile} />
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
          <StepStepper
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
          {isMobile ? (
            <MobileBreakdown
              progress={progress}
              theme={theme}
              t={t}
              expanded={mobileBreakdown}
              onToggle={setMobileBreakdown}
            />
          ) : (
            <SeriesBreakdown progress={progress} theme={theme} t={t} />
          )}
          <AIAssistantFAB theme={theme} t={t} onNavigate={navigate} currentStep={currentStep} />
        </>
      )}
    </div>
  );
}

function findCurrentStep(episodes: EpisodeProgress[]): keyof EpisodeStepProgress | null {
  const stepKeys: (keyof EpisodeStepProgress)[] = ["scaffold", "pipeline", "check", "score", "image", "tts", "render"];
  const counts: Partial<Record<keyof EpisodeStepProgress, number>> = {};

  for (const ep of episodes) {
    if (ep.completedSteps === ep.totalSteps) continue;
    for (const key of stepKeys) {
      if (!ep.steps[key]) {
        counts[key] = (counts[key] ?? 0) + 1;
        break;
      }
    }
  }

  const sorted = (Object.entries(counts) as [keyof EpisodeStepProgress, number][])
    .sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
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

function OverviewCards({ progress, theme, t, isMobile }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  isMobile: boolean;
}) {
  const totalEps = progress.reduce((s, p) => s + p.totalEpisodes, 0);
  const completedEps = progress.reduce((s, p) => s + p.completedEpisodes, 0);
  const avgCompletion = totalEps > 0
    ? Math.round(progress.reduce((s, p) => {
        const stepDone = Object.values(p.steps).reduce((a, b) => a + b.done, 0);
        const stepTotal = Object.values(p.steps).reduce((a, b) => a + b.total, 0);
        return s + (stepTotal > 0 ? stepDone / stepTotal : 0);
      }, 0) / progress.length * 100)
    : 0;
  const completedPct = totalEps > 0 ? Math.round(completedEps / totalEps * 100) : 0;

  const cards = [
    { label: t.wizard.totalEpisodes, value: String(totalEps), color: theme.colors.primary, pct: 100 },
    { label: t.wizard.completed, value: String(completedEps), color: theme.colors.status.success, pct: completedPct },
    { label: t.wizard.avgCompletion, value: `${avgCompletion}%`, color: theme.colors.primary, pct: avgCompletion },
  ];

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" as const : "row" as const, gap: theme.spacing.md, marginBottom: theme.spacing.xl }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          flex: 1,
          padding: theme.spacing.lg,
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.border.default}`,
          background: theme.colors.bg.surface,
        }}>
          <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 4 }}>{c.label}</div>
          <div style={{ fontSize: theme.font.sizes.xxl, fontWeight: theme.font.weights.bold, color: c.color, marginBottom: 8 }}>{c.value}</div>
          <ProgressBar pct={c.pct} color={c.color} theme={theme} />
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ pct, color, theme }: { pct: number; color: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <div style={{
      height: 4,
      borderRadius: 2,
      background: theme.colors.bg.muted,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        borderRadius: 2,
        background: color,
        transition: "width 0.3s ease",
      }} />
    </div>
  );
}

function StepStepper({ progress, currentStep, selectedSeries, onNavigate, theme, t, isMobile, skipOpen, onToggleSkip, helpStep, onHelp }: {
  progress: SeriesProgress[];
  currentStep: keyof EpisodeStepProgress | null;
  selectedSeries: string;
  onNavigate: (page: string) => void;
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  isMobile: boolean;
  skipOpen: boolean;
  onToggleSkip: () => void;
  helpStep: keyof EpisodeStepProgress | null;
  onHelp: (step: keyof EpisodeStepProgress | null) => void;
}) {
  const skipRef = useRef<HTMLDivElement>(null);

  const isStepDone = (step: WizardStep): boolean => {
    return progress.every((p) => p.steps[step.key].done === p.steps[step.key].total);
  };

  const isStepPartial = (step: WizardStep): boolean => {
    return progress.some((p) => p.steps[step.key].done > 0 && p.steps[step.key].done < p.steps[step.key].total);
  };

  const isStepCurrent = (step: WizardStep): boolean => {
    return currentStep === step.key;
  };

  const stepProgress = (step: WizardStep): number => {
    const totalDone = progress.reduce((s, p) => s + p.steps[step.key].done, 0);
    const totalAll = progress.reduce((s, p) => s + p.steps[step.key].total, 0);
    return totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
  };

  return (
    <div style={{
      padding: isMobile ? theme.spacing.md : theme.spacing.xl,
      borderRadius: theme.radii.lg,
      border: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.bg.surface,
      marginBottom: theme.spacing.xl,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing.lg }}>
        <div style={{
          fontSize: theme.font.sizes.lg,
          fontWeight: theme.font.weights.semibold,
          color: theme.colors.text.primary,
        }}>
          {t.wizard.productionPipeline}
        </div>
        <div ref={skipRef} style={{ position: "relative" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSkip}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Skip to step ▾
          </Button>
          {skipOpen && (
            <div style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 4,
              minWidth: 200,
              borderRadius: theme.radii.lg,
              border: `1px solid ${theme.colors.border.default}`,
              background: theme.colors.bg.surface,
              boxShadow: theme.shadows.lg,
              zIndex: 100,
              padding: "4px 0",
            }}>
              {STEPS.map((step) => {
                const stepLabel = t.dashboard.steps[step.key] ?? step.key;
                const done = progress.every((p) => p.steps[step.key].done === p.steps[step.key].total);
                return (
                  <Button
                    key={step.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => { onNavigate(step.pageId); onToggleSkip(); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      textAlign: "left",
                      fontWeight: currentStep === step.key ? theme.font.weights.medium : theme.font.weights.normal,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.bg.muted; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 14 }}>{step.icon}</span>
                    <span style={{ flex: 1 }}>{stepLabel}</span>
                    {done && <span style={{ fontSize: 11, color: theme.colors.status.success }}>✓</span>}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {STEPS.map((step, i) => {
          const done = isStepDone(step);
          const partial = isStepPartial(step);
          const current = isStepCurrent(step);
          const pct = stepProgress(step);
          const statusIcon = done ? "\u{2705}" : partial ? "\u{1F7E1}" : current ? "\u{1F4CD}" : "\u{26AA}";
          const statusLabel = done ? t.wizard.statusDone : partial ? t.wizard.statusPartial : current ? t.wizard.statusCurrent : t.wizard.statusPending;
          const stepLabel = t.dashboard.steps[step.key] ?? step.key;
          const isHelpOpen = helpStep === step.key;

          return (
            <div key={step.key}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 8 : 12,
                width: "100%",
                padding: isMobile ? "10px 8px" : "12px 16px",
                border: "none",
                borderLeft: current ? `3px solid ${theme.colors.primary}` : "3px solid transparent",
                background: current ? `${theme.colors.primary}08` : "transparent",
                borderRadius: theme.radii.md,
              }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(step.pageId)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 8 : 12,
                    flex: 1,
                    minWidth: 0,
                    padding: 0,
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: isMobile ? 16 : 20, width: isMobile ? 22 : 28, textAlign: "center" as const }}>{statusIcon}</span>
                  <span style={{ fontSize: isMobile ? 18 : 22, width: isMobile ? 22 : 28, textAlign: "center" as const }}>{step.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: theme.font.sizes.base,
                      fontWeight: current ? theme.font.weights.semibold : theme.font.weights.normal,
                      color: theme.colors.text.primary,
                    }}>
                      {stepLabel}
                    </div>
                    <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted }}>
                      {statusLabel} &middot; {step.estimatedTime}
                    </div>
                    {(done || partial) && (
                      <div style={{ marginTop: 4, maxWidth: 120 }}>
                        <ProgressBar pct={pct} color={done ? theme.colors.status.success : theme.colors.primary} theme={theme} />
                      </div>
                    )}
                  </div>
                </Button>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onHelp(isHelpOpen ? null : step.key)}
                    title={t.wizard.helpTooltip}
                    style={{
                      width: isMobile ? 40 : 28,
                      height: isMobile ? 40 : 28,
                      borderRadius: "50%",
                      background: isHelpOpen ? theme.colors.primaryLight : "transparent",
                      lineHeight: 1,
                    }}
                  >
                    ?
                  </Button>
                  {current && !done && (
                    <Button
                      variant="primary"
                      size={isMobile ? "md" : "sm"}
                      onClick={() => onNavigate(step.pageId)}
                      style={{ minHeight: isMobile ? 44 : "auto" }}
                    >
                      {t.wizard.startStep}
                    </Button>
                  )}
                  {!current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate(step.pageId)}
                      style={{ minHeight: isMobile ? 44 : "auto", minWidth: isMobile ? 44 : "auto" }}
                    >
                      {t.wizard.gopage}
                    </Button>
                  )}
                </div>
              </div>
              {isHelpOpen && (
                <div style={{
                  margin: `0 0 ${isMobile ? 8 : 12}px ${isMobile ? 56 : 72}px`,
                  padding: "10px 14px",
                  borderRadius: theme.radii.md,
                  background: theme.colors.bg.muted,
                  borderLeft: `3px solid ${theme.colors.primary}`,
                  fontSize: theme.font.sizes.sm,
                  color: theme.colors.text.secondary,
                  lineHeight: 1.5,
                  animation: "wizFadeSlide 0.2s ease-out",
                }}>
                  {t.wizard.stepHelp[step.key]}
                </div>
              )}
              {i < STEPS.length - 1 && (
                <div style={{
                  marginLeft: isMobile ? 30 : 42,
                  width: 2,
                  height: 12,
                  borderRadius: 1,
                  background: done ? theme.colors.status.success : theme.colors.border.light,
                  transition: "background 0.4s ease, height 0.3s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileBreakdown({ progress, theme, t, expanded, onToggle }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
  expanded: string | null;
  onToggle: (id: string | null) => void;
}) {
  if (progress.length <= 1) return null;

  return (
    <div style={{
      borderRadius: theme.radii.lg,
      border: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.bg.surface,
      overflow: "hidden",
    }}>
      <div style={{
        padding: "12px 16px",
        fontSize: theme.font.sizes.sm,
        fontWeight: theme.font.weights.semibold,
        color: theme.colors.text.primary,
        borderBottom: `1px solid ${theme.colors.border.default}`,
      }}>
        {t.wizard.breakdownMobile}
      </div>
      {progress.map((p) => {
        const totalDone = Object.values(p.steps).reduce((s, v) => s + v.done, 0);
        const totalSteps = Object.values(p.steps).reduce((s, v) => s + v.total, 0);
        const pct = totalSteps > 0 ? Math.round(totalDone / totalSteps * 100) : 0;
        const isOpen = expanded === p.seriesId;

        return (
          <div key={p.seriesId} style={{ borderBottom: `1px solid ${theme.colors.border.light}` }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggle(isOpen ? null : p.seriesId)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                textAlign: "left",
                minHeight: 44,
              }}
            >
              <div>
                <div style={{ fontSize: theme.font.sizes.sm, fontWeight: theme.font.weights.medium, color: theme.colors.text.primary }}>
                  {p.seriesName}
                </div>
                <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginTop: 2 }}>
                  {p.completedEpisodes}/{p.totalEpisodes} episodes
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: theme.font.sizes.sm,
                  fontWeight: theme.font.weights.medium,
                  color: pct === 100 ? theme.colors.status.success : theme.colors.text.secondary,
                }}>
                  {pct}%
                </span>
                <span style={{ fontSize: 10, color: theme.colors.text.muted, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                  ▸
                </span>
              </div>
            </Button>
            {isOpen && (
              <div style={{
                padding: "4px 16px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                animation: "wizFadeSlide 0.2s ease-out",
              }}>
                {STEPS.map((s) => {
                  const st = p.steps[s.key];
                  const stPct = st.total > 0 ? Math.round(st.done / st.total * 100) : 0;
                  return (
                    <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15, width: 22, textAlign: "center" as const }}>{s.icon}</span>
                      <span style={{ flex: 1, fontSize: theme.font.sizes.sm, color: theme.colors.text.primary }}>
                        {t.dashboard.steps[s.key] ?? s.key}
                      </span>
                      <span style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, width: 34, textAlign: "right" as const, fontVariantNumeric: "tabular-nums" }}>
                        {st.done}/{st.total}
                      </span>
                      <div style={{ width: 64 }}>
                        <ProgressBar pct={stPct} color={stPct === 100 ? theme.colors.status.success : theme.colors.primary} theme={theme} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SeriesBreakdown({ progress, theme, t }: {
  progress: SeriesProgress[];
  theme: ReturnType<typeof useTheme>;
  t: ReturnType<typeof useI18n>["t"];
}) {
  if (progress.length <= 1) return null;

  return (
    <div style={{
      padding: theme.spacing.xl,
      borderRadius: theme.radii.lg,
      border: `1px solid ${theme.colors.border.default}`,
      background: theme.colors.bg.surface,
    }}>
      <div style={{
        fontSize: theme.font.sizes.lg,
        fontWeight: theme.font.weights.semibold,
        marginBottom: theme.spacing.lg,
        color: theme.colors.text.primary,
      }}>
        {t.wizard.seriesBreakdown}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: theme.font.sizes.sm }}>
          <thead>
            <tr>
              <th style={thStyle(theme)}>{t.wizard.seriesCol}</th>
              {STEPS.map((s) => (
                <th key={s.key} style={{ ...thStyle(theme), textAlign: "center" as const }}>
                  {t.dashboard.steps[s.key] ? t.dashboard.steps[s.key].split(" ")[0] : s.key}
                </th>
              ))}
              <th style={{ ...thStyle(theme), textAlign: "center" as const }}>{t.wizard.progressCol}</th>
            </tr>
          </thead>
          <tbody>
            {progress.map((p) => {
              const totalDone = Object.values(p.steps).reduce((s, v) => s + v.done, 0);
              const totalSteps = Object.values(p.steps).reduce((s, v) => s + v.total, 0);
              const pct = totalSteps > 0 ? Math.round(totalDone / totalSteps * 100) : 0;

              return (
                <tr key={p.seriesId}>
                  <td style={tdStyle(theme)}>{p.seriesName}</td>
                  {STEPS.map((s) => {
                    const st = p.steps[s.key];
                    return (
                      <td key={s.key} style={{ ...tdStyle(theme), textAlign: "center" as const }}>
                        {st.done}/{st.total}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle(theme), textAlign: "center" as const }}>
                    <span style={{
                      color: pct === 100 ? theme.colors.status.success : theme.colors.text.secondary,
                      fontWeight: pct === 100 ? theme.font.weights.medium : theme.font.weights.normal,
                    }}>
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

function thStyle(theme: ReturnType<typeof useTheme>) {
  return {
    padding: "8px 10px",
    textAlign: "left" as const,
    fontWeight: theme.font.weights.medium as number,
    color: theme.colors.text.muted,
    borderBottom: `1px solid ${theme.colors.border.default}`,
    fontSize: theme.font.sizes.xs,
  };
}

function tdStyle(theme: ReturnType<typeof useTheme>) {
  return {
    padding: "8px 10px",
    borderBottom: `1px solid ${theme.colors.border.light}`,
    color: theme.colors.text.primary,
  };
}
