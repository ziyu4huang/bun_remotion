import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import { EnergyWave, BattleAura, SpeedLines, ScreenFlash } from "../components/BattleEffects";
import { SystemNotification } from "../components/SystemOverlay";
import { DialogBox } from "../components/DialogBox";
import { notoSansTC } from "../characters";
import type { DialogLine, ComicEffect } from "../characters";

/**
 * 梗四：系統的真正實力 — 系統揭示身份，展示全功率 EnergyWave
 * 系統是封印在修修體內的萬古劍仙——劍無痕。
 */

const dialogLines: DialogLine[] = [
  { character: "shijie", text: "話說回來，師弟你的系統到底是哪裡來的？" },
  { character: "xiuxiu", text: "我也不知道，突然就綁定了。" },
  { character: "system", text: "既然你們問了，本座就自我介紹一下。" },
  { character: "xiuxiu", text: "本座？", effect: "surprise" },
  { character: "system", text: "我是封印在你體內的萬古劍仙——劍無痕。" },
  { character: "xiuxiu", text: "萬古劍仙？！", effect: "shock" },
  { character: "shijie", text: "哦？有意思。", effect: "sparkle" },
  { character: "system", text: "不過以你現在的靈力，只能用我百分之一的力量。" },
  { character: "xiuxiu", text: "百分之一就這麼厲害？那我什麼時候能用全部力量？" },
  { character: "system", text: "大概需要修煉三千年。" },
  { character: "xiuxiu", text: "人類的壽命才不到一百年啊！", effect: "cry" },
  { character: "system", text: "所以加油吧，廢物。" },
  { character: "shijie", text: "三千年，我等你。", effect: "heart" },
  { character: "xiuxiu", text: "師姐，妳的壽命也不是三千年的啊！", effect: "anger" },
  { character: "system", text: "新任務：修煉三千年。開始倒數。三、二、一——" },
  { character: "xiuxiu", text: "等等等等！", effect: "cry" },
];

export const JokeScene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const lineDuration = durationInFrames / dialogLines.length;
  const currentLineIndex = Math.min(
    Math.floor(frame / lineDuration),
    dialogLines.length - 1
  );
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // System reveal moment: line 4 ("萬古劍仙——劍無痕")
  // Full-power green EnergyWave at line 4
  const revealLineIndex = 4;
  const revealStart = (revealLineIndex / dialogLines.length) * durationInFrames;
  const revealFrame = frame - revealStart;

  // System aura during reveal (lines 3-6)
  const showSystemAura = currentLineIndex >= 3 && currentLineIndex < 7;

  // Scene indicator
  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer gradient="linear-gradient(135deg, #0a1a0e 0%, #1a0a2e 50%, #0a2a1e 100%)" />

      {/* System reveal aura */}
      {showSystemAura && (
        <BattleAura x={960} y={540} color="#34D399" intensity={1.5} />
      )}

      <CharacterSprite
        character="xiuxiu"
        image="xiuxiu.png"
        speaking={currentLine.character === "xiuxiu"}
        side="left"
        background={currentLine.character !== "xiuxiu"}
        effects={currentLine.character === "xiuxiu" ? currentEffects : []}
      />
      <CharacterSprite
        character="shijie"
        image="shijie.png"
        speaking={currentLine.character === "shijie"}
        side="right"
        background={currentLine.character !== "shijie"}
        effects={currentLine.character === "shijie" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={currentLine.character === "xiuxiu" ? "left" : currentLine.character === "shijie" ? "right" : "center"}
      />

      {/* Full-power green EnergyWave at system reveal */}
      {revealFrame >= 0 && revealFrame < 40 && (
        <>
          <EnergyWave
            fromX={960}
            fromY={540}
            toX={200}
            toY={300}
            delay={0}
            color="#34D399"
            waveCount={7}
            spread={25}
            thickness={5}
            intensity={1}
          />
          <EnergyWave
            fromX={960}
            fromY={540}
            toX={1720}
            toY={800}
            delay={3}
            color="#34D399"
            waveCount={5}
            spread={20}
            thickness={4}
            intensity={0.8}
          />
          <ScreenFlash delay={0} duration={10} color="#34D399" />
        </>
      )}

      {/* System notification at reveal */}
      {currentLineIndex >= 3 && currentLineIndex < 6 && (
        <SystemNotification
          text="萬古劍仙·劍無痕 覺醒中"
          type="success"
          delay={Math.max(0, frame - (3 / dialogLines.length) * durationInFrames)}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene title */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#34D399", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          梗四：系統的真正實力
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #34D399, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
