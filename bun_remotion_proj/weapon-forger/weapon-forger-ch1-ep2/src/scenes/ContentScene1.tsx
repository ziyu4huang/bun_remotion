import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite, ComicEffects, DialogBox, SystemNotification, MangaSfx } from "@bun-remotion/shared";
import { notoSansTC } from "@bun-remotion/shared";
import type { DialogLine, ComicEffect, MangaSfxEvent } from "@bun-remotion/shared";
import { ScreenShake, ScreenFlash, SlashEffect, ConcentrationLines, ImpactBurst, TriangleBurst } from "../../../assets/components/BattleEffects";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene1 — 考官追責周墨，長老突然現身
 * Features: manga SFX, concentration lines, triangle bursts, screen shake
 */

const dialogLines: DialogLine[] = [
  { character: "examiner", text: "周墨，你知不知道你剛才做了什麼？你的飛劍搶了我的儲物袋！", effect: "anger", sfx: [{ text: "怒！", x: 400, y: 350, color: "#EF4444", rotation: -12, fontSize: 110, font: "action" }] },
  { character: "zhoumo", text: "技術上來說，是飛劍自己決定的。我只是寫了演算法而已。", effect: "sweat", sfx: [{ text: "嘖...", x: 1500, y: 380, color: "#60A5FA", rotation: 5, fontSize: 90, font: "playful" }] },
  { character: "examiner", text: "你還敢狡辯！你知道那裡面有多少靈石嗎？那是我三個月的薪水！", effect: "fire", sfx: [{ text: "啊啊啊！", x: 350, y: 300, color: "#FF6B35", rotation: -8, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "這恰好證明了飛劍的目標鎖定功能非常精準。這是一個亮點。" },
  { character: "examiner", text: "亮點？！你管搶劫叫亮點？！", effect: "shock", sfx: [{ text: "什麼？！", x: 400, y: 320, color: "#FFD700", rotation: -10, fontSize: 105, font: "action" }] },
  { character: "zhoumo", text: "請冷靜。我願意用我剩下的材料來賠償。我還有一個自動按摩陣法和一個智能鬧鐘。", effect: "sweat" },
  { character: "examiner", text: "......誰要你的智能鬧鐘啊。", effect: "dots" },
  { character: "examiner", text: "我宣布，你的入宗考試——" },
  { character: "elder", text: "等一下。", sfx: [{ text: "咚！", x: 960, y: 450, color: "#A78BFA", rotation: 0, fontSize: 130, font: "brush" }] },
  { character: "examiner", text: "長、長老？！", effect: "surprise", sfx: [{ text: "嚇！", x: 400, y: 320, color: "#34D399", rotation: -15, fontSize: 120, font: "brush" }] },
  { character: "elder", text: "讓我看看這個年輕人的作品。" },
  { character: "elder", text: "這把飛劍......三個微型隱藏機關、指紋識別陣法、自動格式化模組......" },
  { character: "elder", text: "你是說，這把劍會自己找目標、自己鎖定、還有防盜系統？", effect: "sparkle" },
  { character: "zhoumo", text: "是的！我追求的是使用者體驗和底層邏輯閉環。", effect: "sparkle", sfx: [{ text: "閃亮！", x: 1500, y: 350, color: "#FBBF24", rotation: 8, fontSize: 95, font: "playful" }] },
  { character: "elder", text: "有意思......非常有意思。", effect: "gloating", sfx: [{ text: "嗯哼～", x: 960, y: 380, color: "#A78BFA", rotation: 5, fontSize: 90, font: "playful" }] },
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

  // Dramatic moments
  const isAngerPhase = currentLineIndex >= 0 && currentLineIndex <= 4;
  const isElderEntrance = currentLineIndex >= 8 && currentLineIndex <= 9;
  const isElderReview = currentLineIndex >= 10 && currentLineIndex <= 12;

  // Elder entrance: screen shake + flash
  const elderEntranceFrame = (8 / dialogLines.length) * durationInFrames;
  const elderFrame = frame - elderEntranceFrame;

  // Concentration lines during elder entrance
  const showConcentration = isElderEntrance;

  // Slash effect when examiner is angry (line 0)
  const slashStart = (0 / dialogLines.length) * durationInFrames;
  const slashFrame = frame - slashStart;

  // System notification at elder review
  const showElderReview = currentLineIndex >= 10 && currentLineIndex < 13;

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Determine active SFX for current line
  const currentSfx = currentLine.sfx ?? [];

  return (
    <AbsoluteFill>
      <ScreenShake
        delay={isElderEntrance ? Math.floor(elderEntranceFrame) : undefined}
        intensity={15}
        duration={20}
      >
        <BackgroundLayer
          image="sect-gate.png"
          gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 30%, #1a0a2e 60%, #0a0a2e 100%)"
        />

        {/* Concentration lines during elder entrance */}
        {showConcentration && (
          <ConcentrationLines delay={Math.floor(elderEntranceFrame)} angle={45} lineCount={30} duration={35} color="rgba(167, 139, 250, 0.4)" />
        )}

        {/* Triangle burst at elder entrance */}
        {isElderEntrance && (
          <TriangleBurst x={960} y={500} delay={Math.floor(elderEntranceFrame)} color="#A78BFA" count={8} maxRadius={350} />
        )}

        {/* Impact burst at elder entrance */}
        {elderFrame >= 0 && elderFrame < 25 && (
          <ImpactBurst x={960} y={500} delay={Math.floor(elderEntranceFrame)} color="#A78BFA" maxRadius={300} particleCount={20} />
        )}

        {/* Characters */}
        <CharacterSprite
          character="zhoumo"
          characterConfig={CHARACTERS.zhoumo}
          image="characters/zhoumo.png"
          chibi={false}
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
          chibi={false}
          chibiImage="characters/examiner-chibi.png"
          speaking={currentLine.character === "examiner"}
          side="right"
          background={currentLine.character !== "examiner"}
          effects={currentLine.character === "examiner" ? currentEffects : []}
        />

        {/* Elder appears from line 8 */}
        {currentLineIndex >= 8 && (
          <CharacterSprite
            character="elder"
            characterConfig={CHARACTERS.elder}
            image="characters/elder.png"
            speaking={currentLine.character === "elder"}
            side="center"
            background={currentLine.character !== "elder"}
            effects={currentLine.character === "elder" ? currentEffects : []}
          />
        )}

        <ComicEffects
          effects={currentEffects.filter((e) => e !== "shake")}
          side={currentLine.character === "zhoumo" ? "left" : currentLine.character === "elder" ? "center" : "right"}
        />

        {/* Slash effect at anger moment */}
        {slashFrame >= 0 && slashFrame < 30 && (
          <>
            <SlashEffect delay={0} direction="rtl" color="#EF4444" thickness={5} />
            <ScreenFlash delay={0} duration={5} color="#EF4444" />
          </>
        )}

        {/* Manga SFX overlay */}
        <MangaSfx events={currentSfx} />

        {/* System notification during elder review */}
        {showElderReview && (
          <SystemNotification
            text="長老評審中：分析飛劍結構"
            type="success"
            delay={Math.max(0, frame - (10 / dialogLines.length) * durationInFrames)}
          />
        )}

        <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

        {/* Scene indicator */}
        <div style={{
          position: "absolute", top: 40, left: 60,
          opacity: indicatorOpacity, zIndex: 50,
        }}>
          <div style={{ color: "#A78BFA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
            成績公布
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
