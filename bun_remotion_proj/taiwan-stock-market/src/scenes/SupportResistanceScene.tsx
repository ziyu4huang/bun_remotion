import { interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../../../shared/src";

// Price data that bounces off support and hits resistance
const prices = [106,103,100,98,100,103,106,109,107,105,102,100,101,104,107,110,108,106,103,100];

export const SupportResistanceScene: React.FC = () => {
  const frame = useCurrentFrame();

  const supportLevel = 100;
  const resistanceLevel = 110;
  const minP = 96, maxP = 114;
  const W = 900, H = 280;
  const toY = (p: number) => H - ((p - minP) / (maxP - minP)) * H;

  const lineProgress = interpolate(frame, [20, 60], [0, 1], { extrapolateRight: "clamp" });
  const visiblePoints = Math.floor(
    interpolate(frame, [15, 60], [0, prices.length], { extrapolateRight: "clamp" })
  );

  const stepX = W / (prices.length - 1);
  const pathD = prices
    .slice(0, visiblePoints + 1)
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${toY(p)}`)
    .join(" ");

  const supportY = toY(supportLevel);
  const resistY = toY(resistanceLevel);

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
        <div style={{ fontSize: 18, color: "#FFB74D", letterSpacing: "0.2em", marginBottom: 8 }}>
          CHAPTER 3
        </div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>支撐與壓力</div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Support &amp; Resistance
        </div>
      </div>

      <svg width={W} height={H + 20} style={{ overflow: "visible" }}>
        {/* Resistance line */}
        <line
          x1={0}
          y1={resistY}
          x2={W * lineProgress}
          y2={resistY}
          stroke="#EF5350"
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={0.9}
        />
        <text x={W * lineProgress - 2} y={resistY - 8} fill="#EF5350" fontSize={16} textAnchor="end">
          壓力線 {resistanceLevel}
        </text>

        {/* Support line */}
        <line
          x1={0}
          y1={supportY}
          x2={W * lineProgress}
          y2={supportY}
          stroke="#26A69A"
          strokeWidth={2}
          strokeDasharray="8 4"
          opacity={0.9}
        />
        <text x={W * lineProgress - 2} y={supportY + 20} fill="#26A69A" fontSize={16} textAnchor="end">
          支撐線 {supportLevel}
        </text>

        {/* Price path */}
        {visiblePoints > 0 && (
          <path
            d={pathD}
            fill="none"
            stroke="#64B5F6"
            strokeWidth={2.5}
          />
        )}

        {/* Touch point dots */}
        {prices.slice(0, visiblePoints + 1).map((p, i) => {
          const isTouch =
            Math.abs(p - supportLevel) < 1.5 || Math.abs(p - resistanceLevel) < 1.5;
          if (!isTouch) return null;
          const dotColor = p <= supportLevel + 1.5 ? "#26A69A" : "#EF5350";
          return (
            <circle key={i} cx={i * stepX} cy={toY(p)} r={7} fill={dotColor} opacity={0.9} />
          );
        })}
      </svg>

      <div style={{ marginTop: 36, width: W, display: "flex", flexDirection: "column", gap: 14 }}>
        <FadeText
          text="支撐線 — 價格下跌時反覆止跌的水平，買盤集中帶"
          startFrame={60}
          style={{ fontSize: 22, color: "#26A69A", paddingLeft: 16, borderLeft: "3px solid #26A69A" }}
        />
        <FadeText
          text="壓力線 — 價格上漲時反覆受阻的水平，賣盤集中帶"
          startFrame={90}
          style={{ fontSize: 22, color: "#EF5350", paddingLeft: 16, borderLeft: "3px solid #EF5350" }}
        />
        <FadeText
          text="突破壓力 → 舊壓變新撐；跌破支撐 → 舊撐變新壓"
          startFrame={120}
          style={{ fontSize: 22, color: "#FFB74D", paddingLeft: 16, borderLeft: "3px solid #FFB74D" }}
        />
      </div>
    </div>
  );
};
