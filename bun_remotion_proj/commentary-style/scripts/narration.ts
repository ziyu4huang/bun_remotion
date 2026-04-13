export interface NarrationScript {
  scene: string;
  file: string;
  text: string;
}

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.mp3",
    text: "Three habits that separate good programmers from great ones. Let's dive in.",
  },
  {
    scene: "PointScene1",
    file: "02-point1.mp3",
    text: "Habit number one. Great programmers read the documentation before Googling. I know, revolutionary concept. But seriously, the docs usually have the answer right there in the first paragraph.",
  },
  {
    scene: "PointScene2",
    file: "03-point2.mp3",
    text: "Habit number two. They name their variables like they'll have to read them tomorrow. Because they will. Future you will thank present you.",
  },
  {
    scene: "PointScene3",
    file: "04-point3.mp3",
    text: "Habit number three. They write tests. Not because their boss told them to, but because they want to sleep at night without nightmares about production bugs.",
  },
  {
    scene: "OutroScene",
    file: "05-outro.mp3",
    text: "So which habit are you working on? Drop a comment below. And if you found this helpful, hit that subscribe button.",
  },
];
