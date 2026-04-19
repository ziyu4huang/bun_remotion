/**
 * Tech explainer scene templates for episodeforge.
 *
 * Scenes: Title, Problem, Architecture, Feature×N, Demo, Comparison, Outro
 * Audio: single narrator (no character voices)
 */

import type { SeriesConfig } from "./series-config";
import type { NamingContext } from "./naming";
import type { ScaffoldContext } from "./templates";
import { getSceneNames } from "./templates";

// ─── TitleScene (tech explainer) ─────────────────────────────────────────────────

export function genTechTitleScene(ctx: ScaffoldContext): string {
  const { config, naming } = ctx;
  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { notoSansTC } from "${config.charactersImportPath}";

// TODO: Update title and tagline
const TITLE = "${config.displayName}";
const TAGLINE = "任何輸入 → 知識圖譜";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleX = interpolate(frame, [10, 40], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineY = interpolate(frame, [40, 60], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const taglineOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [20, 50], [0, 500], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        opacity: fadeOut,
      }}
    >
      {/* Grid background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />

      {/* Title */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: \`translateX(-50%) translateX(\${titleX}px)\`,
        opacity: titleOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "monospace",
          fontSize: 96,
          fontWeight: 900,
          color: "#e2e8f0",
          textShadow: "0 0 40px rgba(59,130,246,0.5)",
          letterSpacing: "0.05em",
        }}>
          {TITLE}
        </div>

        <div style={{
          width: lineWidth,
          height: 2,
          background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
          margin: "24px auto 0",
        }} />
      </div>

      {/* Tagline */}
      <div style={{
        position: "absolute",
        top: "52%",
        left: "50%",
        transform: \`translateX(-50%) translateY(\${taglineY}px)\`,
        opacity: taglineOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: notoSansTC,
          fontSize: 40,
          color: "#94a3b8",
          fontWeight: 500,
          letterSpacing: "0.15em",
        }}>
          {TAGLINE}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── ProblemScene ────────────────────────────────────────────────────────────────

export function genProblemScene(_ctx: ScaffoldContext): string {
  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// TODO: Update pain point text
const PAIN_POINT = "文件散落各處，程式碼、論文、對話記錄……資訊碎片化，找不到關聯";

const SCATTERED_ITEMS = [
  { text: "程式碼", x: 200, y: 300, delay: 10 },
  { text: "文件", x: 600, y: 250, delay: 20 },
  { text: "論文", x: 1000, y: 350, delay: 30 },
  { text: "對話", x: 400, y: 500, delay: 40 },
  { text: "筆記", x: 800, y: 450, delay: 50 },
  { text: "???", x: 1200, y: 300, delay: 60 },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #1a0a0a 0%, #2d1010 50%, #1a0a0a 100%)",
      opacity: fadeOut,
    }}>
      {/* Scattered items */}
      {SCATTERED_ITEMS.map((item, i) => {
        const itemOpacity = interpolate(frame, [item.delay, item.delay + 15], [0, 0.8], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const shake = frame > item.delay + 30 ? Math.sin((frame - item.delay) * 0.3) * 5 : 0;
        return (
          <div key={i} style={{
            position: "absolute",
            left: item.x,
            top: item.y,
            opacity: itemOpacity,
            transform: \`translateX(\${shake}px)\`,
            fontFamily: "monospace",
            fontSize: 32,
            color: "#ef4444",
            padding: "12px 20px",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8,
            background: "rgba(239,68,68,0.1)",
          }}>
            {item.text}
          </div>
        );
      })}

      {/* Pain point text */}
      <div style={{
        position: "absolute",
        bottom: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: interpolate(frame, [80, 100], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 36,
          color: "#fca5a5",
          fontWeight: 700,
          maxWidth: 1200,
          lineHeight: 1.8,
        }}>
          {PAIN_POINT}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── ArchitectureScene ───────────────────────────────────────────────────────────

export function genArchitectureScene(_ctx: ScaffoldContext): string {
  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// TODO: Update pipeline stages
const PIPELINE = [
  { name: "輸入", icon: "📥", desc: "程式碼、文件、論文" },
  { name: "解析", icon: "🔬", desc: "AST + NLP 雙通道" },
  { name: "建圖", icon: "🕸️", desc: "節點 + 邊 + 關聯" },
  { name: "聚類", icon: "🔮", desc: "社群偵測 + PageRank" },
  { name: "輸出", icon: "📊", desc: "HTML + JSON + 稽核" },
];

const STAGE_WIDTH = 300;
const STAGE_GAP = 40;
const TOTAL_WIDTH = PIPELINE.length * STAGE_WIDTH + (PIPELINE.length - 1) * STAGE_GAP;
const START_X = (1920 - TOTAL_WIDTH) / 2;

export const ArchitectureScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      opacity: fadeOut,
    }}>
      <div style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
      }}>
        {PIPELINE.map((stage, i) => {
          const stageDelay = 30 + i * 30;
          const stageOpacity = interpolate(frame, [stageDelay, stageDelay + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const stageY = interpolate(frame, [stageDelay, stageDelay + 20], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });

          return (
            <React.Fragment key={i}>
              {/* Arrow between stages */}
              {i > 0 && (
                <div style={{
                  width: STAGE_GAP,
                  textAlign: "center",
                  opacity: stageOpacity,
                  color: "#3b82f6",
                  fontSize: 24,
                }}>
                  →
                </div>
              )}

              <div style={{
                width: STAGE_WIDTH,
                opacity: stageOpacity,
                transform: \`translateY(\${stageY}px)\`,
                textAlign: "center",
                padding: 24,
                border: "1px solid rgba(59,130,246,0.3)",
                borderRadius: 12,
                background: "rgba(59,130,246,0.05)",
              }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>{stage.icon}</div>
                <div style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#e2e8f0",
                  marginBottom: 4,
                }}>
                  {stage.name}
                </div>
                <div style={{
                  fontSize: 16,
                  color: "#94a3b8",
                }}>
                  {stage.desc}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── FeatureScene (repeatable ×N) ────────────────────────────────────────────────

export function genFeatureScene(ctx: ScaffoldContext, sceneIndex: number): string {
  const featureNames = ["程式碼 AST 分析", "聯邦故事知識圖譜", "品質評分系統"];
  const featureDescs = [
    "tree-sitter 解析 → 符號萃取 → 呼叫關聯圖",
    "多集合併 + 跨集連結發現 + 角色弧線追蹤",
    "5 維度自動評分：節點密度、圖完整性、敘事弧線、幽默演化、主題一致性",
  ];
  const name = featureNames[sceneIndex - 1] ?? `Feature ${sceneIndex}`;
  const desc = featureDescs[sceneIndex - 1] ?? "TODO: feature description";

  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

const FEATURE_NAME = "${name}";
const FEATURE_DESC = "${desc}";

export const FeatureScene${sceneIndex}: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const titleX = interpolate(frame, [15, 35], [-60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleOpacity = interpolate(frame, [15, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const descOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      opacity: fadeOut,
    }}>
      {/* Feature number badge */}
      <div style={{
        position: "absolute",
        top: "12%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: titleOpacity,
      }}>
        <div style={{
          fontSize: 18,
          color: "#3b82f6",
          fontWeight: 700,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
        }}>
          Feature ${sceneIndex}
        </div>
      </div>

      {/* Feature title */}
      <div style={{
        position: "absolute",
        top: "22%",
        left: "50%",
        transform: \`translateX(-50%) translateX(\${titleX}px)\`,
        opacity: titleOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 64,
          fontWeight: 900,
          color: "#e2e8f0",
          textShadow: "0 0 30px rgba(59,130,246,0.3)",
        }}>
          {FEATURE_NAME}
        </div>
      </div>

      {/* Feature description */}
      <div style={{
        position: "absolute",
        top: "45%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: descOpacity,
        textAlign: "center",
        maxWidth: 1000,
      }}>
        <div style={{
          fontSize: 28,
          color: "#94a3b8",
          lineHeight: 2,
        }}>
          {FEATURE_DESC}
        </div>
      </div>

      {/* TODO: Add visual — diagram, icon, or code snippet */}
    </AbsoluteFill>
  );
};
`;
}

// ─── DemoScene ───────────────────────────────────────────────────────────────────

export function genDemoScene(_ctx: ScaffoldContext): string {
  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// TODO: Update demo steps
const DEMO_STEPS = [
  "$ bun run graphify-episode — 分析單集",
  "$ bun run graphify-merge — 聯邦合併",
  "$ bun run graphify-check — 品質評分",
  "$ bun run graphify-compare — 跨集比較",
];

export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      opacity: fadeOut,
    }}>
      {/* Terminal window */}
      <div style={{
        position: "absolute",
        top: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 1200,
        background: "rgba(0,0,0,0.8)",
        borderRadius: 12,
        border: "1px solid rgba(59,130,246,0.2)",
        overflow: "hidden",
      }}>
        {/* Terminal header */}
        <div style={{
          padding: "12px 16px",
          background: "rgba(30,41,59,0.8)",
          display: "flex",
          gap: 8,
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
        </div>

        {/* Terminal body */}
        <div style={{ padding: 24 }}>
          {DEMO_STEPS.map((step, i) => {
            const stepDelay = 20 + i * 40;
            const stepOpacity = interpolate(frame, [stepDelay, stepDelay + 15], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={i} style={{
                opacity: stepOpacity,
                fontFamily: "monospace",
                fontSize: 22,
                color: "#22c55e",
                marginBottom: 16,
              }}>
                {step}
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── ComparisonScene ─────────────────────────────────────────────────────────────

export function genComparisonScene(_ctx: ScaffoldContext): string {
  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

// TODO: Update comparison text
const BEFORE = "手動整理筆記，花 2 小時找關聯";
const AFTER = "storygraph 一鍵生成知識圖譜，30 秒看到全貌";

export const ComparisonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const beforeOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beforeX = interpolate(frame, [10, 30], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const arrowOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const afterOpacity = interpolate(frame, [70, 85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const afterX = interpolate(frame, [70, 90], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      opacity: fadeOut,
    }}>
      {/* Before */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "10%",
        opacity: beforeOpacity,
        transform: \`translateX(\${beforeX}px)\`,
        maxWidth: 600,
      }}>
        <div style={{
          fontSize: 20,
          color: "#ef4444",
          fontWeight: 700,
          marginBottom: 16,
          letterSpacing: "0.2em",
        }}>
          ❌ BEFORE
        </div>
        <div style={{
          fontSize: 28,
          color: "#fca5a5",
          lineHeight: 1.8,
        }}>
          {BEFORE}
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        position: "absolute",
        top: "40%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: arrowOpacity,
        fontSize: 60,
        color: "#3b82f6",
      }}>
        →
      </div>

      {/* After */}
      <div style={{
        position: "absolute",
        top: "30%",
        right: "10%",
        opacity: afterOpacity,
        transform: \`translateX(\${afterX}px)\`,
        maxWidth: 600,
        textAlign: "right",
      }}>
        <div style={{
          fontSize: 20,
          color: "#22c55e",
          fontWeight: 700,
          marginBottom: 16,
          letterSpacing: "0.2em",
        }}>
          ✅ AFTER
        </div>
        <div style={{
          fontSize: 28,
          color: "#86efac",
          lineHeight: 1.8,
        }}>
          {AFTER}
        </div>
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── OutroScene (tech explainer) ─────────────────────────────────────────────────

export function genTechOutroScene(ctx: ScaffoldContext): string {
  return `import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { notoSansTC } from "${ctx.config.charactersImportPath}";

// TODO: Update CTA and links
const CTA = "Star on GitHub";
const LINKS = ["github.com/storygraph"];

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const ctaScale = interpolate(frame, [20, 40], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(0.5)),
  });
  const ctaOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const linksOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      opacity: fadeOut,
    }}>
      {/* CTA */}
      <div style={{
        position: "absolute",
        top: "30%",
        left: "50%",
        transform: \`translateX(-50%) scale(\${ctaScale})\`,
        opacity: ctaOpacity,
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 56,
          fontWeight: 900,
          color: "#e2e8f0",
          textShadow: "0 0 30px rgba(59,130,246,0.4)",
          marginBottom: 24,
        }}>
          {CTA}
        </div>

        <div style={{
          width: 300,
          height: 3,
          background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
          margin: "0 auto",
        }} />
      </div>

      {/* Links */}
      <div style={{
        position: "absolute",
        top: "55%",
        left: "50%",
        transform: "translateX(-50%)",
        opacity: linksOpacity,
        textAlign: "center",
      }}>
        {LINKS.map((link, i) => (
          <div key={i} style={{
            fontFamily: "monospace",
            fontSize: 28,
            color: "#3b82f6",
            marginBottom: 12,
          }}>
            {link}
          </div>
        ))}
      </div>

      {/* Logo / project name */}
      <div style={{
        position: "absolute",
        bottom: 60,
        left: "50%",
        transform: "translateX(-50%)",
        fontFamily: "monospace",
        fontSize: 20,
        color: "#475569",
        letterSpacing: "0.15em",
      }}>
        ${ctx.config.displayName}
      </div>
    </AbsoluteFill>
  );
};
`;
}

// ─── Main Component (tech explainer) ─────────────────────────────────────────────

export function genTechMainComponent(ctx: ScaffoldContext): string {
  const { naming, config } = ctx;
  const { compositionId } = naming;

  const sceneNames = getSceneNames(ctx);

  // Audio file names
  const audioNames = sceneNames.map((name, i) => {
    const num = String(i + 1).padStart(2, "0");
    if (i === 0) return `${num}-title.wav`;
    if (i === sceneNames.length - 1) return `${num}-outro.wav`;
    return `${num}-${name.replace("Scene", "").toLowerCase()}.wav`;
  });

  // Scene labels for name prop
  const sceneLabels = sceneNames.map(s => s.replace("Scene", ""));

  // Build scene entries
  const sceneEntries = sceneNames.map((name, i) =>
    `  { Scene: ${name}, audio: "audio/${audioNames[i]}" },`
  ).join("\n");

  // Scene imports
  const sceneImports = sceneNames.map(name =>
    `import { ${name} } from "./scenes/${name}";`
  ).join("\n");

  // Transitions
  const transitionEntries = config.transitions
    .map(t => `  ${t.usage},`)
    .join("\n");

  const transitionImports = new Map<string, string>();
  for (const t of config.transitions) {
    transitionImports.set(t.from, t.importName);
  }
  const transitionImportLines = [...transitionImports.entries()]
    .map(([from, name]) => `import { ${name} } from "${from}";`)
    .join("\n");

  return `import React from "react";
import { AbsoluteFill, Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
${transitionImportLines}
import type { Props } from "./Root";
${sceneImports}

const TRANSITION_FRAMES = 15;

const sceneNames = [${sceneLabels.map(l => `"${l}"`).join(", ")}] as const;

const scenes = [
${sceneEntries}
];

const transitions = [
${transitionEntries}
];

export const ${compositionId}: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 210;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f172a" }}>
      <TransitionSeries>
        {scenes.map(({ Scene, audio }, i) => (
          <React.Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={d(i)} name={sceneNames[i]}>
              <Scene />
              <Audio src={staticFile(audio)} volume={1} />
            </TransitionSeries.Sequence>

            {i < transitions.length && (
              <TransitionSeries.Transition
                presentation={transitions[i % transitions.length]}
                timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
              />
            )}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
`;
}
