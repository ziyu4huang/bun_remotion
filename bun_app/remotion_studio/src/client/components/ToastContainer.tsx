import { useEffect, useState } from "react";
import { useTheme } from "../theme";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const listeners: Array<() => void> = [];
let toasts: Toast[] = [];
let nextId = 0;
const MAX_VISIBLE = 5;

function notify() {
  for (const fn of listeners) fn();
}

export function toast(type: ToastType, message: string) {
  const t: Toast = { id: nextId++, type, message };
  toasts = [t, ...toasts];
  if (toasts.length > MAX_VISIBLE) toasts = toasts.slice(0, MAX_VISIBLE);
  notify();
  const ms = type === "error" ? 6000 : 4000;
  setTimeout(() => {
    toasts = toasts.filter(x => x.id !== t.id);
    notify();
  }, ms);
}

export function useToast() {
  return { toast };
}

function getColors(theme: ReturnType<typeof useTheme>): Record<ToastType, { bg: string; color: string; border: string }> {
  return {
    success: { bg: theme.colors.successLight, color: theme.colors.success, border: theme.colors.success },
    error: { bg: theme.colors.errorLight, color: theme.colors.errorDark, border: theme.colors.errorDark },
    info: { bg: theme.colors.primaryLight, color: theme.colors.primaryDark, border: theme.colors.primaryDark },
  };
}

export function ToastContainer() {
  const theme = useTheme();
  const [, setTick] = useState(0);
  const toastColors = getColors(theme);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  const dismiss = (id: number) => {
    toasts = toasts.filter(x => x.id !== id);
    notify();
  };

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`@keyframes toast-slide-in{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 9999,
        display: "flex", flexDirection: "column-reverse", gap: 8,
        maxWidth: 380,
      }}>
        {toasts.map(t => {
          const c = toastColors[t.type];
          return (
            <div key={t.id} role="alert" aria-live="polite" data-toast-type={t.type} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: theme.radii.md,
              background: c.bg, color: c.color,
              borderLeft: `3px solid ${c.border}`,
              boxShadow: theme.shadows.lg,
              animation: "toast-slide-in 0.25s ease-out",
              fontSize: theme.font.sizes.sm,
            }}>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => dismiss(t.id)}
                style={{
                  border: "none", background: "transparent", color: c.color,
                  cursor: "pointer", fontSize: 16, padding: 0, lineHeight: 1,
                }}
              >
                x
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
