import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { SystemNotification } from "../../../fixture/components/SystemOverlay";
import { notoSansTC } from "../../../fixture/characters";
import type { DialogLine, ComicEffect } from "../../../fixture/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * JokeScene2 — AI 回訊息翻車
 * Segments: 1 narrator + 11 dialog = 12 total
 * isDialog: [false, true, true, true, true, true, true, true, true, true, true, true]
 */
const SEGMENT_IS_DIALOG = [false, true, true, true, true, true, true, true, true, true, true, true];

const dialogLines: DialogLine[] = [
  { character: "xiaoxue", text: "好了！我設定了 AI 自動回訊息。以後再也不用煩惱要回什麼了！", effect: "sparkle" },
  { character: "xiaoyue", text: "你確定？上次你用自動回覆，跟你媽說「收到，感謝您的反饋」。", effect: "laugh" },
  { character: "xiaoxue", text: "那是意外！我重新訓練過了。現在它會模仿我的語氣。" },
  { character: "xiaoying", text: "小雪……你 AI 剛才回了我一個「好的呢～♡」。" },
  { character: "xiaoxue", text: "怎麼了？那是我平常的語氣啊。" },
  { character: "xiaoying", text: "可是你剛才問我「今天晚上吃什麼」。" },
  { character: "xiaoxue", text: "……", effect: "dots" },
  { character: "xiaoyue", text: "你的 AI 比你還有禮貌。它甚至會加「辛苦了」。" },
  { character: "xiaoxue", text: "最慘的是，我男友說他比較喜歡 AI 回的訊息。", effect: "cry" },
  { character: "xiaoying", text: "……那是不是代表，你的存在被 AI 取代了？" },
  { character: "xiaoxue", text: "小樱！你不准說實話！", effect: "anger", sfx: [{ text: "暴擊！", x: 400, y: 300, color: "#F472B6", rotation: -5, fontSize: 100, font: "action" }] },
];

export const JokeScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { lineIndex: segLineIdx, lineFrame: segLineFrame } = getSegmentTiming(frame, "JokeScene2", SEGMENT_IS_DIALOG);
  const currentLineIndex = segLineIdx >= 0 ? Math.min(segLineIdx, dialogLines.length - 1) : 0;
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);
  const currentSfx = currentLine.sfx ?? [];

  // Scene title indicator fade
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // AI notification timing — appears when xiaoxue talks about AI auto-reply
  const aiNotifFrame = (1 / dialogLines.length) * durationInFrames;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="cafe.png" />

      {/* Purple tech glow */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          right: "20%",
          width: 350,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(ellipse, rgba(167, 139, 250, 0.1), transparent)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <CharacterSprite
        character="xiaoxue"
        image="xiaoxue.png"
        speaking={currentLine.character === "xiaoxue"}
        side="left"
        background={currentLine.character !== "xiaoxue"}
        effects={currentLine.character === "xiaoxue" ? currentEffects : []}
      />
      <CharacterSprite
        character="xiaoyue"
        image="xiaoyue.png"
        speaking={currentLine.character === "xiaoyue"}
        side="right"
        background={currentLine.character !== "xiaoyue"}
        effects={currentLine.character === "xiaoyue" ? currentEffects : []}
      />
      <CharacterSprite
        character="xiaoying"
        image="xiaoying.png"
        speaking={currentLine.character === "xiaoying"}
        side="center"
        background={currentLine.character !== "xiaoying"}
        effects={currentLine.character === "xiaoying" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiaoxue" ? "left" : currentLine.character === "xiaoyue" ? "right" : "center"}
      />

      {/* AI notification popup */}
      {currentLineIndex === 0 && (
        <SystemNotification text="AI 自動回覆已啟動 ✨" type="success" delay={0} />
      )}

      <DialogBox
        lines={dialogLines}
        sceneFrame={frame}
        sceneDuration={durationInFrames}
        overrideLineIndex={currentLineIndex}
        overrideLineFrame={segLineFrame}
      />

      {/* Scene title indicator */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          opacity: indicatorOpacity,
          zIndex: 50,
        }}
      >
        <div
          style={{
            color: "#A78BFA",
            fontSize: 24,
            fontWeight: 700,
            fontFamily: notoSansTC,
          }}
        >
          梗二：AI 回訊息翻車
        </div>
        <div
          style={{
            width: interpolate(frame, [5, 25], [0, 200], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            height: 2,
            background: "linear-gradient(90deg, #A78BFA, transparent)",
            marginTop: 4,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
