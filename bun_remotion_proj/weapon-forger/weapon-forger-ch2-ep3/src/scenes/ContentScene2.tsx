import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite, ComicEffects, DialogBox, SystemNotification, MangaSfx, notoSansTC } from "@bun-remotion/shared";
import type { DialogLine, ComicEffect } from "@bun-remotion/shared";
import { CHARACTERS, type Character } from "../../../assets/characters";
import { getSegmentTiming } from "./useSegmentTiming";

/**
 * ContentScene2 — 點讚戰爭：書的攻擊、認可系統、自動評價災難
 * Features: flying books, like button, auto-evaluation system gone wrong
 *
 * Narration segments: 20 (7 narrator + 13 dialog)
 * isDialog maps each narration segment: false=narrator, true=dialog
 */
const SEGMENT_IS_DIALOG = [
  false, // narrator: 三人來到藏經閣廢墟...
  true,  // luyang: 什麼——！
  false, // narrator: 書本直接搶走了...
  true,  // luyang: 那是我的投降表！
  false, // narrator: 另一本書飛向孟景舟...
  true,  // mengjingzhou: 等等……這本書在批改我的論文？
  true,  // zhoumo: 有趣。這些書的攻擊行為...
  true,  // luyang: 所以你的意思是……
  true,  // zhoumo: 從工程學的角度來說...
  false, // narrator: 周墨掏出一個小裝置...
  true,  // mengjingzhou: 就……就這樣？
  true,  // zhoumo: 我給每本書加了一個「認可系統」...
  true,  // luyang: 但是周墨……藏經閣裡所有的書都在看著你。
  false, // narrator: 數百本書同時翻開...
  true,  // zhoumo: ……我來給它們加一個「自動評價系統」。
  false, // narrator: 三天後。藏經閣裡的書開始互相寫評論...
  true,  // mengjingzhou: 周墨，你的自動評價系統出了問題...
  true,  // zhoumo: 啊……我忘記加「評價標準」了...
  true,  // luyang: 會把衣服做成正方形。
  true,  // zhoumo: ……我本來想說「會亂剪一氣」...
];

