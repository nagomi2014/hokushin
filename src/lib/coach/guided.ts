// ============================================================
// Hokushin · 台本式「導き出し対話」（AI不要・費用ゼロ）
// ------------------------------------------------------------
// 易しい具体的な質問に選択肢で答えていくと、選んだ言葉に
// 紐づく「価値タグ」が貯まり、最後に人生理念のドラフトを
// テンプレで組み立てる。LLMを一切呼ばない（完全 $0）。
// 汎用SaaS：個人固有の文脈は埋め込まない。
// ============================================================

import type { FieldId } from "@/lib/types";

export type ValueId =
  | "connection"
  | "growth"
  | "contribution"
  | "freedom"
  | "security"
  | "curiosity"
  | "integrity"
  | "respect"
  | "fairness"
  | "achievement"
  | "family"
  | "expression"
  | "challenge"
  | "peace";

interface ValueMeta {
  label: string; // ミラーリング表示用（短い名詞）
  creed: string; // 理念ドラフトに差し込む述語句
}

export const VALUES: Record<ValueId, ValueMeta> = {
  connection: { label: "つながり", creed: "人とのつながりを大切にする" },
  growth: { label: "成長", creed: "成長し続ける" },
  contribution: { label: "貢献", creed: "誰かの役に立つ" },
  freedom: { label: "自由", creed: "自由でいる" },
  security: { label: "安心", creed: "安心できる場所を育てる" },
  curiosity: { label: "探究", creed: "知り、学び続ける" },
  integrity: { label: "誠実", creed: "誠実であろうとする" },
  respect: { label: "尊重", creed: "互いを尊重する" },
  fairness: { label: "公正", creed: "公正であろうとする" },
  achievement: { label: "達成", creed: "やり遂げる" },
  family: { label: "家族", creed: "家族との時間を守る" },
  expression: { label: "表現", creed: "自分を表現する" },
  challenge: { label: "挑戦", creed: "挑戦をやめない" },
  peace: { label: "静けさ", creed: "静けさとゆとりを保つ" },
};

export interface GuidedOption {
  label: string;
  values: ValueId[];
}

export interface GuidedQuestion {
  id: string;
  prompt: string;
  hint?: string;
  options: GuidedOption[];
  allowFree?: boolean; // 自由記述も許可
}

// 易→深の順。各選択肢は価値タグに紐づく。
export const CREED_QUESTIONS: GuidedQuestion[] = [
  {
    id: "recent_episode",
    prompt: "まず——最近、ちょっと心が動いたことは？\nうれしい・ホッとした、どれでもOKです。",
    hint: "考え込まなくて大丈夫。直近の小さな出来事で。",
    options: [
      { label: "家族や子どもと過ごした", values: ["family", "connection"] },
      { label: "仕事がうまくいった", values: ["achievement", "growth"] },
      { label: "趣味に没頭した", values: ["expression", "freedom"] },
      { label: "誰かに感謝された", values: ["contribution", "connection"] },
      { label: "ゆっくり休めた", values: ["peace", "security"] },
      { label: "新しいことを知った", values: ["curiosity", "growth"] },
    ],
    allowFree: true,
  },
  {
    id: "what_was_good",
    prompt: "その時間、何が良かったんでしょう？",
    options: [
      { label: "一緒に楽しめた", values: ["connection", "family"] },
      { label: "自分の力を出せた", values: ["achievement", "growth"] },
      { label: "誰かの役に立てた", values: ["contribution"] },
      { label: "自由にできた", values: ["freedom", "expression"] },
      { label: "ほっと安心できた", values: ["peace", "security"] },
      { label: "新しい発見があった", values: ["curiosity", "challenge"] },
    ],
    allowFree: true,
  },
  {
    id: "irritation",
    prompt: "逆に、最近モヤッ・イラッとしたのは、どんな時？\n（嫌なことの裏に、大事にしてる価値が隠れています）",
    options: [
      { label: "約束を破られた", values: ["integrity"] },
      { label: "自分の時間を奪われた", values: ["freedom"] },
      { label: "雑に扱われた", values: ["respect"] },
      { label: "不公平だと感じた", values: ["fairness"] },
      { label: "成長できてないと感じた", values: ["growth", "challenge"] },
      { label: "大切な人をないがしろにされた", values: ["family", "connection"] },
    ],
    allowFree: true,
  },
  {
    id: "childhood",
    prompt: "子どもの頃から、ずっと好き／大事にしてきたことは？",
    options: [
      { label: "何かを作る・表現する", values: ["expression", "curiosity"] },
      { label: "人と関わる・助ける", values: ["connection", "contribution"] },
      { label: "知る・学ぶ", values: ["curiosity", "growth"] },
      { label: "体を動かす・挑戦する", values: ["challenge", "achievement"] },
      { label: "自然・静けさの中にいる", values: ["peace", "freedom"] },
      { label: "勝つ・やり遂げる", values: ["achievement", "challenge"] },
    ],
    allowFree: true,
  },
  {
    id: "thanks",
    prompt: "人に「ありがとう」と言われて、いちばん嬉しいのは？",
    options: [
      { label: "助けて支えた時", values: ["contribution", "connection"] },
      { label: "何かを教えた・導いた時", values: ["growth", "contribution"] },
      { label: "一緒に楽しんだ時", values: ["connection", "family"] },
      { label: "安心させた時", values: ["security", "peace"] },
      { label: "新しい視点をあげた時", values: ["curiosity", "expression"] },
    ],
    allowFree: true,
  },
  {
    id: "if_free",
    prompt: "もしお金も時間も十分あったら、何をして過ごす？",
    options: [
      { label: "大切な人との時間", values: ["family", "connection"] },
      { label: "好きな仕事・創作", values: ["expression", "achievement"] },
      { label: "学び・探究", values: ["curiosity", "growth"] },
      { label: "旅・冒険", values: ["challenge", "freedom"] },
      { label: "のんびり休む", values: ["peace", "security"] },
      { label: "誰かを支える活動", values: ["contribution"] },
    ],
    allowFree: true,
  },
];

