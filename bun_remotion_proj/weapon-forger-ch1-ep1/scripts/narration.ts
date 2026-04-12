/**
 * Narration scripts with per-character voice assignment for
 * 谁让他炼器的！ 第一章 第一集：入宗考试
 *
 * Voices (mlx_tts, all Standard Mandarin):
 *   周墨 (zhoumo)    → uncle_fu  — male, standard Mandarin (engineering nerd tone)
 *   考官 (examiner)  → serena    — female, standard Mandarin (authoritative)
 *   narrator         → uncle_fu  — male narrator
 */

export type VoiceCharacter = "zhoumo" | "examiner" | "narrator";

export interface NarrationSegment {
  character: VoiceCharacter;
  text: string;
}

export interface NarrationScript {
  scene: string;
  file: string;
  segments: NarrationSegment[];
  fullText: string;
}

export const VOICE_MAP: Record<VoiceCharacter, string> = {
  zhoumo: "uncle_fu",
  examiner: "serena",
  narrator: "uncle_fu",
};

export const VOICE_DESCRIPTION: Record<VoiceCharacter, { voice: string; gender: string; accent: string }> = {
  zhoumo: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
  examiner: { voice: "serena", gender: "female", accent: "standard Mandarin" },
  narrator: { voice: "uncle_fu", gender: "male", accent: "standard Mandarin" },
};

export const narrations: NarrationScript[] = [
  {
    scene: "TitleScene",
    file: "01-title.wav",
    segments: [
      { character: "narrator", text: "欢迎来到谁让他炼器的！第一章，入宗考试。" },
      { character: "narrator", text: "周墨来到问道宗参加入宗考试。他的炼器理念是模块化设计、用户体验和底层逻辑闭环。简单来说，他的法宝不按常理出牌。" },
    ],
    fullText: "欢迎来到谁让他炼器的！第一章，入宗考试。周墨来到问道宗参加入宗考试。他的炼器理念是模块化设计、用户体验和底层逻辑闭环。简单来说，他的法宝不按常理出牌。",
  },
  {
    scene: "ContentScene1",
    file: "02-content1.wav",
    segments: [
      { character: "zhoumo", text: "问道宗，传说中最正统的修仙宗门。今天，我终于来了。" },
      { character: "examiner", text: "你是来参加入宗考试的？报上名来。" },
      { character: "zhoumo", text: "周墨。特长是炼器。" },
      { character: "examiner", text: "炼器？上一个说自己擅长炼器的，现在还在后山修丹炉。" },
      { character: "zhoumo", text: "我的炼器跟别人不太一样。我追求的是用户体验和底层逻辑闭环。" },
      { character: "examiner", text: "说人话。" },
      { character: "zhoumo", text: "就是我的法宝会自己思考。" },
      { character: "examiner", text: "好，考试任务：炼制一件法器。限时一炷香。" },
      { character: "examiner", text: "你有什么材料？" },
      { character: "zhoumo", text: "我带了三百个微型隐藏机关、两个指纹识别阵法、和一个自动格式化模块。" },
      { character: "examiner", text: "这不是炼器，这是在造兵器工厂吧。" },
      { character: "zhoumo", text: "老师您有所不知，模块化才是未来。" },
    ],
    fullText: "问道宗，传说中最正统的修仙宗门。今天，我终于来了。你是来参加入宗考试的？报上名来。周墨。特长是炼器。炼器？上一个说自己擅长炼器的，现在还在后山修丹炉。我的炼器跟别人不太一样。我追求的是用户体验和底层逻辑闭环。说人话。就是我的法宝会自己思考。好，考试任务：炼制一件法器。限时一炷香。你有什么材料？我带了三百个微型隐藏机关、两个指纹识别阵法、和一个自动格式化模块。这不是炼器，这是在造兵器工厂吧。老师您有所不知，模块化才是未来。",
  },
  {
    scene: "ContentScene2",
    file: "03-content2.wav",
    segments: [
      { character: "zhoumo", text: "模块化设计，指纹识别，自动格式化防偷，启动！" },
      { character: "zhoumo", text: "自动寻路飞剑，完成！" },
      { character: "examiner", text: "这把剑怎么在抖？" },
      { character: "zhoumo", text: "这是智能振动模式，帮助它定位目标。" },
      { character: "examiner", text: "定位什么目标？" },
      { character: "zhoumo", text: "灵气密度最高的目标。这是它的核心算法。" },
      { character: "examiner", text: "等等，它为什么朝我飞过来？！" },
      { character: "zhoumo", text: "因为您的储物袋灵气浓度最高。它很聪明吧？" },
      { character: "examiner", text: "这是抢劫吧！这是抢劫吧？！" },
      { character: "zhoumo", text: "不不不，这是自动寻路功能。攻击和抢劫只是副产物。" },
      { character: "examiner", text: "把你的破剑收回去！" },
      { character: "zhoumo", text: "收不回来了，我忘加停止按钮了。" },
    ],
    fullText: "模块化设计，指纹识别，自动格式化防偷，启动！自动寻路飞剑，完成！这把剑怎么在抖？这是智能振动模式，帮助它定位目标。定位什么目标？灵气密度最高的目标。这是它的核心算法。等等，它为什么朝我飞过来？！因为您的储物袋灵气浓度最高。它很聪明吧？这是抢劫吧！这是抢劫吧？！不不不，这是自动寻路功能。攻击和抢劫只是副产物。把你的破剑收回去！收不回来了，我忘加停止按钮了。",
  },
  {
    scene: "OutroScene",
    file: "04-outro.wav",
    segments: [
      { character: "narrator", text: "感谢收看谁让他炼器的！第一章第一集，入宗考试。" },
      { character: "narrator", text: "周墨的飞剑虽然抢了考官的储物袋，但这种不按常理出牌的创造力，让考官对他另眼相看。" },
      { character: "narrator", text: "下集预告：考官宣布周墨的考试成绩，他的创造力究竟是被认可还是被赶出去？我们下集见。" },
    ],
    fullText: "感谢收看谁让他炼器的！第一章第一集，入宗考试。周墨的飞剑虽然抢了考官的储物袋，但这种不按常理出牌的创造力，让考官对他另眼相看。下集预告：考官宣布周墨的考试成绩，他的创造力究竟是被认可还是被赶出去？我们下集见。",
  },
];
