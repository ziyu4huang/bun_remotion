import { interpolate, useCurrentFrame } from "remotion";
import { FadeText } from "../components/FadeText";

const timelineItems = [
  { time: "08:30",  label: "盤前試撮",    desc: "集合競價，試算開盤參考價",   color: "#64B5F6",  frame: 20 },
  { time: "09:00",  label: "正式開盤",    desc: "逐筆撮合交易正式開始",       color: "#EF5350",  frame: 50 },
  { time: "09:00–13:25", label: "盤中交易", desc: "連續撮合，即時成交",      color: "#FFB74D",  frame: 80 },
  { time: "13:25",  label: "盤中最後撮合", desc: "最後五分鐘集合競價準備",   color: "#CE93D8",  frame: 110 },
  { time: "13:30",  label: "收盤集合競價", desc: "5 分鐘集合競價決定收盤價", color: "#26A69A",  frame: 140 },
  { time: "13:33",  label: "盤後交易",    desc: "以收盤價買賣，下午延伸",     color: "#A5D6A7",  frame: 170 },
];

export const TradingHoursScene: React.FC = () => {
  const frame = useCurrentFrame();

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
          marginBottom: 48,
        }}
      >
        <div style={{ fontSize: 18, color: "#A5D6A7", letterSpacing: "0.2em", marginBottom: 8 }}>
          CHAPTER 5
        </div>
        <div style={{ fontSize: 56, fontWeight: 700 }}>交易時間</div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
          TWSE Trading Hours
        </div>
      </div>

      <div style={{ width: 860, display: "flex", flexDirection: "column", gap: 0 }}>
        {timelineItems.map((item, i) => {
          const opacity = interpolate(frame - item.frame, [0, 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateX = interpolate(frame - item.frame, [0, 20], [-30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                opacity,
                transform: `translateX(${translateX}px)`,
                paddingBottom: 20,
              }}
            >
              {/* Timeline dot and line */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 20 }}>
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: item.color,
                    flexShrink: 0,
                    marginTop: 4,
                  }}
                />
                {i < timelineItems.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: "rgba(255,255,255,0.12)", marginTop: 4 }} />
                )}
              </div>

              {/* Content */}
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                    {item.time}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 600 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <FadeText
        text="注意：週一至週五，台灣證券交易所 (TWSE) 及店頭市場 (TPEx) 同步開盤"
        startFrame={200}
        style={{
          fontSize: 18,
          color: "rgba(255,255,255,0.45)",
          marginTop: 20,
          width: 860,
          textAlign: "center",
        }}
      />
    </div>
  );
};
