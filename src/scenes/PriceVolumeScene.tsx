import { interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";

const volumeBars = [
  { vol: 3200, price: "up"   },
  { vol: 4800, price: "up"   },
  { vol: 2900, price: "down" },
  { vol: 6100, price: "down" },
  { vol: 2100, price: "down" },
  { vol: 1800, price: "down" },
  { vol: 3400, price: "up"   },
  { vol: 5200, price: "up"   },
  { vol: 7800, price: "up"   },
  { vol: 9100, price: "up"   },
];

const maxVol = Math.max(...volumeBars.map((b) => b.vol));

const rules = [
  { frame: 40,  text: "價漲量增 — 多頭趨勢確認，健康上漲", color: "#EF5350" },
  { frame: 70,  text: "價跌量增 — 空頭力道加強，下跌有效",  color: "#26A69A" },
  { frame: 100, text: "價漲量縮 — 追高動能不足，注意反轉",  color: "#FFB74D" },
  { frame: 130, text: "價跌量縮 — 賣壓遞減，底部可能近了", color: "#64B5F6" },
];

export const PriceVolumeScene: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

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
      <div style={{ opacity: titleOpacity, textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 18, color: "#64B5F6", letterSpacing: "0.2em", marginBottom: 8 }}>
          CHAPTER 2
        </div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>價量關係</div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          Price–Volume Relationship
        </div>
      </div>

      {/* Volume bar chart */}
      <svg width={900} height={200} style={{ opacity: interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" }) }}>
        {volumeBars.map((b, i) => {
          const barH = (b.vol / maxVol) * 180;
          const progress = interpolate(frame - (15 + i * 4), [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const color = b.price === "up" ? "#EF5350" : "#26A69A";
          const x = 10 + i * 88;
          return (
            <g key={i}>
              <rect
                x={x}
                y={200 - barH * progress}
                width={70}
                height={barH * progress}
                fill={color}
                opacity={0.85}
                rx={3}
              />
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={0} y1={199} x2={900} y2={199} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
      </svg>

      {/* Rules */}
      <div style={{ marginTop: 40, width: 900, display: "flex", flexDirection: "column", gap: 14 }}>
        {rules.map((r, i) => (
          <FadeText
            key={i}
            text={r.text}
            startFrame={r.frame}
            style={{
              fontSize: 22,
              color: r.color,
              paddingLeft: 16,
              borderLeft: `3px solid ${r.color}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
