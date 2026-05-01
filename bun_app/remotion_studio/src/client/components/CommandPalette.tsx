import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../theme";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useI18n } from "../i18n";

export interface PaletteItem {
  id: string;
  label: string;
  labelZh?: string;
  icon: string;
  group: string;
}

interface CommandPaletteProps {
  items: PaletteItem[];
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CommandPalette({ items, onSelect, onClose }: CommandPaletteProps) {
  const theme = useTheme();
  const { locale } = useI18n();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.mobile - 1}px)`);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const label = locale === "zh_TW" && item.labelZh ? item.labelZh : item.label;
    return label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      onSelect(filtered[selectedIndex].id);
      onClose();
    }
  }, [filtered, selectedIndex, onSelect, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: theme.colors.bg.overlayLight,
        }}
      />

      {/* Palette */}
      <div
        data-testid="command-palette"
        style={{
          position: "fixed",
          top: isMobile ? "10%" : "20%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          width: "min(480px, 90vw)",
          borderRadius: theme.radii.xl,
          border: `1px solid ${theme.colors.border.default}`,
          background: theme.colors.bg.surface,
          boxShadow: theme.shadows.lg,
          overflow: "hidden",
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderBottom: `1px solid ${theme.colors.border.light}`,
        }}>
          <span style={{ color: theme.colors.text.muted, fontSize: 14 }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: theme.font.sizes.md,
              background: "transparent",
              color: theme.colors.text.primary,
              fontFamily: theme.font.family,
            }}
          />
          <span style={{
            fontSize: theme.font.sizes.xs,
            color: theme.colors.text.faint,
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: theme.radii.sm,
            padding: "1px 5px",
          }}>
            ESC
          </span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 300, overflowY: "auto", padding: "4px 0" }}>
          {filtered.length === 0 && (
            <div style={{
              padding: "16px",
              textAlign: "center" as const,
              color: theme.colors.text.muted,
              fontSize: theme.font.sizes.sm,
            }}>
              No results
            </div>
          )}
          {filtered.map((item, i) => {
            const label = locale === "zh_TW" && item.labelZh ? item.labelZh : item.label;
            const selected = i === selectedIndex;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => { onSelect(item.id); onClose(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: isMobile ? "12px 14px" : "8px 14px",
                  cursor: "pointer",
                  background: selected ? theme.colors.primaryLight : "transparent",
                  borderRadius: 0,
                  transition: "background 0.1s",
                }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: "center" as const }}>
                  {item.icon}
                </span>
                <span style={{
                  fontSize: theme.font.sizes.base,
                  fontWeight: selected ? theme.font.weights.medium : theme.font.weights.normal,
                  color: selected ? theme.colors.primaryDark : theme.colors.text.primary,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: theme.font.sizes.xs,
                  color: theme.colors.text.muted,
                  marginLeft: "auto",
                }}>
                  {item.group}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