const dialogLines: DialogLine[] = [
  { character: "luyang", text: "什麼——！", effect: "shock", sfx: [{ text: "飛書攻擊！", x: 960, y: 300, color: "#38BDF8", rotation: 0, fontSize: 110, font: "action" }] },
  { character: "luyang", text: "那是我的投降表！那是我精心設計的！裡面有十七種投降姿勢的插圖！", effect: "cry", sfx: [{ text: "十七種！", x: 600, y: 350, color: "#38BDF8", rotation: -8, fontSize: 95, font: "brush" }] },
  { character: "mengjingzhou", text: "等等……這本書在批改我的論文？它加了一行：「論點不成立，建議重寫」——還畫了一個大大的叉。", effect: "shock", sfx: [{ text: "論點不成立", x: 1200, y: 320, color: "#EF4444", rotation: 3, fontSize: 85, font: "playful" }] },
  { character: "zhoumo", text: "有趣。這些書的攻擊行為，本質上是「尋求關注」。三百年沒有人閱讀它們，它們的防禦機制是對「被忽視」的反應。", sfx: [{ text: "尋求關注", x: 960, y: 280, color: "#F59E0B", rotation: 0, fontSize: 95, font: "brush" }] },
  { character: "luyang", text: "所以你的意思是……這些書在鬧脾氣？", effect: "dots" },
  { character: "zhoumo", text: "從工程學的角度來說，這是一個「缺乏正向回饋的系統」。解決方案很簡單——給它們「點讚」。", sfx: [{ text: "點讚！", x: 960, y: 300, color: "#34D399", rotation: 0, fontSize: 110, font: "action" }] },
  { character: "mengjingzhou", text: "就……就這樣？", effect: "surprise", sfx: [{ text: "就這樣？", x: 1300, y: 320, color: "#FB923C", rotation: -5, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "我給每本書加了一個「認可系統」。它們得到了三百年來第一個正向評價。問題解決。", effect: "sparkle", sfx: [{ text: "問題解決！", x: 960, y: 300, color: "#34D399", rotation: 0, fontSize: 100, font: "action" }] },
  { character: "luyang", text: "但是周墨……藏經閣裡所有的書都在看著你。" },
  { character: "mengjingzhou", text: "數百本書同時翻開，書頁發出沙沙聲，仿佛在說——「我的呢？」", effect: "shock", sfx: [{ text: "我的呢？", x: 960, y: 350, color: "#FB923C", rotation: 5, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "……我來給它們加一個「自動評價系統」。", effect: "sweat", sfx: [{ text: "自動評價系統", x: 960, y: 280, color: "#F59E0B", rotation: 0, fontSize: 95, font: "brush" }] },
  { character: "mengjingzhou", text: "三天後。藏經閣裡的書開始互相寫評論。一本《劍道入門》給自己打了五星，評語是「本世紀最偉大的著作」。" },
  { character: "mengjingzhou", text: "周墨，你的自動評價系統出了問題。這些書的文學水平直線下降——它們現在只會互相吹捧。", effect: "sweat", sfx: [{ text: "文學崩壞", x: 600, y: 350, color: "#FB923C", rotation: -3, fontSize: 95, font: "brush" }] },
  { character: "zhoumo", text: "啊……我忘記加「評價標準」了。沒有標準的評價系統，就像沒有尺的裁縫——", effect: "sweat", sfx: [{ text: "忘了標準！", x: 960, y: 300, color: "#F59E0B", rotation: 5, fontSize: 100, font: "brush" }] },
  { character: "luyang", text: "會把衣服做成正方形。", effect: "laugh", sfx: [{ text: "正方形！", x: 1300, y: 320, color: "#38BDF8", rotation: -5, fontSize: 100, font: "playful" }] },
  { character: "zhoumo", text: "……我本來想說「會亂剪一氣」，但你的比喻更好。", effect: "dots" },
];

export const ContentScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const { lineIndex: segLineIdx, lineFrame: segLineFrame } = getSegmentTiming(frame, "ContentScene2", SEGMENT_IS_DIALOG);
  const currentLineIndex = segLineIdx >= 0 ? Math.min(segLineIdx, dialogLines.length - 1) : 0;
  const currentLine = dialogLines[currentLineIndex];
  const currentEffects = normalizeEffects(currentLine.effect);

  // Key moments
  const isBookAttack = currentLineIndex >= 0 && currentLineIndex <= 2;
  const bookAttackFrame = (0 / dialogLines.length) * durationInFrames;
  const bookAttackOffset = frame - bookAttackFrame;

  const isLikeButton = currentLineIndex >= 5 && currentLineIndex <= 7;
  const likeFrame = (5 / dialogLines.length) * durationInFrames;
  const likeOffset = frame - likeFrame;

  const isAutoEval = currentLineIndex >= 10 && currentLineIndex <= 12;
  const evalFrame = (10 / dialogLines.length) * durationInFrames;
  const evalOffset = frame - evalFrame;

  const currentSfx = currentLine.sfx ?? [];

  const indicatorOpacity = interpolate(frame, [0, 15, 45, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <BackgroundLayer
        image="sect-gate.png"
        gradient={`linear-gradient(135deg, #0a0a1e 0%, #0a0a2e 30%, ${
          isAutoEval ? "#1a1a0a" : "#1a0a2e"
        } 60%, #0a0a1e 100%)`}
      />

      {/* Flying books effect during book attack */}
      {isBookAttack && bookAttackOffset >= 0 && (
        <FlyingBooksEffect frame={frame} startFrame={bookAttackFrame} />
      )}

      {/* Like button sparkle effect */}
      {isLikeButton && likeOffset >= 0 && likeOffset < 40 && (
        <LikeButtonEffect frame={frame} startFrame={likeFrame} />
      )}

      {/* Auto-evaluation notification */}
      {isAutoEval && evalOffset >= 5 && evalOffset < 80 && (
        <SystemNotification
          text="系統通知：自動評價系統已啟動 — 評價標準：未設定"
          type="warning"
          delay={5}
        />
      )}

      {/* Fake review overlay during auto-eval */}
      {currentLineIndex >= 11 && (
        <FakeReviewOverlay frame={frame} startFrame={evalFrame} />
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

      {/* Manga SFX */}
      <MangaSfx events={currentSfx} />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} overrideLineIndex={currentLineIndex} overrideLineFrame={segLineFrame} getCharacterConfig={(id) => CHARACTERS[id as Character]} />

      {/* Scene indicator */}
      <div style={{
        position: "absolute", top: 40, left: 60,
        opacity: indicatorOpacity, zIndex: 50,
      }}>
        <div style={{ color: "#FB923C", fontSize: 24, fontWeight: 700, fontFamily: notoSansTC }}>
          點讚戰爭 × 自動評價災難
        </div>
        <div style={{
          width: interpolate(frame, [5, 25], [0, 200], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          height: 2, background: "linear-gradient(90deg, #FB923C, transparent)", marginTop: 4,
        }} />
      </div>
    </AbsoluteFill>
  );
};

/** Flying books animation — books swooping across screen */
const FlyingBooksEffect: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const offset = frame - startFrame;
  const opacity = interpolate(offset, [0, 5, 60, 80], [0, 0.8, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const books = [
    { delay: 0, startX: -100, startY: 200, endX: 1800, endY: 500 },
    { delay: 8, startX: 2000, startY: 400, endX: -50, endY: 300 },
    { delay: 15, startX: -80, startY: 600, endX: 1900, endY: 350 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity, zIndex: 15, pointerEvents: "none" }}>
      {books.map((book, i) => {
        const bOffset = Math.max(0, offset - book.delay);
        const progress = interpolate(bOffset, [0, 30], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const x = interpolate(progress, [0, 1], [book.startX, book.endX]);
        const y = interpolate(progress, [0, 1], [book.startY, book.endY]) + Math.sin(bOffset * 0.5) * 30;
        const rotation = bOffset * 8;
        const bookOpacity = interpolate(bOffset, [0, 5, 25, 30], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: 60, height: 45,
            background: "linear-gradient(135deg, #8B4513, #D2691E)",
            border: "2px solid #5C3317",
            borderRadius: "2px 6px 6px 2px",
            transform: `rotate(${rotation}deg)`,
            opacity: bookOpacity,
            boxShadow: "2px 2px 8px rgba(0,0,0,0.5)",
          }}>
            <div style={{
              position: "absolute", left: 4, top: 2, bottom: 2, width: 3,
              background: "#FFD700", borderRadius: 1,
            }} />
          </div>
        );
      })}
    </div>
  );
};

/** Like button sparkle — thumbs-up particles */
const LikeButtonEffect: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const offset = frame - startFrame;
  const opacity = interpolate(offset, [0, 5, 35, 40], [0, 1, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const particles = Array.from({ length: 8 }, (_, i) => ({
    x: 960 + Math.cos((i / 8) * Math.PI * 2) * (50 + offset * 4),
    y: 450 + Math.sin((i / 8) * Math.PI * 2) * (50 + offset * 4),
    size: 12 + Math.sin(i) * 6,
    delay: i * 2,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, opacity, zIndex: 15, pointerEvents: "none" }}>
      {/* Central like button */}
      <div style={{
        position: "absolute", left: 920, top: 410,
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, #34D399, #059669)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 40, color: "#fff",
        boxShadow: "0 0 30px rgba(52, 211, 153, 0.6)",
        transform: `scale(${interpolate(offset, [0, 10], [0, 1.2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
      }}>
        👍
      </div>
      {/* Sparkle particles */}
      {particles.map((p, i) => {
        const pOffset = Math.max(0, offset - p.delay);
        const pOpacity = interpolate(pOffset, [0, 5, 15], [0, 0.8, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={i} style={{
            position: "absolute", left: p.x, top: p.y,
            width: p.size, height: p.size,
            background: "#FFD700",
            clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
            opacity: pOpacity,
          }} />
        );
      })}
    </div>
  );
};

/** Fake review overlay — floating review cards during auto-evaluation disaster */
const FakeReviewOverlay: React.FC<{ frame: number; startFrame: number }> = ({ frame, startFrame }) => {
  const offset = frame - startFrame;
  const opacity = interpolate(offset, [0, 20], [0, 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const reviews = [
    { text: "《劍道入門》★★★★★\n本世紀最偉大的著作", x: 1500, y: 150, delay: 0 },
    { text: "《煉丹基礎》★★★★★\n超越了上古大能", x: 150, y: 600, delay: 15 },
    { text: "《符咒大全》★★★★★\n看完直接渡劫成功", x: 1550, y: 700, delay: 30 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity, zIndex: 12, pointerEvents: "none" }}>
      {reviews.map((review, i) => {
        const rOffset = Math.max(0, offset - review.delay);
        const rOpacity = interpolate(rOffset, [0, 10, 80, 100], [0, 0.9, 0.9, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const rY = review.y + Math.sin(rOffset * 0.05) * 5;

        return (
          <div key={i} style={{
            position: "absolute", left: review.x, top: rY,
            padding: "10px 16px",
            background: "rgba(0, 0, 0, 0.7)",
            border: "1px solid rgba(255, 215, 0, 0.4)",
            borderRadius: 8,
            fontFamily: notoSansTC,
            fontSize: 16,
            color: "#FFD700",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            opacity: rOpacity,
            maxWidth: 250,
          }}>
            {review.text}
          </div>
        );
      })}
    </div>
  );
};

function normalizeEffects(effect?: ComicEffect | ComicEffect[]): ComicEffect[] {
  if (!effect) return [];
  return (Array.isArray(effect) ? effect : [effect]) as ComicEffect[];
}
