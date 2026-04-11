import { loadFont } from "@remotion/google-fonts/NotoSansTC";

export const { fontFamily: notoSansTC } = loadFont("normal", {
  weights: ["400", "700"],
});

export type Character = "xiaoming" | "xiaomei" | "teacher";

export interface CharacterConfig {
  name: string;
  color: string;
  bgColor: string;
  position: "left" | "center" | "right";
}

export const CHARACTERS: Record<Character, CharacterConfig> = {
  xiaoming: {
    name: "小明",
    color: "#60A5FA",
    bgColor: "rgba(59, 130, 246, 0.25)",
    position: "left",
  },
  xiaomei: {
    name: "小美",
    color: "#F472B6",
    bgColor: "rgba(236, 72, 153, 0.25)",
    position: "right",
  },
  teacher: {
    name: "王老師",
    color: "#FBBF24",
    bgColor: "rgba(245, 158, 11, 0.25)",
    position: "center",
  },
};

export interface DialogLine {
  character: Character;
  text: string;
}
