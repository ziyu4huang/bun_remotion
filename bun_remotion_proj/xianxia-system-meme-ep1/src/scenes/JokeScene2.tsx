import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { DialogBox } from "../components/DialogBox";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { CountdownTimer } from "../components/SystemOverlay";
import type { DialogLine } from "../characters";

// 梗二：表白倒數計時 — Q版修修手忙腳亂
const lines: DialogLine[] = [
  { character: "system", text: "七、六、五..." },
  { character: "xiuxiu", text: "師姐！我...我有話想對妳說！", effect: "shake" },
  { character: "shijie", text: "什麼事？你的臉怎麼這麼紅？" },
  { character: "xiuxiu", text: "我、我...那個...就是...", effect: "sweat" },
  { character: "system", text: "三、二、一..." },
  { character: "xiuxiu", text: "我喜歡妳——！！", effect: ["surprise", "fire"] },
  { character: "shijie", text: "哦？真的假的？", effect: "sparkle" },
  { character: "system", text: "叮！任務完成。獎勵：靈力恢復一點。", effect: "sparkle" },
  { character: "xiuxiu", text: "就一點？！我剛才差點死了好嗎！", effect: "anger" },
];

export const JokeScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = Math.min(
    Math.floor((frame / durationInFrames) * lines.length),
    lines.length - 1
  );
  const currentLine = lines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #1a0a2e 0%, #2a1a3e 40%, #1a0a4e 70%, #0a0a2e 100%)" />

      {/* Countdown timer — visible throughout the scene */}
      <CountdownTimer totalSeconds={10} delay={0} />

      <CharacterSprite
        character="xiuxiu"
        image="xiuxiu.png"
        chibi={true}
        chibiImage="xiuxiu-chibi.png"
        speaking={currentLine.character === "xiuxiu"}
        side="left"
        background={currentLine.character !== "xiuxiu"}
        effects={currentLine.character === "xiuxiu" ? currentEffects : []}
      />
      <CharacterSprite
        character="shijie"
        image="shijie.png"
        chibi={true}
        chibiImage="shijie-chibi.png"
        speaking={currentLine.character === "shijie"}
        side="right"
        background={currentLine.character !== "shijie"}
        effects={currentLine.character === "shijie" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiuxiu" ? "left" : currentLine.character === "shijie" ? "right" : "center"}
      />

      <DialogBox lines={lines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F87171", fontSize: 24, fontWeight: 700, fontFamily: "sans-serif" }}>
          梗二：表白倒數計時
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #F87171, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: string | string[]): string[] {
  if (!effect) return [];
  return Array.isArray(effect) ? effect : [effect];
}
