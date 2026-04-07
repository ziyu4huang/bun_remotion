import { interpolate, useCurrentFrame } from "remotion";
import { CandleChart } from "../components/CandleChart";
import { FadeText } from "../components/FadeText";

// Sample K-line data showing classic patterns
const candles = [
  { open: 100, high: 104, low: 98,  close: 103 },
  { open: 103, high: 107, low: 101, close: 106 },
  { open: 106, high: 108, low: 103, close: 104 },
  { open: 104, high: 106, low: 98,  close: 99  },
  { open: 99,  high: 101, low: 95,  close: 96  },
  { open: 96,  high: 97,  low: 92,  close: 93  },
  { open: 93,  high: 96,  low: 91,  close: 95  },
  { open: 95,  high: 99,  low: 94,  close: 98  },
  { open: 98,  high: 103, low: 97,  close: 102 },
  { open: 102, high: 108, low: 101, close: 107 },
];

const annotations = [
  { frame: 30,  text: "陽線 (紅K) — 收盤 > 開盤，買方強勢", color: "#EF5350" },
  { frame: 60,  text: "陰線 (黑K) — 收盤 < 開盤，賣方強勢", color: "#26A69A" },
  { frame: 90,  text: "上影線 — 日內高點受壓，遇阻回落",      color: "#FFB74D" },
  { frame: 120, text: "下影線 — 日內低點有支撐，守穩反彈",    color: "#64B5F6" },
];

export const KLineScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const chartOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 60,
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      {/* Section header */}
      <div style={{ opacity: titleOpacity, textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 18, color: "#EF5350", letterSpacing: "0.2em", marginBottom: 8 }}>
          CHAPTER 1
        </div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>K 線基礎</div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Candlestick Fundamentals
        </div>
      </div>

      {/* Chart */}
      <div style={{ opacity: chartOpacity }}>
        <CandleChart candles={candles} startRevealFrame={20} width={900} height={300} />
      </div>

      {/* Annotations */}
      <div style={{ marginTop: 48, width: 900, display: "flex", flexDirection: "column", gap: 12 }}>
        {annotations.map((a, i) => (
          <FadeText
            key={i}
            text={a.text}
            startFrame={a.frame}
            style={{
              fontSize: 22,
              color: a.color,
              paddingLeft: 16,
              borderLeft: `3px solid ${a.color}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
