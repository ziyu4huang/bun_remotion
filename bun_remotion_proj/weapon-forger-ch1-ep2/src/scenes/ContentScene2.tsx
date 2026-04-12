import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../components/BackgroundLayer";
import { CharacterSprite } from "../components/CharacterSprite";
import { ComicEffects } from "../components/ComicEffects";
import {
  ScreenShake, ScreenFlash, ImpactBurst, DiamondShards,
  PowerUpRings, GroundCrack, ConcentrationLines, SpeedLines,
} from "../components/BattleEffects";
import { SystemNotification, SystemMessage } from "../components/SystemOverlay";
import { DialogBox } from "../components/DialogBox";
import { MangaSfx } from "../components/MangaSfx";
import { notoSansTC } from "../characters";
import type { DialogLine, ComicEffect } from "../characters";

/**
 * ContentScene2 — 長老評審、宣布結果、周墨通過考試
 * Features: power-up rings, diamond shards, ground crack, dramatic reveals
 */

const dialogLines: DialogLine[] = [
  { character: "elder", text: "周墨，你為什麼要給飛劍裝自動格式化？" },
  { character: "zhoumo", text: "因為萬一飛劍被別人搶走，它會在三分鐘後自動清除所有資料。就像手機一樣。" },
  { character: "elder", text: "......手機是什麼？", effect: "dots", sfx: [{ text: "？？？", x: 960, y: 380, color: "#A78BFA", rotation: 3, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "呃，一種......通訊法器。概念上的。", effect: "sweat" },
  { character: "elder", text: "你的腦袋裡裝的都是什麼亂七八糟的。", effect: "anger" },
  { character: "examiner", text: "長老，這個人根本不適合修道！他的煉器方式簡直是褻瀆！", effect: "anger", sfx: [{ text: "褻瀆！", x: 350, y: 320, color: "#EF4444", rotation: -12, fontSize: 110, font: "action" }] },
  { character: "elder", text: "你說得對。他的方式確實......不合常規。" },
  { character: "examiner", text: "對吧！", effect: "gloating" },
  { character: "elder", text: "但是，這恰恰是我們煉器峰最需要的。", sfx: [{ text: "轟隆！", x: 960, y: 400, color: "#FBBF24", rotation: -5, fontSize: 120, font: "brush" }] },
  { character: "examiner", text: "什麼？！", effect: "shock", sfx: [{ text: "嚇！", x: 400, y: 300, color: "#34D399", rotation: -18, fontSize: 115, font: "brush" }] },
  { character: "elder", text: "三百年来，我們煉器峰的法寶設計越來越保守。大家都只知道照著古方煉，沒有人敢創新。" },
  { character: "elder", text: "這個年輕人雖然方法奇怪，但他的思路......是我見過最新穎的。" },
  { character: "elder", text: "周墨，恭喜你。你通過了入宗考試。", sfx: [{ text: "通過！", x: 960, y: 420, color: "#FBBF24", rotation: 0, fontSize: 140, font: "brush" }] },
  { character: "zhoumo", text: "真的嗎？！", effect: "sparkle", sfx: [{ text: "太棒了！", x: 1500, y: 350, color: "#F59E0B", rotation: 8, fontSize: 95, font: "playful" }] },
  { character: "examiner", text: "長老，您不是在開玩笑吧？！", effect: "shock" },
  { character: "elder", text: "考官，你是不是還想讓他把飛劍收回來？" },
  { character: "examiner", text: "......他還沒收回去嗎？", effect: "dots" },
  { character: "zhoumo", text: "對，我說了，忘加停止按鈕了。", effect: "sweat", sfx: [{ text: "呵呵", x: 1500, y: 380, color: "#60A5FA", rotation: 5, fontSize: 90, font: "playful" }] },
  { character: "elder", text: "你看，這就說明他的防盜系統做得很好。連他自己都收不回來。", effect: "gloating", sfx: [{ text: "妙啊～", x: 960, y: 350, color: "#A78BFA", rotation: 3, fontSize: 100, font: "brush" }] },
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

  // Key dramatic moments
  const isElderReveal = currentLineIndex === 8; // "但是，這恰恰是我們煉器峰最需要的"
  const isPassMoment = currentLineIndex === 12; // "周墨，恭喜你。你通過了入宗考試"
  const isFinalJoke = currentLineIndex >= 17; // "你看，這就說明他的防盜系統做得很好"

  // Calculate frame offsets for effects
  const elderRevealFrame = (8 / dialogLines.length) * durationInFrames;
  const passFrame = (12 / dialogLines.length) * durationInFrames;
  const finalJokeFrame = (17 / dialogLines.length) * durationInFrames;

  const elderFrame = frame - elderRevealFrame;
  const passFrameOffset = frame - passFrame;
  const finalJokeFrameOffset = frame - finalJokeFrame;

  // System notification at pass moment
  const showPassNotification = currentLineIndex >= 12 && currentLineIndex < 15;

  // Current SFX
  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <ScreenShake
        delay={isPassMoment ? Math.floor(passFrame) : undefined}
        intensity={18}
        duration={25}
      >
        <BackgroundLayer
          image="sect-gate.png"
          gradient="linear-gradient(135deg, #0a0a2e 0%, #2a1a3e 30%, #3a0a2e 60%, #0a0a2e 100%)"
        />

        {/* Concentration lines during elder's reveal */}
        {isElderReveal && (
          <ConcentrationLines delay={Math.floor(elderRevealFrame)} angle={135} lineCount={28} duration={40} color="rgba(167, 139, 250, 0.5)" />
        )}

        {/* Power-up rings at pass moment */}
        {currentLineIndex >= 12 && currentLineIndex < 16 && (
          <PowerUpRings x={960} y={500} delay={Math.floor(passFrame)} color="#FBBF24" ringCount={5} maxRadius={500} />
        )}

        {/* Diamond shards at pass moment */}
        {currentLineIndex >= 12 && currentLineIndex < 15 && (
          <DiamondShards x={960} y={500} delay={Math.floor(passFrame)} color="#FBBF24" count={12} maxRadius={300} />
        )}

        {/* Impact burst at elder reveal */}
        {elderFrame >= 0 && elderFrame < 25 && (
          <ImpactBurst x={960} y={500} delay={Math.floor(elderRevealFrame)} color="#A78BFA" maxRadius={350} particleCount={24} />
        )}

        {/* Ground crack at pass moment */}
        {passFrameOffset >= 0 && passFrameOffset < 35 && (
          <GroundCrack x={960} y={850} delay={Math.floor(passFrame)} color="#92400E" />
        )}

        {/* Screen flash at pass moment */}
        {passFrameOffset >= 0 && passFrameOffset < 12 && (
          <ScreenFlash delay={Math.floor(passFrame)} duration={10} color="#FBBF24" />
        )}

        {/* Speed lines during final joke */}
        {isFinalJoke && (
          <SpeedLines delay={0} lineCount={8} color="rgba(245, 158, 11, 0.3)" />
        )}

        {/* Characters */}
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

        <CharacterSprite
          character="elder"
          image="elder.png"
          speaking={currentLine.character === "elder"}
          side="center"
          background={currentLine.character !== "elder"}
          effects={currentLine.character === "elder" ? currentEffects : []}
        />

        <ComicEffects
          effects={currentEffects.filter((e) => e !== "shake")}
          side={currentLine.character === "zhoumo" ? "left" : currentLine.character === "elder" ? "center" : "right"}
        />

        {/* Manga SFX */}
        <MangaSfx events={currentSfx} />

        {/* System notification */}
        {showPassNotification && (
          <SystemNotification
            text="入宗考試結果：通過！"
            type="success"
            delay={Math.max(0, frame - passFrame)}
          />
        )}

        {/* "通過！" big text */}
        {passFrameOffset >= 5 && passFrameOffset < 60 && (
          <SystemMessage
            text="恭喜通過！"
            delay={Math.floor(passFrame) + 5}
            position="center"
            color="#FBBF24"
          />
        )}

        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

        {/* Scene indicator */}
        <div style={{
          position: "absolute", top: 40, left: 60,
          opacity: indicatorOpacity, zIndex: 50,
        }}>
          <div style={{ color: "#A78BFA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
            長老評審
          </div>
          <div style={{
            width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            height: 2, background: "linear-gradient(90deg, #A78BFA, transparent)", marginTop: 4,
          }} />
        </div>
      </ScreenShake>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
