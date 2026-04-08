import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { OpeningScene } from "./scenes/OpeningScene";
import { DepartureScene } from "./scenes/DepartureScene";
import { StrawHouseScene } from "./scenes/StrawHouseScene";
import { WoodHouseScene } from "./scenes/WoodHouseScene";
import { BrickHouseScene } from "./scenes/BrickHouseScene";
import { WolfAppearScene } from "./scenes/WolfAppearScene";
import { StrawBlownScene } from "./scenes/StrawBlownScene";
import { WoodBlownScene } from "./scenes/WoodBlownScene";
import { BrickStandScene } from "./scenes/BrickStandScene";
import { EndingScene } from "./scenes/EndingScene";

export type Props = {
  /** Duration in frames for each scene, computed from audio length by calculateMetadata. */
  sceneDurations: number[];
};

const DEFAULT_DURATION = 240; // 8s fallback when audio not generated yet

export const ThreeLittlePigs: React.FC<Props> = ({ sceneDurations }) => {
  const d = (i: number) => sceneDurations[i] ?? DEFAULT_DURATION;

  // Cumulative start offsets
  const starts = sceneDurations.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + d(i - 1));
    return acc;
  }, []);

  const scenes = [
    { Scene: OpeningScene,    audio: "audio/01-opening.wav" },
    { Scene: DepartureScene,  audio: "audio/02-departure.wav" },
    { Scene: StrawHouseScene, audio: "audio/03-straw-house.wav" },
    { Scene: WoodHouseScene,  audio: "audio/04-wood-house.wav" },
    { Scene: BrickHouseScene, audio: "audio/05-brick-house.wav" },
    { Scene: WolfAppearScene, audio: "audio/06-wolf-appear.wav" },
    { Scene: StrawBlownScene, audio: "audio/07-straw-blown.wav" },
    { Scene: WoodBlownScene,  audio: "audio/08-wood-blown.wav" },
    { Scene: BrickStandScene, audio: "audio/09-brick-stand.wav" },
    { Scene: EndingScene,     audio: "audio/10-ending.wav" },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: "#FFF8F0" }}>
      {scenes.map(({ Scene, audio }, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={d(i)}>
          <Scene />
          <Audio src={staticFile(audio)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
