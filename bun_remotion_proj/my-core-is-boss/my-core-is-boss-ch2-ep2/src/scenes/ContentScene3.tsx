import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundLayer } from "../../../assets/components/BackgroundLayer";
import { CharacterSprite } from "../../../assets/components/CharacterSprite";
import { DialogBox } from "../../../assets/components/DialogBox";
import { ComicEffects } from "../../../assets/components/ComicEffects";
import { normalizeEffects, CHARACTERS, type ComicEffect } from "../../../assets/characters";
import { SceneIndicator } from "../../../assets/components/SceneIndicator";
import { SystemNotification } from "../../../assets/components/SystemOverlay";
import { getLineIndex } from "../../../assets/components/dialogTiming";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const segmentDurations: Record<string, number[]> = (() => {
  try { return require("../../audio/segment-durations.json"); }
  catch { return {}; }
})();

const SCENE_NAME = "ContentScene3";

const dialogLines = [
  { character: "narrator" as const, text: "蕭長老接到弟子通報：靈獸洞窟出現異常靈力波動。他趕到現場，看到了讓他三觀再次碎裂的一幕。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "這、這是怎麼回事？整個洞窟的妖獸都集中在這裡？！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "蕭長老！你看——師兄在進行「萬獸朝聖」！妖獸們自願歸順！", emotion: "gloating" as const },
  { character: "xiaoelder" as const, text: "萬獸朝聖……這、這是古籍中記載的上古神通！只有渡劫期以上的大能才能——", emotion: "shock" as const },
  { character: "linyi" as const, text: "哦蕭長老你也來了。對了，你知不知道這洞窟有沒有更高級的怪物？這些低等的經驗值太少了。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "低等……這些都是築基期的妖獸！你居然說「經驗值太少」？！", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "linyi" as const, text: "對啊，一隻才給二百經驗。我現在升一級要三萬，得刷一百五十隻。有沒有金丹期的怪？那個經驗值應該比較高。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "金丹期的妖獸……在洞窟深處……但你、你一個人進去的話……", emotion: "sweat" as const },
  { character: "linyi" as const, text: "沒事，反正一刀一個。對了，系統顯示我已經刷了三百隻了，任務進度百分之六十。再刷兩百隻就搞定。", emotion: "smile" as const },
  { character: "xiaoelder" as const, text: "三……三百隻……", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "narrator" as const, text: "蕭長老看著系統面板上的「擊殺統計：307」，又看了看周圍乖乖排隊的妖獸群，陷入了深深的沉思。", emotion: "default" as const },
  { character: "xiaoelder" as const, text: "老夫是不是……也應該去洞窟刷刷妖獸？", emotion: "sweat" as const, effect: "sweat" as ComicEffect },
  { character: "zhaoxiaoqi" as const, text: "蕭長老！您也悟了嗎？！", emotion: "shock" as const },
  { character: "xiaoelder" as const, text: "不……老夫什麼都沒說……", emotion: "cry" as const },
  { character: "narrator" as const, text: "蕭長老的修行觀念，正在以肉眼可見的速度崩塌。", emotion: "default" as const },
];

export const ContentScene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = getLineIndex(
    frame,
    durationInFrames,
    dialogLines.length,
    segmentDurations[SCENE_NAME],
  );
  const currentLine = dialogLines[currentLineIndex];

  // System notification: kill count at ~70% through scene
  const showKillCount = frame >= durationInFrames * 0.55 && frame <= durationInFrames * 0.75;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="spirit-beast-cave.png" />

      {/* Warm amber torchlight — CS3 accent */}
      <div style={{
        position: "absolute", bottom: -100, left: "20%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Scene indicator */}
      <SceneIndicator text="靈獸洞窟·十字路口" color="#FBBF24" />

      {/* System: kill count notification */}
      {showKillCount && (
        <SystemNotification
          text="擊殺統計：307 | 任務進度：61%"
          type="info"
          delay={0}
        />
      )}

      {/* Lin Yi — left */}
      <CharacterSprite
        character="linyi"
        emotion={currentLine.character === "linyi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "linyi"}
        side="left"
        background={currentLine.character !== "linyi"}
        effects={currentLine.character === "linyi" ? normalizeEffects(currentLine.effect) : []}
      />

      {/* Zhao Xiaoqi — right (appears from line 2) */}
      {currentLineIndex >= 2 && (
        <CharacterSprite
          character="zhaoxiaoqi"
          emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "zhaoxiaoqi"}
          side="right"
          background={currentLine.character !== "zhaoxiaoqi"}
          effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

      {/* Xiaoelder — center (appears from line 1) */}
      {currentLineIndex >= 1 && (
        <CharacterSprite
          character="xiaoelder"
          emotion={currentLine.character === "xiaoelder" ? currentLine.emotion : "default"}
          speaking={currentLine.character === "xiaoelder"}
          side="center"
          background={currentLine.character !== "xiaoelder"}
          effects={currentLine.character === "xiaoelder" ? normalizeEffects(currentLine.effect) : []}
        />
      )}

      {/* Comic effects */}
      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      {/* Dialog box */}
      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