export interface GuidedAnswer {
  questionId: string;
  text: string; // 選んだラベル or 自由記述
  values: ValueId[]; // 紐づく価値（自由記述なら空）
}

// 集まった答えから、上位の価値タグを数える。
export function tallyValues(answers: GuidedAnswer[]): ValueId[] {
  const count = new Map<ValueId, number>();
  for (const a of answers) {
    for (const v of a.values) {
      count.set(v, (count.get(v) ?? 0) + 1);
    }
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([v]) => v);
}

// 価値タグ＋具体的な答えから、人生理念のドラフト（一人称・現在形）を組み立てる。
export function synthesizeCreed(answers: GuidedAnswer[]): string {
  const ranked = tallyValues(answers);
  const top = ranked.slice(0, 2);

  if (top.length === 0) {
    // 全部自由記述などで価値が拾えなかった場合のフォールバック
    const concrete = answers.find((a) => a.text.trim())?.text.trim();
    return concrete
      ? `私は、「${concrete}」のような時間を大切にして生きていきます。日々の選択を、この想いに照らして決めていきます。`
      : "私が大切にしたいことを、ここに書きます。";
  }

  const v1 = VALUES[top[0]].creed;
  const v2 = top[1] ? VALUES[top[1]].creed : "";

  // 貢献の形（thanks の答え）を一つ拾えれば添える
  const thanks = answers.find((a) => a.questionId === "thanks")?.text.trim();
  // 具体の原体験（childhood / recent_episode）を一つ拾えれば添える
  const anchor =
    answers.find((a) => a.questionId === "childhood")?.text.trim() ||
    answers.find((a) => a.questionId === "recent_episode")?.text.trim();

  const core = v2
    ? `私は、${v1}こと、そして${v2}ことを、人生の核に置きます。`
    : `私は、${v1}ことを、人生の核に置きます。`;

  const give = thanks ? `${thanks}とき、いちばん自分らしくいられます。` : "";
  const tail = anchor
    ? `「${anchor}」を大事にしながら、日々の選択をこの芯に照らして決めていきます。`
    : "日々の選択を、この芯に照らして決めていきます。";

  return `${core}${give}${tail}`;
}

// ミラーリング用：今見えてきた価値（上位3つのラベル）
export function mirroredValues(answers: GuidedAnswer[]): string[] {
  return tallyValues(answers)
    .slice(0, 3)
    .map((v) => VALUES[v].label);
}

