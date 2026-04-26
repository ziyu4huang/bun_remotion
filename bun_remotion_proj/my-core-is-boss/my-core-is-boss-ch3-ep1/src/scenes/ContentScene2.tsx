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

const SCENE_NAME = "ContentScene2";

const dialogLines = [
  { character: "narrator" as const, text: "趙小七站在秘境入口旁，手裡捧著自製的計時沙漏。自從觀察林逸以來，她養成了一個新習慣——記錄林逸做每件事的時間。沙漏上方刻著「林逸師兄行動計時器」。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "師、師兄？！他、他穿過去了？！不是破壁，不是碎壁——是穿過去！", emotion: "shock" as const, effect: "shock" as ComicEffect },
  { character: "narrator" as const, text: "三分鐘後，秘境深處傳來一道通知音。系統的全息公告浮現在秘境入口上方：「秘境通關。用時：三分零七秒。評價：三S。歷史最短紀錄。前三千年的最短紀錄是三年。」", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "三分鐘……三分鐘！三千年的秘境！師兄用三分鐘走完了三千年無人走通的路！", emotion: "shock" as const, effect: "fire" as ComicEffect },
  { character: "narrator" as const, text: "趙小七瘋了似地翻開新筆記本，標題：《速通記錄簿：林逸師兄三分鐘破三千年秘境全紀錄》。", emotion: "default" as const },
  { character: "zhaoxiaoqi" as const, text: "虛空漫步！古籍記載，唯有超越空間法則的存在才能不破壞而穿越——師兄已經掌控了虛空法則本身！他不是在走路，他是在改寫空間！", emotion: "gloating" as const, effect: "gloating" as ComicEffect },
  { character: "narrator" as const, text: "旁邊排隊的修行者們集體石化。有人低聲問：「那個穿牆的……是哪個宗門的？」另一人回答：「天道宗的……聽說是個外門弟子。」空氣瞬間安靜了。", emotion: "default" as const },
];

export const ContentScene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const currentLineIndex = getLineIndex(
    frame,
    durationInFrames,
    dialogLines.length,
    segmentDurations[SCENE_NAME],
  );
  const currentLine = dialogLines[currentLineIndex];

  const showClearNotice = frame >= durationInFrames * 0.35 && frame <= durationInFrames * 0.55;

  return (
    <AbsoluteFill>
      <BackgroundLayer image="ancient-realm-entrance.png" />

      <div style={{
        position: "absolute", top: -50, left: "50%",
        width: 700, height: 700,
        background: "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <SceneIndicator text="上古秘境·速通紀錄誕生" color="#FBBF24" />

      {showClearNotice && (
        <SystemNotification
          text="秘境通關 — 用時：3:07 — 評價：SSS — 歷史最短紀錄"
          type="success"
          delay={0}
        />
      )}

      <CharacterSprite
        character="zhaoxiaoqi"
        emotion={currentLine.character === "zhaoxiaoqi" ? currentLine.emotion : "default"}
        speaking={currentLine.character === "zhaoxiaoqi"}
        side="right"
        background={currentLine.character !== "zhaoxiaoqi"}
        effects={currentLine.character === "zhaoxiaoqi" ? normalizeEffects(currentLine.effect) : []}
      />

      <ComicEffects
        effects={normalizeEffects(currentLine.effect)}
        side={CHARACTERS[currentLine.character].position}
      />

      <DialogBox lines={dialogLines} sceneFrame={frame} sceneDuration={durationInFrames} />
    </AbsoluteFill>
  );
};
