/**
 * Narration scripts for Three Little Pigs (三隻小豬) cartoon story.
 *
 * Narration text is written in natural spoken Traditional Chinese (Taiwan).
 * Aim for ~6-7 seconds of speech per 8-second scene (~35-45 Chinese chars).
 *
 * To regenerate audio: bun run scripts/generate-tts.ts
 */

export interface NarrationScript {
  /** Scene component name (matches scenes/<Name>.tsx) */
  scene: string;
  /** Output filename in public/audio/ */
  file: string;
  /** Narration text in Traditional Chinese */
  text: string;
}

export const narrations: NarrationScript[] = [
  {
    scene: "OpeningScene",
    file: "01-opening.wav",
    text: "從前從前，山腳下住著三隻小豬。他們長大了，豬媽媽說：「孩子們，該出去蓋自己的房子了！」",
  },
  {
    scene: "DepartureScene",
    file: "02-departure.wav",
    text: "三兄弟告別了媽媽，踏上各自的路。豬大哥伸了個懶腰說：「我隨便蓋一蓋就好了，反正又不會有人來。」",
  },
  {
    scene: "StrawHouseScene",
    file: "03-straw-house.wav",
    text: "豬大哥用稻草隨便搭了一間屋子，一天就蓋好了。他得意地躺在裡面蹺著二郎腿，哼著小曲兒。",
  },
  {
    scene: "WoodHouseScene",
    file: "04-wood-house.wav",
    text: "豬二哥用木板釘了一間房子，花了兩天。雖然比稻草屋結實一點，但他也偷了不少懶，牆上有好幾個縫隙。",
  },
  {
    scene: "BrickHouseScene",
    file: "05-brick-house.wav",
    text: "豬小弟很認真，一塊一塊地砌磚頭，花了整整一個禮拜。哥哥們都笑他太傻，但他不為所動，說：「房子要結實才安全！」",
  },
  {
    scene: "WolfAppearScene",
    file: "06-wolf-appear.wav",
    text: "有一天，一隻餓了很久的大野狼來到了山腳下。他遠遠看見稻草屋，露出了陰險的笑容：「嘿嘿，今天有豬肉吃了！」",
  },
  {
    scene: "StrawBlownScene",
    file: "07-straw-blown.wav",
    text: "大野狼走到稻草屋前大吼：「小豬，快開門！」豬大哥嚇得發抖：「不開不開！」野狼深吸一口氣，用力一吹——稻草屋瞬間飛散，豬大哥拔腿就跑！",
  },
  {
    scene: "WoodBlownScene",
    file: "08-wood-blown.wav",
    text: "豬大哥跑到二哥的木屋裡。大野狼又追了過來，猛力一吹——木板四散飛舞，兩隻小豬嚇得魂飛魄散，拼命往豬小弟的磚屋跑去！",
  },
  {
    scene: "BrickStandScene",
    file: "09-brick-stand.wav",
    text: "三兄弟躲進磚屋裡。大野狼又吹，但磚屋紋絲不動。他用力吹了一次又一次，吹到臉都漲紅了，房子還是穩如泰山。最後他爬上屋頂想從煙囪溜進去，卻一腳踩空，摔進了滾燙的鍋子裡——「哎呀呀！燙死我了！」野狼慘叫著逃跑了。",
  },
  {
    scene: "EndingScene",
    file: "10-ending.wav",
    text: "從此以後，大野狼再也不敢來了。三兄弟明白了一個道理：做事要認真踏實，偷懶只會害了自己。他們從此過上了幸福快樂的日子。故事說完了，謝謝聆聽！",
  },
];
