import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import {
  ScreenFlash, ImpactBurst, SpeedLines,
} from "../../../assets/components/BattleEffects";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { DialogBox } from "../../../assets/components/DialogBox";
import { MangaSfx } from "../../../assets/components/MangaSfx";
import { notoSansTC } from "../../../assets/characters";
import type { DialogLine, ComicEffect } from "../../../assets/characters";

/**
 * ContentScene1 — 進入洞窟 + 遭遇殘魂
 * Features: cave dark atmosphere, soul entrance with ScreenFlash + aura,
 * SystemNotification showing soul status
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo", text: "邏輯修正小組，第一次正式任務——低語洞窟探索。", sfx: [{ text: "出發！", x: 960, y: 300, color: "#F59E0B", rotation: 0, fontSize: 100, font: "brush" }] },
  { character: "luyang", text: "我帶了投降表。三份。", sfx: [{ text: "三份？", x: 600, y: 350, color: "#38BDF8", rotation: -5, fontSize: 90, font: "playful" }] },
  { character: "mengjingzhou", text: "我帶了研究筆記。如果洞窟裡有女性殘魂，我要記錄單身光環的有效範圍。", effect: "dots" },
  { character: "zhoumo", text: "先進去再說。這個洞窟的結構很有規律，像是某種陣法構建的空間。" },
  { character: "soul", text: "吾乃上古劍仙——滄溟子！誰敢闖入吾之領地！", effect: "shock", sfx: [{ text: "滄溟子！", x: 960, y: 280, color: "#A78BFA", rotation: 0, fontSize: 110, font: "action" }] },
  { character: "luyang", text: "對不起對不起對不起！我投降！", effect: "shock", sfx: [{ text: "投降！", x: 500, y: 300, color: "#38BDF8", rotation: -10, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "有意思。一個語音觸發的自動防禦系統。讓我看看能不能重設密碼。", sfx: [{ text: "重設密碼", x: 1300, y: 320, color: "#F59E0B", rotation: 5, fontSize: 85, font: "playful" }] },
  { character: "soul", text: "你說什麼？！吾乃——", effect: "anger" },
  { character: "zhoumo", text: "找到了。能量核心有裂痕，記憶區段損壞。他只能重複同一句話。", effect: "sparkle", sfx: [{ text: "診斷完成！", x: 960, y: 300, color: "#34D399", rotation: 0, fontSize: 95, font: "action" }] },
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

  // Key moments
  const isSoulEntrance = currentLineIndex === 4;
  const soulFrame = (4 / dialogLines.length) * durationInFrames;
  const soulOffset = frame - soulFrame;

  const isDiagnosis = currentLineIndex === dialogLines.length - 1;
  const diagFrame = ((dialogLines.length - 1) / dialogLines.length) * durationInFrames;
  const diagOffset = frame - diagFrame;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Determine which side the soul appears on (center, behind)
  const showSoul = currentLineIndex >= 4;

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="sect-gate.png"
        gradient="linear-gradient(135deg, #0a0a1e 0%, #0a0a2e 30%, #1a0a2e 60%, #0a0a1e 100%)"
      />

      {/* Soul entrance flash */}
      {soulOffset >= 0 && soulOffset < 15 && (
        <ScreenFlash delay={Math.floor(soulFrame)} duration={12} color="#A78BFA" />
      )}

      {/* Soul entrance impact burst */}
      {soulOffset >= 0 && soulOffset < 25 && (
        <ImpactBurst x={960} y={400} delay={Math.floor(soulFrame)} color="#A78BFA" maxRadius={350} particleCount={20} />
      )}

      {/* Speed lines at soul entrance */}
      {isSoulEntrance && (
        <SpeedLines delay={0} lineCount={10} color="rgba(167, 139, 250, 0.4)" />
      )}

      {/* Soul ghostly aura — pulsing purple rings */}
      {showSoul && (
        <SoulAuraEffect frame={frame} />
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
        side="right"
        background={currentLine.character !== "luyang"}
        effects={currentLine.character === "luyang" ? currentEffects : []}
      />

      {/* MengJingZhou appears from line 2 onward */}
      {currentLineIndex >= 2 && currentLineIndex < 4 && (
        <CharacterSprite
          character="mengjingzhou"
          image="mengjingzhou.png"
          speaking={currentLine.character === "mengjingzhou"}
          side="right"
          background={currentLine.character !== "mengjingzhou"}
          effects={currentLine.character === "mengjingzhou" ? currentEffects : []}
        />
      )}

      {/* Soul — uses elder.png with transparency */}
      {showSoul && (
        <div style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 350,
          height: "75%",
          zIndex: 3,
          opacity: 0.6 + Math.sin(frame * 0.05) * 0.1,
          filter: "brightness(1.2) saturate(0.5)",
        }}>
          <Img
            src={staticFile("images/elder.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "bottom center",
              filter: "drop-shadow(0 0 30px rgba(167, 139, 250, 0.6))",
            }}
          />
        </div>
      )}

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={
          currentLine.character === "zhoumo" ? "left"
          : currentLine.character === "luyang" ? "right"
          : currentLine.character === "soul" ? "center"
          : "right"
        }
      />

      {/* Manga SFX */}
      <MangaSfx events={currentSfx} />

      {/* System notification at diagnosis */}
      {isDiagnosis && diagOffset >= 0 && diagOffset < 60 && (
        <SystemNotification
          text="殘魂診斷：記憶區段損壞 — 僅剩循環播放功能"
          type="warning"
          delay={0}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#A78BFA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          低語洞窟 × 殘魂登場
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #A78BFA, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** Purple pulsing aura for the remnant soul */
const SoulAuraEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const ringCount = 3;
  return (
    <div style={{ position: "absolute", left: 960, top: 450, transform: "translate(-50%, -50%)", zIndex: 2 }}>
      {Array.from({ length: ringCount }).map((_, i) => {
        const phase = frame * 0.04 + i * 2;
        const radius = 80 + i * 50 + Math.sin(phase) * 15;
        const opacity = interpolate(Math.sin(phase), [-1, 1], [0.05, 0.2], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{
            position: "absolute",
            left: -radius,
            top: -radius,
            width: radius * 2,
            height: radius * 2,
            borderRadius: "50%",
            border: `2px solid rgba(167, 139, 250, ${opacity})`,
            background: `radial-gradient(circle, rgba(167, 139, 250, ${opacity * 0.2}), transparent 70%)`,
          }} />
        );
      })}
    </div>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
