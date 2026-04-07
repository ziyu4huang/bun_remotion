import { interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "@bun-remotion/shared";

export const LimitScene: React.FC = () => {
  const frame = useCurrentFrame();

  const basePrice = 100;
  const limitUp = 110;
  const limitDown = 90;

  const barProgress = interpolate(frame, [30, 70], [0, 1], { extrapolateRight: "clamp" });
  const W = 480, H = 260;

  const centerY = H / 2;
  const upHeight = (limitUp - basePrice) / (limitUp - limitDown) * H * 0.45;
  const downHeight = (basePrice - limitDown) / (limitUp - limitDown) * H * 0.45;

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
          marginBottom: 44,
        }}
      >
        <div style={{ fontSize: 18, color: "#EF9A9A", letterSpacing: "0.2em", marginBottom: 8 }}>
          CHAPTER 6
        </div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>漲跌停板制度</div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Daily Price Limit ± 10%
        </div>
      </div>

      <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
        {/* Visual gauge */}
        <svg width={W} height={H} style={{ overflow: "visible" }}>
          {/* Down bar */}
          <rect
            x={W / 2 - 40}
            y={centerY}
            width={80}
            height={downHeight * barProgress}
            fill="#26A69A"
            rx={4}
          />
          <text x={W / 2} y={centerY + downHeight + 24} textAnchor="middle" fill="#26A69A" fontSize={18} fontWeight={700}>
            跌停 −10%
          </text>
          <text x={W / 2} y={centerY + downHeight + 46} textAnchor="middle" fill="#26A69A" fontSize={14}>
            {limitDown} 元
          </text>

          {/* Up bar */}
          <rect
            x={W / 2 - 40}
            y={centerY - upHeight * barProgress}
            width={80}
            height={upHeight * barProgress}
            fill="#EF5350"
            rx={4}
          />
          <text x={W / 2} y={centerY - upHeight - 12} textAnchor="middle" fill="#EF5350" fontSize={18} fontWeight={700}>
            漲停 +10%
          </text>
          <text x={W / 2} y={centerY - upHeight - 32} textAnchor="middle" fill="#EF5350" fontSize={14}>
            {limitUp} 元
          </text>

          {/* Base line */}
          <line x1={W / 2 - 70} y1={centerY} x2={W / 2 + 70} y2={centerY} stroke="white" strokeWidth={2} />
          <text x={W / 2} y={centerY + 14} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={14}>
            昨收 {basePrice} 元
          </text>
        </svg>

        {/* Rules */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, width: 420 }}>
          <FadeText
            text="台股每日漲跌幅限制為 ±10%"
            startFrame={30}
            style={{ fontSize: 22, color: "rgba(255,255,255,0.9)" }}
          />
          <FadeText
            text="漲停板（漲停價）= 昨收 × 1.10，無法再更高"
            startFrame={60}
            style={{ fontSize: 20, color: "#EF5350", paddingLeft: 12, borderLeft: "3px solid #EF5350" }}
          />
          <FadeText
            text="跌停板（跌停價）= 昨收 × 0.90，無法再更低"
            startFrame={90}
            style={{ fontSize: 20, color: "#26A69A", paddingLeft: 12, borderLeft: "3px solid #26A69A" }}
          />
          <FadeText
            text="ETF 及部分商品另有不同規則"
            startFrame={120}
            style={{ fontSize: 18, color: "rgba(255,255,255,0.45)" }}
          />
          <FadeText
            text="鎖漲停、鎖跌停 — 大量委託掛在停板，代表強烈趨向信號"
            startFrame={150}
            style={{ fontSize: 18, color: "#FFB74D", paddingLeft: 12, borderLeft: "3px solid #FFB74D" }}
          />
        </div>
      </div>
    </div>
  );
};
