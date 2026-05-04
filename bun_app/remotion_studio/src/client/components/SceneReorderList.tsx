import { useState, useRef, useCallback } from "react";
import { useTheme } from "../theme";
import { useI18n } from "../i18n";

interface PlanSection {
  key: string;
  title: string;
  body: string;
}

interface SceneReorderListProps {
  sections: PlanSection[];
  raw: string;
  onReorder: (newRaw: string) => void;
}

interface SectionBlock {
  title: string;
  content: string;
}

function parseSectionBlocks(raw: string): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  const lines = raw.split("\n");
  let currentTitle = "";
  let currentLines: string[] = [];
  let foundFirst = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (foundFirst) {
        blocks.push({ title: currentTitle, content: currentLines.join("\n") });
      }
      currentTitle = line.slice(3).trim();
      currentLines = [line];
      foundFirst = true;
    } else if (foundFirst) {
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  if (foundFirst) {
    blocks.push({ title: currentTitle, content: currentLines.join("\n") });
  }

  return blocks;
}

function reconstructMarkdown(preamble: string, blocks: SectionBlock[]): string {
  const parts = [preamble.trim()];
  for (const block of blocks) {
    parts.push(block.content.trim());
  }
  return parts.join("\n\n") + "\n";
}

export function SceneReorderList({ sections, raw, onReorder }: SceneReorderListProps) {
  const theme = useTheme();
  const { t } = useI18n();
  const dragIdx = useRef<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sectionTitles = sections.map((s) => s.title);
  const order = localOrder ?? sectionTitles.map((_, i) => i);

  const performReorder = useCallback((fromIdx: number, targetIdx: number, currentOrder: number[]) => {
    if (fromIdx === targetIdx) return;
    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.splice(targetIdx, 0, moved);
    setLocalOrder(newOrder);

    const blocks = parseSectionBlocks(raw);
    const preambleMatch = raw.match(/^([\s\S]*?)(?=\n## )/);
    const preamble = preambleMatch ? preambleMatch[1] : "";

    const reorderedBlocks = newOrder.map((i) => blocks[i]).filter(Boolean);
    const newRaw = reconstructMarkdown(preamble, reorderedBlocks);
    onReorder(newRaw);
  }, [raw, onReorder]);

  // --- Desktop HTML5 DnD ---
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
    dragIdx.current = null;
    setOverIdx(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIdx.current !== null && dragIdx.current !== idx) {
      setOverIdx(idx);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdx.current;
    if (fromIdx === null) return;
    performReorder(fromIdx, targetIdx, order);
    setOverIdx(null);
    dragIdx.current = null;
  }, [order, performReorder]);

  // --- Mobile Touch DnD ---
  const touchIdx = useRef<number | null>(null);
  const touchClone = useRef<HTMLDivElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent, idx: number) => {
    touchIdx.current = idx;
    const touch = e.touches[0];
    const target = e.currentTarget as HTMLElement;

    const clone = target.cloneNode(true) as HTMLDivElement;
    clone.style.position = "fixed";
    clone.style.left = `${target.getBoundingClientRect().left}px`;
    clone.style.top = `${touch.clientY - target.offsetHeight / 2}px`;
    clone.style.width = `${target.offsetWidth}px`;
    clone.style.opacity = "0.85";
    clone.style.zIndex = "9999";
    clone.style.pointerEvents = "none";
    clone.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
    document.body.appendChild(clone);
    touchClone.current = clone;

    target.style.opacity = "0.3";
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (touchIdx.current === null || !touchClone.current || !containerRef.current) return;

    const touch = e.touches[0];
    touchClone.current.style.top = `${touch.clientY - 30}px`;

    const cards = containerRef.current.querySelectorAll<HTMLElement>("[data-reorder-card]");
    let newOverIdx: number | null = null;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        newOverIdx = Number(card.dataset.reorderCard);
      }
    });
    setOverIdx(newOverIdx);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchClone.current) {
      document.body.removeChild(touchClone.current);
      touchClone.current = null;
    }
    // Restore opacity on the source card
    if (containerRef.current && touchIdx.current !== null) {
      const card = containerRef.current.querySelector<HTMLElement>(`[data-reorder-card="${touchIdx.current}"]`);
      if (card) card.style.opacity = "1";
    }

    if (touchIdx.current !== null && overIdx !== null && touchIdx.current !== overIdx) {
      performReorder(touchIdx.current, overIdx, order);
    }
    touchIdx.current = null;
    setOverIdx(null);
  }, [overIdx, order, performReorder]);

  const handleReset = useCallback(() => {
    setLocalOrder(null);
  }, []);

  if (sections.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
        <span style={{ fontSize: theme.font.sizes.sm, color: theme.colors.text.tertiary }}>
          {t.storyEditor.dragHint}
        </span>
        {localOrder && (
          <button
            onClick={handleReset}
            style={{
              fontSize: theme.font.sizes.sm,
              color: theme.colors.primary,
              background: "none",
              border: "none",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {t.storyEditor.resetOrder}
          </button>
        )}
      </div>
      <div style={{ display: "grid", gap: theme.spacing.sm }} ref={containerRef}>
        {order.map((sectionIdx, displayIdx) => {
          const section = sections[sectionIdx];
          return (
            <div
              key={section.key}
              data-reorder-card={displayIdx}
              draggable
              onDragStart={(e) => handleDragStart(e, displayIdx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, displayIdx)}
              onDrop={(e) => handleDrop(e, displayIdx)}
              onTouchStart={(e) => handleTouchStart(e, displayIdx)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.md,
                padding: `${theme.spacing.md}px ${theme.spacing.lg}px`,
                background: overIdx === displayIdx ? theme.colors.primaryLight : theme.colors.bg.surface,
                border: `1px solid ${overIdx === displayIdx ? theme.colors.primary : theme.colors.border.default}`,
                borderRadius: theme.radii.lg,
                cursor: "grab",
                transition: "background 0.15s, border-color 0.15s",
                touchAction: "none",
              }}
            >
              <span style={{
                color: theme.colors.text.tertiary,
                fontSize: theme.font.sizes.lg,
                fontWeight: theme.font.weights.semibold,
                minWidth: 24,
                textAlign: "center",
              }}>
                {displayIdx + 1}
              </span>
              <span style={{ cursor: "grab", color: theme.colors.text.tertiary, fontSize: theme.font.sizes.lg, userSelect: "none" }}>
                {"☰"}
              </span>
              <span style={{ fontWeight: theme.font.weights.semibold, fontSize: theme.font.sizes.md }}>
                {section.title}
              </span>
              <span style={{ color: theme.colors.text.tertiary, fontSize: theme.font.sizes.sm, marginLeft: "auto" }}>
                {section.body.split("\n").filter((l) => l.trim()).length} lines
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
