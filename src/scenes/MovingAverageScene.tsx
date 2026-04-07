import { interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";

// 20 price points
const rawPrices = [98,100,103,101,99,102,105,108,107,110,112,109,111,114,116,113,115,118,120,117];

function sma(data: number[], period: number): (number | null)[] {
  return data.map((_, i) =>
    i < period - 1 ? null : data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
  );
}

const ma5  = sma(rawPrices, 5);
const ma10 = sma(rawPrices, 10);

export const MovingAverageScene: React.FC = () => {
  const frame = useCurrentFrame();

  const W = 900, H = 280;
  const minP = 94, maxP = 124;
  const toY = (p: number) => H - ((p - minP) / (maxP - minP)) * H;
  const stepX = W / (rawPrices.length - 1);

  const visiblePoints = Math.floor(
    interpolate(frame, [20, 70], [1, rawPrices.length], { extrapolateRight: "clamp" })
  );

  const makePath = (data: (number | null)[]) => {
    const pts = data
      .slice(0, visiblePoints + 1)
      .map((v, i) => (v !== null ? `${i === 0 || data[i - 1] === null ? "M" : "L"} ${i * stepX} ${toY(v)}` : null))
      .filter(Boolean);
    return pts.join(" ");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0d1117",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 60,
        fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        color: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        <div style={{ fontSize: 18, color: "#CE93D8", letterSpacing: "0.2em", marginBottom: 8 }}>
          CHAPTER 4
        </div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>均線系統</div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Moving Average System
        </div>
      </div>

      <svg width={W} height={H + 20} style={{ overflow: "visible" }}>
        {/* Price line */}
        <path
          d={rawPrices
            .slice(0, visiblePoints + 1)
            .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${toY(p)}`)
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1.5}
        />
        {/* MA5 */}
        <path
          d={makePath(ma5)}
          fill="none"
          stroke="#FFB74D"
          strokeWidth={2.5}
        />
        {/* MA10 */}
        <path
          d={makePath(ma10)}
          fill="none"
          stroke="#64B5F6"
          strokeWidth={2.5}
        />

        {/* Golden Cross marker */}
        {(() => {
          const crossIdx = 9;
          if (visiblePoints < crossIdx) return null;
          const x = crossIdx * stepX;
          const y = toY(ma10[crossIdx] ?? 0);
          const opacity = interpolate(frame - 55, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <g opacity={opacity}>
              <circle cx={x} cy={y} r={10} fill="#FFD700" opacity={0.3} />
              <circle cx={x} cy={y} r={5} fill="#FFD700" />
              <text x={x + 14} y={y - 10} fill="#FFD700" fontSize={14} fontWeight={700}>
                黃金交叉
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 32, marginTop: 12 }}>
        {[
          { color: "#FFB74D", label: "MA5 (週線)" },
          { color: "#64B5F6", label: "MA10 (雙週線)" },
          { color: "rgba(255,255,255,0.3)", label: "收盤價" },
        ].map((l) => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 3, background: l.color, borderRadius: 2 }} />
            <span style={{ fontSize: 16, color: "rgba(255,255,255,0.7)" }}>{l.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 36, width: W, display: "flex", flexDirection: "column", gap: 14 }}>
        <FadeText
          text="均線代表一段期間的平均成本，反映市場共識價位"
          startFrame={70}
          style={{ fontSize: 22, color: "rgba(255,255,255,0.85)", paddingLeft: 16, borderLeft: "3px solid #CE93D8" }}
        />
        <FadeText
          text="黃金交叉 — 短期均線由下向上穿越長期均線，買進訊號"
          startFrame={100}
          style={{ fontSize: 22, color: "#FFD700", paddingLeft: 16, borderLeft: "3px solid #FFD700" }}
        />
        <FadeText
          text="死亡交叉 — 短期均線由上向下穿越長期均線，賣出訊號"
          startFrame={130}
          style={{ fontSize: 22, color: "#B0BEC5", paddingLeft: 16, borderLeft: "3px solid #B0BEC5" }}
        />
      </div>
    </div>
  );
};
