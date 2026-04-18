import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { SpeedLines, SlashEffect, ScreenFlash, BattleAura } from "../../../assets/components/BattleEffects";
import { CharacterSprite, ComicEffects, DialogBox, SystemNotification } from "@bun-remotion/shared";
import { notoSansTC } from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * 第一集：周墨炼制"自动寻路飞剑"，飞剑锁定考官的储物袋
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo", text: "模块化设计，指纹识别，自动格式化防偷...启动！" },
  { character: "zhoumo", text: "自动寻路飞剑——完成！", effect: "sparkle" },
  { character: "examiner", text: "这把剑...怎么在抖？", effect: "surprise" },
  { character: "zhoumo", text: "这是智能振动模式，帮助它定位目标。" },
  { character: "examiner", text: "定位什么目标？", effect: "surprise" },
  { character: "zhoumo", text: "灵气密度最高的目标。这是它的核心算法。" },
  { character: "examiner", text: "等等——它为什么朝我飞过来？！", effect: "shock" },
  { character: "zhoumo", text: "因为您的储物袋灵气浓度最高。它很聪明吧？", effect: "sparkle" },
  { character: "examiner", text: "这是抢劫吧！！这是抢劫吧？！", effect: "anger" },
  { character: "zhoumo", text: "不不不，这是自动寻路功能。攻击和抢劫只是副产物。", effect: "sweat" },
  { character: "examiner", text: "把你的破剑收回去！！", effect: "fire" },
  { character: "zhoumo", text: "收不回来了，我忘加停止按钮了。", effect: "sweat" },
];

export const ContentScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Battle phase: sword chasing examiner (lines 6-10)
  const isBattlePhase = currentLineIndex >= 6;
  const slashLineIndex = 6;
  const slashStart = (slashLineIndex / dialogLines.length) * durationInFrames;
  const slashFrame = frame - slashStart;

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer image="sect-gate.png" gradient="linear-gradient(135deg, #0a0a2e 0%, #2a1a3e 30%, #3a0a2e 60%, #0a0a2e 100%)" />

      {isBattlePhase && (
        <>
          <BattleAura x={350} y={700} color="#F59E0B" intensity={0.4} />
          <BattleAura x={1570} y={700} color="#34D399" intensity={0.7} />
        </>
      )}

      <CharacterSprite
        character="zhoumo"
        characterConfig={CHARACTERS.zhoumo}
        image="characters/zhoumo.png"
        chibi={isBattlePhase}
        chibiImage="characters/zhoumo-chibi.png"
        speaking={currentLine.character === "zhoumo"}
        side="left"
        background={currentLine.character !== "zhoumo"}
        effects={currentLine.character === "zhoumo" ? currentEffects : []}
      />
      <CharacterSprite
        character="examiner"
        characterConfig={CHARACTERS.examiner}
        image="characters/examiner.png"
        chibi={isBattlePhase}
        chibiImage="characters/examiner-chibi.png"
        speaking={currentLine.character === "examiner"}
        side="right"
        background={currentLine.character !== "examiner"}
        effects={currentLine.character === "examiner" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "zhoumo" ? "left" : "right"}
      />

      {isBattlePhase && <SpeedLines delay={0} lineCount={10} />}

      {slashFrame >= 0 && slashFrame < 40 && (
        <>
          <SlashEffect delay={0} direction="ltr" color="#F59E0B" thickness={4} />
          <ScreenFlash delay={0} duration={6} color="#F59E0B" />
        </>
      )}

      {currentLineIndex >= 2 && currentLineIndex < 6 && (
        <SystemNotification
          text="智能飞剑已启动：锁定灵气最高目标"
          type="success"
          delay={Math.max(0, frame - (2 / dialogLines.length) * durationInFrames)}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#F59E0B", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          自动寻路飞剑
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