// ============================================================
// 七つの分野：短期目標の導き出し（台本式・$0）
// ============================================================

// 現状認識（全分野共通）
const FIELD_CURRENT_Q: GuidedQuestion = {
  id: "current",
  prompt: "今、この分野はどんな感じですか？",
  options: [
    { label: "充実してる", values: [] },
    { label: "まあまあ", values: [] },
    { label: "物足りない", values: [] },
    { label: "手つかず", values: [] },
    { label: "モヤモヤしてる", values: [] },
  ],
  allowFree: true,
};

// 1年後の理想（分野ごと）
const FIELD_IDEAL_OPTIONS: Record<FieldId, string[]> = {
  1: ["疲れにくい体", "引き締まった体", "痛みのない体", "体力がついてる", "数値が改善してる"],
  2: ["気の合う仲間が増える", "大切な人と深まる", "苦手な人と距離を取れてる", "新しい出会いがある", "感謝を伝え合えてる"],
  3: ["一緒に笑う時間が増える", "旅行や外出ができてる", "家がもっと心地いい", "子の成長を見守れてる", "役割分担がうまくいってる"],
  4: ["収入が上がってる", "やりがいを感じてる", "働く時間を減らせてる", "新しい挑戦をしてる", "仕組み化が進んでる"],
  5: ["新しいスキルを習得", "資格を取ってる", "苦手を克服してる", "専門性が深まってる", "学ぶ習慣がついてる"],
  6: ["貯蓄が増えてる", "固定費を減らせてる", "収入源が増えてる", "投資を始めてる", "家計が見える化できてる"],
  7: ["没頭できる趣味がある", "定期的に楽しめてる", "新しい趣味に挑戦", "仲間と楽しめてる", "教養が深まってる"],
};

export function fieldQuestions(fieldId: FieldId): GuidedQuestion[] {
  return [
    FIELD_CURRENT_Q,
    {
      id: "ideal",
      prompt: "1年後、この分野がどうなっていたら「いい感じ」ですか？",
      hint: "ピンと来たものをタップでOK。自分の言葉でも。",
      options: FIELD_IDEAL_OPTIONS[fieldId].map((label) => ({ label, values: [] })),
      allowFree: true,
    },
  ];
}

export function synthesizeFieldGoal(answers: GuidedAnswer[]): string {
  const ideal = answers.find((a) => a.questionId === "ideal")?.text.trim();
  const current = answers.find((a) => a.questionId === "current")?.text.trim();
  if (!ideal) {
    return current
      ? `今は「${current}」。まず、ここを少し前に進める。`
      : "";
  }
  return `1年後、${ideal}状態を目指す。まずはそこへ向けて、今できることから動き出す。`;
}

// ============================================================
// 月次：今月の最重要目標の導き出し（台本式・$0）
// ============================================================

const MONTHLY_FIELD_LABELS = [
  "健康・体力",
  "人間関係",
  "家族・家庭",
  "仕事・職業",
  "能力開発",
  "経済・蓄財",
  "趣味・教養",
];

export const MONTHLY_QUESTIONS: GuidedQuestion[] = [
  {
    id: "focus",
    prompt: "今月、いちばん『前に進めたい』のはどの分野ですか？",
    hint: "一つに絞るのが大切。全部やろうとすると分散します。",
    options: MONTHLY_FIELD_LABELS.map((label) => ({ label, values: [] })),
    allowFree: true,
  },
  {
    id: "action",
    prompt: "今月、それについて何をしますか？",
    options: [
      { label: "毎日少しずつ続ける", values: [] },
      { label: "大きく1つ片付ける", values: [] },
      { label: "情報を集める・調べる", values: [] },
      { label: "人に相談する", values: [] },
      { label: "環境を整える", values: [] },
      { label: "習慣を1つ変える", values: [] },
    ],
    allowFree: true,
  },
];

export function synthesizeMonthly(answers: GuidedAnswer[]): string {
  const focus = answers.find((a) => a.questionId === "focus")?.text.trim();
  const action = answers.find((a) => a.questionId === "action")?.text.trim();
  if (!focus) return action ? `今月は「${action}」に取り組む。` : "";
  return action
    ? `今月は『${focus}』に集中する。${action}。`
    : `今月は『${focus}』に集中する。`;
}
