import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { TerminalScene } from "./scenes/TerminalScene";
import { OutroScene } from "./scenes/OutroScene";
import type { Props } from "./Root";

const scenes = [
  { Scene: TitleScene,    audio: "audio/01-title.mp3" },
  { Scene: FeaturesScene, audio: "audio/02-features.mp3" },
  { Scene: TerminalScene, audio: "audio/03-terminal.mp3" },
  { Scene: OutroScene,    audio: "audio/04-outro.mp3" },
];

export const ClaudeCodeIntro: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? 165;
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d0d" }}>
      {scenes.map(({ Scene, audio }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={d(i)}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
