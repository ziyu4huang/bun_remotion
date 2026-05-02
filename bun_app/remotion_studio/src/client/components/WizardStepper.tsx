import { useRef } from "react";
import { Button } from "./Button";
import { WizardProgressBar } from "./WizardProgressBar";
import type { useI18n } from "../i18n";
import type { useTheme } from "../theme";
import { STEPS, type SeriesProgress, type WizardStep } from "./WizardTypes";
import type { EpisodeStepProgress } from "../../shared/types";

export { STEPS, findCurrentStep } from "./WizardTypes";
export type { WizardStep, WizardStepStatus, SeriesProgress } from "./WizardTypes";

function isStepDone(step: WizardStep, progress: SeriesProgress[]): boolean {
  return progress.every((p) => p.steps[step.key].done === p.steps[step.key].total);
}

function isStepPartial(step: WizardStep, progress: SeriesProgress[]): boolean {
  return progress.some((p) => p.steps[step.key].done > 0 && p.steps[step.key].done < p.steps[step.key].total);
}

function stepProgress(step: WizardStep, progress: SeriesProgress[]): number {
  const totalDone = progress.reduce((s, p) => s + p.steps[step.key].done, 0);
  const totalAll = progress.reduce((s, p) => s + p.steps[step.key].total, 0);
  return totalAll > 0 ? Math.round(totalDone / totalAll * 100) : 0;
}

export function WizardStepper({ progress, currentStep, selectedSeries, onNavigate, theme, t, isMobile, skipOpen, onToggleSkip, helpStep, onHelp }: {
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
          const done = isStepDone(step, progress);
          const partial = isStepPartial(step, progress);
          const current = currentStep === step.key;
          const pct = stepProgress(step, progress);
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
                        <WizardProgressBar pct={pct} color={done ? theme.colors.status.success : theme.colors.primary} theme={theme} />
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
