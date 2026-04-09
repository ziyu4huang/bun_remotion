import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { TerminalScene } from "./scenes/TerminalScene";
import { OutroScene } from "./scenes/OutroScene";
import { FusionScene } from "./scenes/FusionScene";
import type { Props } from "./Root";

const scenes = [
  { Scene: TitleScene,    audio: "audio/01-title.mp3",    name: "Title" },
  { Scene: FeaturesScene, audio: "audio/02-features.mp3", name: "Features" },
  { Scene: TerminalScene, audio: "audio/03-terminal.mp3", name: "Terminal" },
  { Scene: OutroScene,    audio: "audio/04-outro.mp3",    name: "Outro" },
  { Scene: FusionScene,   audio: "audio/05-fusion.mp3",   name: "Fusion" },
];

export const ClaudeCodeIntro: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 165;
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      {scenes.map(({ Scene, audio, name }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={d(i)} name={name}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
