import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Img, staticFile } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { PowerUpRings, ImpactBurst, ScreenFlash } from "../../../assets/components/BattleEffects";
import { CharacterSprite, ComicEffects, DialogBox, SystemMessage, SystemNotification, MangaSfx, notoSansTC } from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene2 — 修復殘魂 + 家族遺傳
 * Features: repair FX (PowerUpRings + ImpactBurst), soul memory recovery ScreenFlash,
 * running gag punchline with SFX
 */

const dialogLines: DialogLine[] = [
  { character: "mengjingzhou", text: "所以這個上古劍仙其實是一個記憶體壞掉的人工智慧？", sfx: [{ text: "AI？", x: 1400, y: 320, color: "#FB923C", rotation: -5, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "更精確地說，是「靈魂驅動的自動防禦系統」。我來修復他。" },
  { character: "soul", text: "你——你要修復吾？三千年来，你是第一個不逃跑的人。", effect: "surprise" },
  { character: "zhoumo", text: "當然。這只是常規維護。修好了，以後別再大喊大叫。", sfx: [{ text: "維護中...", x: 960, y: 300, color: "#34D399", rotation: 0, fontSize: 90, font: "brush" }] },
  { character: "soul", text: "吾想起了……吾是滄溟子，問道宗第三代長老。吾把畢生修為煉成了一把劍——但是忘記放哪了。", effect: "dots", sfx: [{ text: "記憶恢復！", x: 960, y: 280, color: "#A78BFA", rotation: 0, fontSize: 100, font: "action" }] },
  { character: "luyang", text: "三千年前的長老也忘東西？", effect: "surprise", sfx: [{ text: "也忘？", x: 600, y: 350, color: "#38BDF8", rotation: -8, fontSize: 90, font: "playful" }] },
  { character: "zhoumo", text: "忘加位置標記是普遍性問題。不過至少他不再重複那句話了。" },
  { character: "mengjingzhou", text: "等一下，他煉的那把劍——煉器峰傳說中的「滄溟之劍」不會就是吧？", effect: "shock", sfx: [{ text: "滄溟之劍！", x: 960, y: 280, color: "#F59E0B", rotation: 0, fontSize: 110, font: "brush" }] },
  { character: "zhoumo", text: "有意思。那把劍被列為宗門至寶，但沒有人能拔出來。" },
  { character: "soul", text: "吾知道原因。吾當年……忘記加拔劍按鈕了。", effect: "sweat", sfx: [{ text: "忘記了！", x: 1200, y: 320, color: "#A78BFA", rotation: 5, fontSize: 100, font: "brush" }] },
  { character: "zhoumo", text: "原來忘加按鈕是家族遺傳。", effect: "sparkle", sfx: [{ text: "家族遺傳！", x: 960, y: 300, color: "#F59E0B", rotation: 0, fontSize: 120, font: "action" }] },
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
  const isRepairing = currentLineIndex >= 3 && currentLineIndex <= 4;
  const repairFrame = (3 / dialogLines.length) * durationInFrames;
  const repairOffset = frame - repairFrame;

  const isMemoryRecovered = currentLineIndex === 4;
  const memFrame = (4 / dialogLines.length) * durationInFrames;
  const memOffset = frame - memFrame;

  const isFinalPunch = currentLineIndex === dialogLines.length - 1;
  const finalFrame = ((dialogLines.length - 1) / dialogLines.length) * durationInFrames;
  const finalOffset = frame - finalFrame;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="sect-gate.png"
        gradient="linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 30%, #1a0a2e 60%, #0a0a1e 100%)"
      />

      {/* Repair power-up rings */}
      {isRepairing && repairOffset >= 0 && (
        <PowerUpRings x={960} y={450} delay={Math.floor(repairFrame)} color="#34D399" ringCount={4} maxRadius={400} />
      )}

      {/* Repair impact burst */}
      {repairOffset >= 0 && repairOffset < 20 && (
        <ImpactBurst x={960} y={400} delay={Math.floor(repairFrame)} color="#34D399" maxRadius={300} particleCount={16} />
      )}

      {/* Memory recovery flash */}
      {memOffset >= 0 && memOffset < 12 && (
        <ScreenFlash delay={Math.floor(memFrame)} duration={10} color="#A78BFA" />
      )}

      {/* Soul ghostly aura */}
      <SoulAuraEffect frame={frame} />

      {/* System message at memory recovery */}
      {isMemoryRecovered && memOffset >= 5 && memOffset < 60 && (
        <SystemMessage
          text="記憶區段修復完成 — 滄溟子（第三代長老）"
          delay={Math.floor(memFrame) + 5}
          position="center"
          color="#A78BFA"
        />
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
        character="luyang"
        characterConfig={CHARACTERS.luyang}
        image="characters/luyang.png"
        speaking={currentLine.character === "luyang"}
        side="center"
        background={currentLine.character !== "luyang"}
        effects={currentLine.character === "luyang" ? currentEffects : []}
      />

      {/* MengJingZhou visible from start of scene */}
      <CharacterSprite
        character="mengjingzhou"
        characterConfig={CHARACTERS.mengjingzhou}
        image="characters/mengjingzhou.png"
        speaking={currentLine.character === "mengjingzhou"}
        side="right"
        background={currentLine.character !== "mengjingzhou"}
        effects={currentLine.character === "mengjingzhou" ? currentEffects : []}
      />

      {/* Soul — uses elder.png with transparency (center position, behind characters) */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 300,
        height: "70%",
        zIndex: 1,
        opacity: isRepairing && repairOffset >= 0 ? 0.8 : 0.5 + Math.sin(frame * 0.05) * 0.1,
        filter: isRepairing && repairOffset >= 10 ? "brightness(1.4) saturate(0.8)" : "brightness(1.2) saturate(0.5)",
        transition: "filter 0.5s, opacity 0.5s",
      }}>
        <Img
          src={staticFile("characters/elder.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
            filter: "drop-shadow(0 0 25px rgba(167, 139, 250, 0.5))",
          }}
        />
      </div>

      <ComicEffects
        effects={currentEffects.filter((e) => e !== "shake")}
        side={
          currentLine.character === "zhoumo" ? "left"
          : currentLine.character === "luyang" ? "center"
          : currentLine.character === "mengjingzhou" ? "right"
          : "center"
        }
      />

      {/* Manga SFX */}
      <MangaSfx events={currentSfx} />

      {/* System notification at repair */}
      {isRepairing && repairOffset >= 0 && repairOffset < 60 && (
        <SystemNotification
          text="靈魂驅動系統 — 常規維護中"
          type="success"
          delay={0}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#34D399", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          修復殘魂 × 家族遺傳
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #34D399, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** Purple pulsing aura for the remnant soul */
const SoulAuraEffect: React.FC<{ frame: number }> = ({ frame }) => {
  const ringCount = 3;
  return (
    <div style={{ position: "absolute", left: 960, top: 450, transform: "translate(-50%, -50%)", zIndex: 0 }}>
      {Array.from({ length: ringCount }).map((_, i) => {
        const phase = frame * 0.04 + i * 2;
        const radius = 70 + i * 45 + Math.sin(phase) * 12;
        const opacity = interpolate(Math.sin(phase), [-1, 1], [0.04, 0.15], {
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
            background: `radial-gradient(circle, rgba(167, 139, 250, ${opacity * 0.15}), transparent 70%)`,
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
