import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { DialogBox } from "../../../assets/components/DialogBox";
import { notoSansTC } from "../../../assets/characters";
import type { DialogLine, ComicEffect } from "../../../assets/characters";

/**
 * 第一集：入宗考试 — 周墨来到问道宗参加入宗考试，考官布置炼器任务
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo", text: "问道宗，传说中最正统的修仙宗门。今天，我终于来了。" },
  { character: "examiner", text: "你是来参加入宗考试的？报上名来。" },
  { character: "zhoumo", text: "周墨。特长是...炼器。" },
  { character: "examiner", text: "炼器？上一个说自己擅长炼器的，现在还在后山修丹炉。" },
  { character: "zhoumo", text: "我的炼器跟别人不太一样。我追求的是用户体验和底层逻辑闭环。", effect: "sparkle" },
  { character: "examiner", text: "说人话。", effect: "sweat" },
  { character: "zhoumo", text: "就是...我的法宝会自己思考。" },
  { character: "examiner", text: "好，考试任务：炼制一件法器。限时一炷香。" },
  { character: "examiner", text: "你有什么材料？" },
  { character: "zhoumo", text: "我带了三百个微型隐藏机关、两个指纹识别阵法、和一个自动格式化模块。", effect: "sparkle" },
  { character: "examiner", text: "...这不是炼器，这是在造兵器工厂吧。", effect: "sweat" },
  { character: "zhoumo", text: "老师您有所不知，模块化才是未来。" },
];

export const ContentScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // System notification at line 7 (exam task)
  const showExamTask = currentLineIndex >= 7 && currentLineIndex < 9;

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-gate.png" gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 30%, #1a0a2e 60%, #0a0a2e 100%)" />

      <CharacterSprite
        character="zhoumo"
        image="zhoumo.png"
        chibi={false}
        chibiImage="zhoumo-chibi.png"
        speaking={currentLine.character === "zhoumo"}
        side="left"
        background={currentLine.character !== "zhoumo"}
        effects={currentLine.character === "zhoumo" ? currentEffects : []}
      />
      <CharacterSprite
        character="examiner"
        image="examiner.png"
        chibi={false}
        chibiImage="examiner-chibi.png"
        speaking={currentLine.character === "examiner"}
        side="right"
        background={currentLine.character !== "examiner"}
        effects={currentLine.character === "examiner" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "zhoumo" ? "left" : "right"}
      />

      {showExamTask && (
        <SystemNotification
          text="入宗考试：炼制一件法器"
          type="warning"
          delay={Math.max(0, frame - (7 / dialogLines.length) * durationInFrames)}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          入宗考试
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #F59E0B, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
