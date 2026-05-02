import { useTheme } from "../theme";
import { Button } from "./Button";

interface ProgressFilterBarProps {
  filter: "all" | "incomplete" | "complete";
  onFilterChange: (f: "all" | "incomplete" | "complete") => void;
  totalCount: number;
  completeCount: number;
  selectedCount: number;
  filteredCount: number;
  isBatching: boolean;
  batchRunning: string | null;
  onSelectAll: () => void;
  onBatchTts: () => void;
  onBatchRender: () => void;
  onRefresh: () => void;
  labels: {
    filterAll: string;
    filterComplete: string;
    filterIncomplete: string;
    selectAll: string;
    deselectAll: string;
    tts: string;
    render: string;
    runningTts: string;
    rendering: string;
    refresh: string;
  };
}

export function ProgressFilterBar({
  filter, onFilterChange, totalCount, completeCount,
  selectedCount, filteredCount, isBatching, batchRunning,
  onSelectAll, onBatchTts, onBatchRender, onRefresh, labels,
}: ProgressFilterBarProps) {
  const theme = useTheme();
  const hasSelection = selectedCount > 0;

  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
      {(["all", "incomplete", "complete"] as const).map((f) => (
        <Button key={f} variant="outline" size="sm" onClick={() => onFilterChange(f)}>
          {f === "all" ? `${labels.filterAll} (${totalCount})`
            : f === "complete" ? `${labels.filterComplete} (${completeCount})`
            : `${labels.filterIncomplete} (${totalCount - completeCount})`}
        </Button>
      ))}
      <Button onClick={onSelectAll} variant="ghost" size="sm">
        {selectedCount === filteredCount ? labels.deselectAll : labels.selectAll}
      </Button>
      {hasSelection && (
        <>
          <Button onClick={onBatchTts} disabled={isBatching}
            variant="primary" size="sm" style={{ marginLeft: "auto" }}>
            {batchRunning === "tts" ? labels.runningTts : `${labels.tts} ${selectedCount}`}
          </Button>
          <Button onClick={onBatchRender} disabled={isBatching}
            variant="primary" size="sm">
            {batchRunning === "render" ? labels.rendering : `${labels.render} ${selectedCount}`}
          </Button>
        </>
      )}
      <Button onClick={onRefresh} disabled={isBatching} variant="ghost" size="sm"
        style={{ marginLeft: hasSelection ? 8 : "auto" }}>
        {labels.refresh}
      </Button>
    </div>
  );
}
