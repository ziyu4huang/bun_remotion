import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite, ComicEffects, SystemNotification, DialogBox, MangaSfx, notoSansTC } from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import { CHARACTERS, type Character } from "../../../assets/characters";

/**
 * ContentScene2 — 智商測試開始，水晶球答題，逃出秘境
 * Features: IQ test question, MVP joke, crystal ball correct answer, escape
 */

const dialogLines: DialogLine[] = [
  { character: "zhoumo" as any, text: "水晶球亮起，投射出第一道題目：「一個法寶製造者造了一把能切斷一切的劍，但他忘記加了一個功能。請問是什麼？」" },
  { character: "luyang" as any, text: "「停下來的功能」。周墨，這題是不是在說你？", effect: "sparkle" as ComicEffect, sfx: [{ text: "在說你！", x: 500, y: 300, color: "#38BDF8", rotation: -10, fontSize: 100, font: "playful" }] },
  { character: "zhoumo" as any, text: "這是一道陷阱題。答案不可能是這麼簡單的。" },
  { character: "mengjingzhou" as any, text: "但這確實就是你幹的事啊。你的雷射筆沒有方向限制，沒有範圍限制，也沒有停止按鈕。", effect: "dots" as ComicEffect, sfx: [{ text: "沒有按鈕！", x: 1300, y: 320, color: "#FB923C", rotation: 5, fontSize: 95, font: "brush" }] },
  { character: "zhoumo" as any, text: "那不叫「忘記加」，那叫「最小可行性產品」。啟動創業的人都知道——先上線，再迭代。", effect: "sparkle" as ComicEffect, sfx: [{ text: "MVP！", x: 960, y: 280, color: "#34D399", rotation: 0, fontSize: 110, font: "action" }] },
  { character: "luyang" as any, text: "你這個迭代會把我們送走。", effect: "sweat" as ComicEffect },
  { character: "zhoumo" as any, text: "水晶球亮起綠光——答案正確。石門深處傳來新的通道開啟的聲音。", sfx: [{ text: "正確！", x: 960, y: 250, color: "#34D399", rotation: 0, fontSize: 120, font: "action" }] },
  { character: "mengjingzhou" as any, text: "等等，正確答案就是「停止功能」？那周墨的歪理居然答對了？", effect: "surprise" as ComicEffect, sfx: [{ text: "答對了？", x: 600, y: 350, color: "#FB923C", rotation: -5, fontSize: 100, font: "playful" }] },
  { character: "zhoumo" as any, text: "不是歪理，是產品哲學。上古大能顯然也是個有經驗的項目管理者。" },
  { character: "luyang" as any, text: "倒數還剩六十息！快走！", effect: "shock" as ComicEffect, sfx: [{ text: "快走！", x: 960, y: 280, color: "#EF4444", rotation: 0, fontSize: 120, font: "action" }] },
  { character: "zhoumo" as any, text: "三人衝進新開啟的通道。身後的大廳開始崩塌。周墨回頭看了一眼——水晶球上浮現出最後一行字：「測試結果：勉強及格。恭喜你們沒有笨到死在這裡。」", effect: "shake" as ComicEffect },
  { character: "zhoumo" as any, text: "……這個上古大能的評價系統有待改進。", effect: "sweat" as ComicEffect, sfx: [{ text: "勉強及格", x: 960, y: 300, color: "#A78BFA", rotation: 3, fontSize: 100, font: "brush" }] },
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
  const currentEffects = normalizeEffects(currentLine.effect as ComicEffect | undefined);
  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const crystalGlow = interpolate(frame % 90, [0, 45, 90], [0.3, 0.6, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const countdownValue = Math.max(0, 60 - Math.floor(frame / 4));

  const correctFrame = (6 / dialogLines.length) * durationInFrames;
  const correctOffset = frame - correctFrame;
  const showCorrectFlash = correctOffset >= 0 && correctOffset < 20;

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="cave.png"
        gradient="linear-gradient(135deg, #0a0a1e 0%, #0a0a2e 30%, #1a0a2e 60%, #0a0a1e 100%)"
      />

      {/* Crystal ball glow */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(167, 139, 250, ${crystalGlow * 0.15}) 0%, transparent 70%)`,
        filter: "blur(40px)",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      {/* Green flash for correct answer */}
      {showCorrectFlash && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, rgba(52, 211, 153, ${interpolate(correctOffset, [0, 10, 20], [0, 0.3, 0])}), transparent 70%)`,
          zIndex: 30,
          pointerEvents: "none",
        }} />
      )}

      {/* Countdown timer */}
      {currentLineIndex >= 9 && (
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
        }}>
          <div style={{ fontSize: 18, color: "#EF4444", fontWeight: 700, letterSpacing: "0.1em" }}>
            自毀倒數
          </div>
          <div style={{
            fontSize: 48,
            fontWeight: 900,
            color: "#EF4444",
            textShadow: "0 0 20px rgba(239, 68, 68, 0.6)",
            fontVariantNumeric: "tabular-nums",
          }}>
            {countdownValue}息
          </div>
        </div>
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

      <CharacterSprite
        character="mengjingzhou"
        characterConfig={CHARACTERS.mengjingzhou}
        image="characters/mengjingzhou.png"
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

      <MangaSfx events={currentSfx} />

      {/* System notification for correct answer */}
      {currentLineIndex === 6 && (
        <SystemNotification
          text="智商測試：答案正確 — 「停止功能」"
          type="success"
          delay={0}
        />
      )}

      {/* Crystal ball verdict */}
      {currentLineIndex === 10 && (
        <SystemNotification
          text="測試結果：勉強及格 — 恭喜你們沒有笨到死在這裡"
          type="info"
          delay={0}
        />
      )}

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#A78BFA", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          智商測試 × 逃出生天
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #A78BFA, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
