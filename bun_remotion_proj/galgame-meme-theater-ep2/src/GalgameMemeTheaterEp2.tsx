import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { JokeScene1 } from "./scenes/JokeScene1";
import { JokeScene2 } from "./scenes/JokeScene2";
import { JokeScene3 } from "./scenes/JokeScene3";
import { JokeScene4 } from "./scenes/JokeScene4";
import { OutroScene } from "./scenes/OutroScene";

export type Props = {
  sceneDurations: number[];
};

const DEFAULT_DURATION = 240; // 8s fallback

export const GalgameMemeTheaterEp2: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? DEFAULT_DURATION;

  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  const scenes = [
    { name: "Title", Scene: TitleScene, audio: "audio/01-title.wav" },
    { name: "Joke1-讀書會變開黑局", Scene: JokeScene1, audio: "audio/02-joke1.wav" },
    { name: "Joke2-打折永遠買不完", Scene: JokeScene2, audio: "audio/03-joke2.wav" },
    { name: "Joke3-再一局就睡", Scene: JokeScene3, audio: "audio/04-joke3.wav" },
    { name: "Joke4-排位連敗甩鍋", Scene: JokeScene4, audio: "audio/05-joke4.wav" },
    { name: "Outro", Scene: OutroScene, audio: "audio/06-outro.wav" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a051e" }}>
      {scenes.map(({ name, Scene, audio }, i) => (
        <Sequence key={i} name={name} from={starts[i]} durationInFrames={d(i)}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
