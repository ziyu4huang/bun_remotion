export interface NarrationScript {
  scene: string;
  file: string;
  text: string;
}

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.mp3",
    text: "Meet Claude Code — your AI coding companion, built right into your terminal.",
  },
  {
    scene: "FeaturesScene",
    file: "02-features.mp3",
    text: "It reads your entire codebase, writes and refactors code, and answers any question you ask — in plain English.",
  },
  {
    scene: "TerminalScene",
    file: "03-terminal.mp3",
    text: "Watch it in action. Claude Code reads the auth middleware, rewrites it for JWT, updates the routes, and runs every test — done in seconds.",
  },
  {
    scene: "OutroScene",
    file: "04-outro.mp3",
    text: "Ready to get started? Install Claude Code and start building smarter today.",
  },
];
