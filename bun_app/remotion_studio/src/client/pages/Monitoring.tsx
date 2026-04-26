import { useEffect, useState } from "react";
import { api } from "../api";
import type { MonitoringOverview, SeriesHealth, ActivityEntry } from "../../shared/types";

export function Monitoring() {
  const [overview, setOverview] = useState<MonitoringOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMonitoringOverview().then((r) => {
      if (r.ok && r.data) setOverview(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ color: "#666" }}>Loading monitoring data...</div>;
  if (!overview) return <div style={{ color: "#c62828" }}>Failed to load monitoring data</div>;

  return (
    <div>
      <h1 style={{ margin: "0 0 20px" }}>Monitoring</h1>

      {/* Summary Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <SummaryCard label="Series" value={overview.totalSeries} />
        <SummaryCard label="Episodes" value={overview.totalEpisodes} />
        <SummaryCard label="Scaffolded" value={overview.totalScaffolded} />
        <SummaryCard label="Rendered" value={overview.totalRendered} />
        <SummaryCard label="Completion" value={`${overview.overallCompletionRate}%`} />
        <SummaryCard label="Avg Gate" value={overview.avgGateScore != null ? `${overview.avgGateScore}/100` : "N/A"} />
        <SummaryCard label="Avg Blended" value={overview.avgBlendedScore != null ? `${overview.avgBlendedScore}%` : "N/A"} />
      </div>

      {/* Series Health Table */}
      <section style={{ marginBottom: 32 }}>
        <h3>Series Health</h3>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Series</th>
              <th style={th}>Category</th>
              <th style={th}>Episodes</th>
              <th style={th}>Progress</th>
              <th style={th}>Gate</th>
              <th style={th}>Blended</th>
              <th style={th}>Decision</th>
              <th style={th}>Graph</th>
              <th style={th}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {overview.seriesHealth.map((h) => (
              <tr key={h.seriesId}>
                <td style={td}>{h.name}</td>
                <td style={td}><span style={badgeStyle(h.category)}>{h.category}</span></td>
                <td style={td}>{h.renderedCount}/{h.episodeCount}</td>
                <td style={td}><CompletionBar rate={h.completionRate} /></td>
                <td style={td}>{h.gateScore != null ? h.gateScore : "—"}</td>
                <td style={td}>{h.blendedScore != null ? `${h.blendedScore}%` : "—"}</td>
                <td style={td}>{h.qualityDecision ? <DecisionBadge decision={h.qualityDecision} /> : "—"}</td>
                <td style={td}>{h.nodeCount}n/{h.edgeCount}e/{h.communityCount}c</td>
                <td style={td}><TrendIndicator trend={h.trend} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recent Activity */}
      <section>
        <h3>Recent Activity</h3>
        {overview.recentActivity.length === 0 ? (
          <div style={{ color: "#666" }}>No activity recorded</div>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={th}>Time</th>
                <th style={th}>Series</th>
                <th style={th}>Type</th>
                <th style={th}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {overview.recentActivity.map((a, i) => (
                <ActivityRow key={i} entry={a} />
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      padding: "12px 20px",
      borderRadius: 8,
      background: "#f5f5f5",
      minWidth: 100,
    }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function CompletionBar({ rate }: { rate: number }) {
  const color = rate >= 80 ? "#4caf50" : rate >= 40 ? "#ff9800" : "#f44336";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 60, height: 6, background: "#e0e0e0", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${rate}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12 }}>{rate}%</span>
    </div>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const colors: Record<string, string> = {
    PASS: "#c8e6c9",
    WARN: "#fff9c4",
    FAIL: "#ffcdd2",
    ACCEPT: "#c8e6c9",
  };
  return (
    <span style={{
      padding: "2px 8px",
      borderRadius: 10,
      fontSize: 12,
      background: colors[decision] ?? "#e0e0e0",
    }}>
      {decision}
    </span>
  );
}

function TrendIndicator({ trend }: { trend: SeriesHealth["trend"] }) {
  const config: Record<string, { symbol: string; color: string }> = {
    improving: { symbol: "↑", color: "#2e7d32" },
    stable: { symbol: "→", color: "#666" },
    declining: { symbol: "↓", color: "#c62828" },
    new: { symbol: "★", color: "#1565c0" },
  };
  const c = config[trend] ?? config.stable;
  return <span style={{ color: c.color, fontWeight: 600 }}>{c.symbol} {trend}</span>;
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const typeColors: Record<string, string> = {
    pipeline: "#1565c0",
    render: "#6a1b9a",
    scaffold: "#2e7d32",
  };
  const time = new Date(entry.timestamp).toLocaleString();
  return (
    <tr>
      <td style={td}>{time}</td>
      <td style={td}>{entry.seriesId}</td>
      <td style={td}>
        <span style={{ color: typeColors[entry.type] ?? "#666", fontWeight: 500 }}>{entry.type}</span>
      </td>
      <td style={td}>{entry.detail}</td>
    </tr>
  );
}

function badgeStyle(category: string): React.CSSProperties {
  return {
    padding: "2px 8px",
    borderRadius: 10,
    fontSize: 11,
    background: "#e3f2fd",
    whiteSpace: "nowrap",
  };
}

const th: React.CSSProperties = { textAlign: "left", padding: 8, borderBottom: "2px solid #e0e0e0", fontSize: 13 };
const td: React.CSSProperties = { padding: 8, borderBottom: "1px solid #f0f0f0", fontSize: 13 };
