import { useState, useEffect, useCallback } from "react";
import { Button } from "./Button";
import { useI18n } from "../i18n";
import { useTheme } from "../theme";

interface TourStep {
  key: string;
  icon: string;
  area: string;
}

const TOUR_STEPS: TourStep[] = [
  { key: "welcome", icon: "\u{1F44B}", area: "center" },
  { key: "pipeline", icon: "\u{1F3AC}", area: "wizard" },
  { key: "ai", icon: "\u{1F916}", area: "advisor" },
  { key: "quickActions", icon: "\u{2328}", area: "palette" },
  { key: "progress", icon: "\u{1F4CA}", area: "jobs" },
];

const STORAGE_KEY = "remotion_studio_tour_seen";

export function useOnboardingTour() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Skip tour in automated testing (Playwright sets navigator.webdriver)
    if (navigator.webdriver) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setShow(true), 800);
        return () => clearTimeout(timer);
      }
    } catch { /* ignore */ }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  }, []);

  const replay = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setShow(true);
  }, []);

  return { show, dismiss, replay };
}

export function OnboardingTour({ onDismiss }: { onDismiss: () => void }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isFirst = step === 0;

  const next = () => {
    if (isLast) {
      onDismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  const prev = () => {
    if (!isFirst) setStep((s) => s - 1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onDismiss();
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [step]);

  const tourT = (t as any).onboardingTour?.[current.key] ?? {};
  const title = tourT.title ?? current.key;
  const description = tourT.description ?? "";

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.colors.bg.surface,
          borderRadius: theme.radii.xl,
          padding: theme.spacing.xl,
          maxWidth: 420,
          width: "min(420px, 90vw)",
          boxShadow: theme.shadows.xl,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: theme.spacing.md }}>{current.icon}</div>
        <div style={{ fontSize: theme.font.sizes.xs, color: theme.colors.text.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
          {step + 1} / {TOUR_STEPS.length}
        </div>
        <div style={{ fontSize: theme.font.sizes.lg, fontWeight: theme.font.weights.bold, color: theme.colors.text.primary, marginBottom: theme.spacing.sm }}>
          {title}
        </div>
        <div style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.secondary, lineHeight: 1.6, marginBottom: theme.spacing.xl }}>
          {description}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: theme.spacing.lg }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: i === step ? theme.colors.primary : theme.colors.border.default,
                transition: "background 0.2s",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: theme.spacing.sm }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={prev}
              style={{ visibility: isFirst ? "hidden" as const : "visible" as const }}
            >
              &larr; Back
            </Button>
          </div>
          <div style={{ display: "flex", gap: theme.spacing.sm }}>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Skip
            </Button>
            <Button variant="primary" size="sm" onClick={next}>
              {isLast ? "Got it!" : "Next →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
