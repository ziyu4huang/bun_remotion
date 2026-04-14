import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../fixture/components/BackgroundLayer";
import { CharacterSprite } from "../../../fixture/components/CharacterSprite";
import { ComicEffects } from "../../../fixture/components/ComicEffects";
import { ScreenFlash, ImpactBurst, SpeedLines } from "../../../fixture/components/BattleEffects";
import { SystemMessage, SystemNotification } from "../../../fixture/components/SystemOverlay";
import { DialogBox } from "../../../fixture/components/DialogBox";
import { MangaSfx } from "../../../fixture/components/MangaSfx";
import { notoSansTC } from "../../../fixture/characters";
import type { DialogLine, ComicEffect } from "../../../fixture/characters";

/**
 * ContentScene2 — 雷射切割 vs 上古禁制 + 自毀倒數
 * Features: laser beam ScreenFlash, barrier destruction, self-destruct countdown,
 * running gag punchline (forgot direction control)
 */

const dialogLines: DialogLine[] = [
  { character: "mengjingzhou", text: "那個天劍宗的首席弟子已經砍了三十七劍了。禁制連個痕跡都沒有。" },
  { character: "luyang", text: "我在旁邊觀察了。他的臉越來越紅。我覺得他快要——" },
  { character: "zhoumo", text: "閃開。", sfx: [{ text: "閃開！", x: 960, y: 300, color: "#F59E0B", rotation: 0, fontSize: 110, font: "action" }] },
  { character: "zhoumo", text: "周墨按下雷射筆的按鈕。一道筆直的靈氣光束射出——" },
  { character: "zhoumo", text: "禁制。被切成了兩半。", sfx: [{ text: "唰────！", x: 960, y: 400, color: "#FF4444", rotation: -45, fontSize: 120, font: "action" }] },
  { character: "mengjingzhou", text: "……就這樣？", effect: "surprise", sfx: [{ text: "就這樣？", x: 1300, y: 320, color: "#FB923C", rotation: -5, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "就這樣。三千年前的陣法結構是單層線性排列，沒有冗餘設計。一個工程師的基本常識：永遠不要信任沒有備份的系統。", sfx: [{ text: "沒有備份！", x: 960, y: 280, color: "#34D399", rotation: 0, fontSize: 95, font: "brush" }] },
  { character: "luyang", text: "但是周墨……你好像把所有禁制都切斷了。不只是入口這個——整座秘境的禁制系統。", effect: "shock" },
  { character: "zhoumo", text: "嗯，雷射筆的切割範圍確實沒有設定邊界。我記得我加了方向控制……等等，我忘了加方向控制。", effect: "sweat", sfx: [{ text: "忘了！", x: 960, y: 300, color: "#F59E0B", rotation: 5, fontSize: 100, font: "brush" }] },
  { character: "luyang", text: "整座秘境震動。牆壁上浮現出上古文字：「警告——禁制系統已離線——保護機制啟動——自毀倒數：一百八十息。」", effect: "shake", sfx: [{ text: "警告！", x: 960, y: 250, color: "#EF4444", rotation: 0, fontSize: 120, font: "action" }] },
  { character: "mengjingzhou", text: "一百八十息？那是我們能活多久的意思嗎？", effect: "shock", sfx: [{ text: "要死了？", x: 600, y: 350, color: "#FB923C", rotation: -8, fontSize: 100, font: "playful" }] },
  { character: "luyang", text: "我的投降表能遞給上古大能的保護機制嗎？", effect: "cry", sfx: [{ text: "投降！", x: 500, y: 300, color: "#38BDF8", rotation: -10, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "冷靜。這只是一個計時觸發的自動防禦協議。我來看看能不能找到……出口。" },
  { character: "mengjingzhou", text: "出口也被你切斷了。你看，那個門已經變成兩半了。", effect: "shock", sfx: [{ text: "門也沒了！", x: 1200, y: 320, color: "#FB923C", rotation: 3, fontSize: 95, font: "brush" }] },
  { character: "zhoumo", text: "……這是一個需要優化的設計缺陷。", effect: "sweat", sfx: [{ text: "設計缺陷", x: 960, y: 300, color: "#F59E0B", rotation: 0, fontSize: 110, font: "action" }] },
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

  // Key moments
  const isLaserFired = currentLineIndex >= 2 && currentLineIndex <= 4;
  const laserFrame = (2 / dialogLines.length) * durationInFrames;
  const laserOffset = frame - laserFrame;

  const isBarrierCut = currentLineIndex === 4;
  const cutFrame = (4 / dialogLines.length) * durationInFrames;
  const cutOffset = frame - cutFrame;

  const isSelfDestruct = currentLineIndex === 9;
  const destructFrame = (9 / dialogLines.length) * durationInFrames;
  const destructOffset = frame - destructFrame;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Self-destruct countdown timer
  const showCountdown = currentLineIndex >= 9;
  const countdownStart = destructFrame;
  const countdownElapsed = Math.max(0, frame - countdownStart);
  const countdownRemaining = Math.max(0, 180 - Math.floor(countdownElapsed / 2));

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="sect-gate.png"
        gradient={`linear-gradient(135deg, #0a0a1e 0%, #0a0a2e 30%, ${
          showCountdown ? "#2a0a0a" : "#1a0a2e"
        } 60%, #0a0a1e 100%)`}
      />

      {/* Laser beam flash */}
      {laserOffset >= 0 && laserOffset < 15 && (
        <ScreenFlash delay={Math.floor(laserFrame)} duration={12} color="#FF4444" />
      )}

      {/* Laser beam visual — a horizontal red line across the screen */}
      {isLaserFired && laserOffset >= 0 && laserOffset < 30 && (
        <LaserBeamEffect frame={frame} startFrame={laserFrame} />
      )}

      {/* Barrier destruction impact */}
      {cutOffset >= 0 && cutOffset < 25 && (
        <ImpactBurst x={960} y={400} delay={Math.floor(cutFrame)} color="#FF4444" maxRadius={400} particleCount={20} />
      )}

      {/* Speed lines at laser fire */}
      {isLaserFired && laserOffset >= 0 && laserOffset < 20 && (
        <SpeedLines delay={0} lineCount={12} color="rgba(255, 68, 68, 0.4)" />
      )}

      {/* Self-destruct screen shake */}
      {showCountdown && (
        <SelfDestructEffect frame={frame} startFrame={destructFrame} />
      )}

      {/* Self-destruct warning flash */}
      {destructOffset >= 0 && destructOffset < 15 && (
        <ScreenFlash delay={Math.floor(destructFrame)} duration={12} color="#EF4444" />
      )}

      {/* Self-destruct warning notification */}
      {isSelfDestruct && destructOffset >= 5 && destructOffset < 80 && (
        <SystemNotification
          text="⚠ 禁制系統已離線 — 保護機制啟動 — 自毀倒數：180息"
          type="warning"
          delay={5}
        />
      )}

      {/* Countdown timer overlay */}
      {showCountdown && countdownElapsed > 0 && (
        <div style={{
          position: "absolute",
          top: 80,
          right: 80,
          zIndex: 60,
          fontFamily: notoSansTC,
          padding: "16px 24px",
          borderRadius: 8,
          background: "rgba(239, 68, 68, 0.15)",
          border: "2px solid rgba(239, 68, 68, 0.4)",
          opacity: interpolate(countdownElapsed, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}>
          <div style={{ fontSize: 18, color: "#EF4444", fontWeight: 700, letterSpacing: "0.1em" }}>
            自毀倒數
          </div>
          <div style={{
            fontSize: 48,
            fontWeight: 900,
            color: countdownRemaining < 60 ? "#EF4444" : "#F59E0B",
            textShadow: `0 0 20px ${countdownRemaining < 60 ? "rgba(239, 68, 68, 0.6)" : "rgba(245, 158, 11, 0.4)"}`,
            fontVariantNumeric: "tabular-nums",
          }}>
            {countdownRemaining}息
          </div>
        </div>
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
        character="luyang"
        image="luyang.png"
        speaking={currentLine.character === "luyang"}
        side="center"
        background={currentLine.character !== "luyang"}
        effects={currentLine.character === "luyang" ? currentEffects : []}
      />

      <CharacterSprite
        character="mengjingzhou"
        image="mengjingzhou.png"
        speaking={currentLine.character === "mengjingzhou"}
        side="right"
        background={currentLine.character !== "mengjingzhou"}
        effects={currentLine.character === "mengjingzhou" ? currentEffects : []}
      />

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={
          currentLine.character === "zhoumo" ? "left"
          : currentLine.character === "luyang" ? "center"
          : "right"
        }
      />

      {/* Manga SFX */}
      <MangaSfx events={currentSfx} />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#EF4444", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          雷射切割 × 自毀倒數
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #EF4444, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** Horizontal laser beam sweeping across screen */
const LaserBeamEffect: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const offset = frame - startFrame;
  const progress = interpolate(offset, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(offset, [10, 25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const beamLength = progress * 1920;
  const y = 400 + Math.sin(offset * 0.3) * 5;

  return (
    <div style={{
      position: "absolute",
      left: 0,
      top: y,
      width: beamLength,
      height: 6,
      background: "linear-gradient(90deg, rgba(255, 68, 68, 0), #FF4444, rgba(255, 68, 68, 0.8))",
      boxShadow: "0 0 20px rgba(255, 68, 68, 0.8), 0 0 60px rgba(255, 68, 68, 0.4)",
      opacity: fadeOut,
      zIndex: 20,
    }} />
  );
};

/** Red pulsing warning overlay for self-destruct */
const SelfDestructEffect: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const offset = frame - startFrame;
  const pulse = Math.sin(offset * 0.15);
  const opacity = interpolate(pulse, [-1, 1], [0.02, 0.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: `radial-gradient(circle at center, rgba(239, 68, 68, ${opacity}), transparent 70%)`,
      zIndex: 0,
      pointerEvents: "none",
    }} />
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
