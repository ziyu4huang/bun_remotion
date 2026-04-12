import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { BattleAura, SpeedLines, SlashEffect, ScreenFlash } from "../components/BattleEffects";
import { SystemNotification, MissionPanel } from "../components/SystemOverlay";
import { DialogBox } from "../components/DialogBox";
import { notoSansTC } from "../characters";
import type { DialogLine, ComicEffect } from "../characters";

/**
 * 梗一：晉升考試 — 修修參加境界晉升考試，系統不幫忙，師姐是考官
 * Battle effects: SpeedLines + SlashEffect + BattleAura (warm-up)
 */

const dialogLines: DialogLine[] = [
  { character: "xiuxiu", text: "系統，我準備好了嗎？築基考試就在今天。" },
  { character: "system", text: "宿主境界評估：煉氣期一層。建議：放棄。" },
  { character: "xiuxiu", text: "你能不能有點鼓勵的話？", effect: "sweat" },
  { character: "system", text: "好的，你是最棒的廢物。加油。" },
  { character: "xiuxiu", text: "這不是鼓勵吧。", effect: "sweat" },
  { character: "system", text: "叮！考試限時任務：通過築基考試。獎勵：晉升築基期。失敗懲罰：靈力鎖定為零。" },
  { character: "xiuxiu", text: "零？！那不就變成普通人了嗎！", effect: "shock" },
  { character: "system", text: "考生修修，請進入試煉場。" },
  { character: "shijie", text: "師弟加油，我會在外面看著你的。", effect: "heart" },
  { character: "xiuxiu", text: "師姐在看我，我不能丟臉！", effect: "fire" },
  { character: "system", text: "試煉開始。第一關：接住師姐的一擊。" },
  { character: "xiuxiu", text: "什麼？！師姐是考官！", effect: "shock" },
];

export const JokeScene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Battle phase: lines 9-11 (師姐攻擊 + 修修反應)
  const isBattlePhase = currentLineIndex >= 9;

  // Slash effect triggers when 師姐 attacks (line 10)
  const slashLineIndex = 10;
  const slashStart = (slashLineIndex / dialogLines.length) * durationInFrames;
  const slashFrame = frame - slashStart;

  // System mission panel at lines 5-7
  const showMission = currentLineIndex >= 5 && currentLineIndex < 8;

  // Scene indicator
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 30%, #2a0a3e 60%, #0a0a2e 100%)" />

      {/* Character auras during battle */}
      {isBattlePhase && (
        <>
          <BattleAura x={350} y={700} color="#60A5FA" intensity={0.6} />
          <BattleAura x={1570} y={700} color="#F472B6" intensity={0.8} />
        </>
      )}

      <CharacterSprite
        character="xiuxiu"
        image="xiuxiu.png"
        chibi={isBattlePhase}
        chibiImage="xiuxiu-chibi.png"
        speaking={currentLine.character === "xiuxiu"}
        side="left"
        background={currentLine.character !== "xiuxiu"}
        effects={currentLine.character === "xiuxiu" ? currentEffects : []}
      />
      <CharacterSprite
        character="shijie"
        image="shijie.png"
        chibi={isBattlePhase}
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

      {/* Battle effects */}
      {isBattlePhase && <SpeedLines delay={0} lineCount={12} />}

      {slashFrame >= 0 && slashFrame < 40 && (
        <>
          <SlashEffect delay={0} direction="ltr" color="#F472B6" thickness={6} />
          <ScreenFlash delay={0} duration={8} color="#F472B6" />
        </>
      )}

      {/* System notification */}
      {currentLineIndex >= 5 && currentLineIndex < 7 && (
        <SystemNotification
          text="限時任務：通過築基考試"
          type="warning"
          delay={Math.max(0, frame - (5 / dialogLines.length) * durationInFrames)}
        />
      )}

      {/* Mission panel */}
      {showMission && (
        <MissionPanel
          title="築基考試"
          objective="通過試煉場所有關卡"
          punishment="靈力鎖定為零"
          delay={Math.max(0, frame - (5 / dialogLines.length) * durationInFrames)}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#60A5FA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          梗一：晉升考試
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #60A5FA, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
