import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { PowerUpRings, ImpactBurst } from "../../../assets/components/BattleEffects";
import { SystemMessage } from "../../../assets/components/SystemOverlay";
import { DialogBox } from "../../../assets/components/DialogBox";
import { MangaSfx } from "../../../assets/components/MangaSfx";
import { notoSansTC } from "../../../assets/characters";
import type { DialogLine, ComicEffect } from "../../../assets/characters";

/**
 * ContentScene2 — 孟景舟登場 + 三人成軍
 * Features: single aura effect (blue pulsing rings), power-up at team formation
 */

const dialogLines: DialogLine[] = [
  { character: "mengjingzhou", text: "等等，你們兩個在聊什麼？我從二十步外就感覺到了異常的邏輯波動。", sfx: [{ text: "邏輯波動！", x: 1400, y: 300, color: "#FB923C", rotation: 5, fontSize: 95, font: "action" }] },
  { character: "luyang", text: "這位是？", effect: "surprise" },
  { character: "mengjingzhou", text: "孟景舟，問道宗弟子。我的天賦是「單身光環」——方圓三丈內，所有女性都會自動遠離我。" },
  { character: "zhoumo", text: "這也是天賦？", effect: "surprise", sfx: [{ text: "天賦？", x: 800, y: 350, color: "#F59E0B", rotation: -5, fontSize: 100, font: "playful" }] },
  { character: "mengjingzhou", text: "宗門鑒定說是「被動技能，無法關閉」。連女修都繞著我走，所以我有很充足的時間做研究。", sfx: [{ text: "被動技能！", x: 1400, y: 300, color: "#FB923C", rotation: 3, fontSize: 90, font: "playful" }] },
  { character: "luyang", text: "那你研究什麼？" },
  { character: "mengjingzhou", text: "為什麼我沒有女朋友。", sfx: [{ text: "......", x: 1300, y: 380, color: "#94A3B8", rotation: 0, fontSize: 80, font: "playful" }] },
  { character: "zhoumo", text: "你把單身當成一個研究課題？", effect: "dots" },
  { character: "mengjingzhou", text: "二十三年了。我的論文已經寫到第七篇了，題目是「論問道宗女弟子的空間分布與我的絕緣性」。", sfx: [{ text: "第七篇！", x: 600, y: 280, color: "#FB923C", rotation: -8, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "我突然覺得，我們三個有一個共同點。" },
  { character: "luyang", text: "什麼？", effect: "surprise" },
  { character: "mengjingzhou", text: "什麼？", effect: "surprise" },
  { character: "zhoumo", text: "我們都不正常。", effect: "sparkle", sfx: [{ text: "不正常！", x: 960, y: 300, color: "#F59E0B", rotation: 0, fontSize: 110, font: "brush" }] },
  { character: "luyang", text: "說得好有道理。", effect: "gloating" },
  { character: "zhoumo", text: "所以我提議，我們成立一個小組。叫「問道宗邏輯修正小組」。", sfx: [{ text: "成軍！", x: 960, y: 350, color: "#F59E0B", rotation: 0, fontSize: 120, font: "action" }] },
  { character: "mengjingzhou", text: "邏輯修正？修正什麼？" },
  { character: "zhoumo", text: "修正整個修仙界對「正常」的定義。", effect: "fire" },
  { character: "luyang", text: "我加入！不過我有一個條件——小組的第一條規則是「隨時可以投降」。", sfx: [{ text: "投降優先！", x: 400, y: 300, color: "#38BDF8", rotation: -5, fontSize: 90, font: "playful" }] },
  { character: "mengjingzhou", text: "我也有條件——開會的時候不要提「女朋友」這三個字。", effect: "anger" },
  { character: "zhoumo", text: "成交。順帶一提，我剛才忘了說——第三個鍋爐的爆炸範圍可能還沒結束。", effect: "sweat", sfx: [{ text: "忘記了！", x: 1200, y: 320, color: "#EF4444", rotation: 5, fontSize: 100, font: "brush" }] },
  { character: "luyang", text: "我的投降表呢？", effect: "shock", sfx: [{ text: "快逃！", x: 400, y: 350, color: "#EF4444", rotation: -10, fontSize: 110, font: "action" }] },
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
  const isTeamForm = currentLineIndex >= 14 && currentLineIndex <= 17;
  const isFinalPunch = currentLineIndex === dialogLines.length - 1;

  // Frame offsets
  const teamFormFrame = (14 / dialogLines.length) * durationInFrames;
  const finalFrame = ((dialogLines.length - 1) / dialogLines.length) * durationInFrames;

  const teamFormOffset = frame - teamFormFrame;
  const finalOffset = frame - finalFrame;

  // Show single aura when mengjingzhou is present
  const showSingleAura = currentLineIndex >= 0 && currentLineIndex <= 9;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="sect-gate.png"
        gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 30%, #2a1a1e 60%, #0a0a1e 100%)"
      />

      {/* Single Aura effect — blue pulsing rings around MengJingZhou */}
      {showSingleAura && (
        <SingleAuraEffect frame={frame} x={1440} y={500} />
      )}

      {/* Power-up rings at team formation */}
      {isTeamForm && (
        <PowerUpRings x={960} y={450} delay={Math.floor(teamFormFrame)} color="#F59E0B" ringCount={5} maxRadius={500} />
      )}

      {/* Impact burst at "成軍！" */}
      {teamFormOffset >= 0 && teamFormOffset < 20 && (
        <ImpactBurst x={960} y={400} delay={Math.floor(teamFormFrame)} color="#F59E0B" maxRadius={350} particleCount={20} />
      )}

      {/* System message at team formation */}
      {teamFormOffset >= 5 && teamFormOffset < 60 && (
        <SystemMessage
          text="問道宗邏輯修正小組 — 已成立"
          delay={Math.floor(teamFormFrame) + 5}
          position="center"
          color="#F59E0B"
        />
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
        <div style={{ color: "#38BDF8", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          孟景舟登場 × 三人成軍
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #38BDF8, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** Blue pulsing aura — the "單身光環" effect */
const SingleAuraEffect: React.FC<{ frame: number; x: number; y: number }> = ({ frame, x, y }) => {
  const ringCount = 3;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)", zIndex: 2 }}>
      {Array.from({ length: ringCount }).map((_, i) => {
        const phase = frame * 0.05 + i * 2;
        const radius = 80 + i * 60 + Math.sin(phase) * 20;
        const opacity = interpolate(Math.sin(phase), [-1, 1], [0.08, 0.25], {
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
            border: `2px solid rgba(56, 189, 248, ${opacity})`,
            background: `radial-gradient(circle, rgba(56, 189, 248, ${opacity * 0.3}), transparent 70%)`,
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
