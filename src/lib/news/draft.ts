// ============================================================
// Hokushin · 3分ニュース（朝のドラフト）共通ロジック
// ------------------------------------------------------------
// クライアントが集めた「今日の文脈（NewsContext）」を、
//   - サーバ（/api/news/morning）で Claude に渡してニュース原稿にする
//   - APIキー未設定でも動くよう、定型のテンプレ原稿に落とす
// ためのデータ型と純粋関数をまとめる。ブラウザ／サーバ両方から import 可。
// ============================================================

export interface NewsTask {
  title: string;
  field: string | null; // 分野名（短縮）。未紐付けは null
  time: string | null; // "HH:mm" または "HH:mm — HH:mm"
  completed: boolean;
}

export interface NewsReport {
  done: string;
  note: string;
  tomorrow: string;
}

export interface NewsFieldFocus {
  name: string; // 分野名（短縮）
  shortTerm: string; // 短期目標
}

// クライアントが組み立て、API へ POST する「今日の文脈」。
export interface NewsContext {
  date: string; // YYYY-MM-DD（今日）
  weekdayJa: string; // 例: 火曜日
  philosophy: string; // 人生理念（ピラミッド①）
  vision: string; // 人生のビジョン（ピラミッド②）
  northStar: { long: string; mid: string; short: string }; // 北極星（解決済みテキスト）
  monthly: {
    primaryGoal: string;
    actionTheme: string;
    successPoints: string[];
  } | null;
  todayTasks: NewsTask[];
  yesterday: NewsReport | null; // 昨日の日報（あれば）
  focusFields: NewsFieldFocus[]; // 取り組み中の分野＋短期目標
}

export type NewsSource = "ai" | "template";

export interface NewsResponse {
  script: string;
  source: NewsSource;
}

// ------------------------------------------------------------
// 文脈を Claude へ渡すための素材テキストに整形する
// ------------------------------------------------------------

const DASH = "（未設定）";

function bullet(label: string, value: string): string {
  const v = value.trim();
  return `- ${label}：${v || DASH}`;
}

export function contextToFacts(ctx: NewsContext): string {
  const lines: string[] = [];
  lines.push(`【日付】${ctx.date}（${ctx.weekdayJa}）`);

  lines.push("");
  lines.push("【土台】");
  lines.push(bullet("人生理念", ctx.philosophy));
  lines.push(bullet("人生のビジョン", ctx.vision));

  lines.push("");
  lines.push("【北極星（最重要目標）】");
  lines.push(bullet("長期", ctx.northStar.long));
  lines.push(bullet("中期", ctx.northStar.mid));
  lines.push(bullet("短期", ctx.northStar.short));

  lines.push("");
  lines.push("【今月のミッション】");
  if (ctx.monthly) {
    lines.push(bullet("最重要目標", ctx.monthly.primaryGoal));
    lines.push(bullet("行動テーマ", ctx.monthly.actionTheme));
    if (ctx.monthly.successPoints.length > 0) {
      lines.push(`- 達成のポイント：`);
      for (const p of ctx.monthly.successPoints) lines.push(`  ・${p}`);
    }
  } else {
    lines.push(`- ${DASH}`);
  }

  lines.push("");
  lines.push("【取り組み中の分野】");
  if (ctx.focusFields.length > 0) {
    for (const f of ctx.focusFields) {
      lines.push(`- ${f.name}：${f.shortTerm.trim() || DASH}`);
    }
  } else {
    lines.push(`- ${DASH}`);
  }

  lines.push("");
  lines.push("【昨日の記録】");
  if (ctx.yesterday) {
    lines.push(bullet("できたこと", ctx.yesterday.done));
    lines.push(bullet("メモ・気づき", ctx.yesterday.note));
    lines.push(bullet("明日へ", ctx.yesterday.tomorrow));
  } else {
    lines.push(`- ${DASH}`);
  }

  lines.push("");
  lines.push("【今日の予定タスク】");
  if (ctx.todayTasks.length > 0) {
    for (const t of ctx.todayTasks) {
      const parts = [t.title];
      if (t.field) parts.push(`〔${t.field}〕`);
      if (t.time) parts.push(`(${t.time})`);
      lines.push(`- ${parts.join(" ")}`);
    }
  } else {
    lines.push(`- ${DASH}`);
  }

  return lines.join("\n");
}

// ------------------------------------------------------------
// Claude へのプロンプト
// ------------------------------------------------------------

export const NEWS_SYSTEM_PROMPT = [
  "あなたは「北辰（ほくしん）」という人生設計アプリの専属キャスターです。",
  "ユーザー本人だけに向けて、毎朝3分で読み上げられる短いニュース番組の原稿を書きます。",
  "",
  "原稿の決まりごと：",
  "- 日本語。やわらかく前向きで、しかし誇張や過度な励ましはしない落ち着いた語り口。",
  "- 全体で日本語600〜850字程度（音読でおよそ3分）。",
  "- ニュース番組らしい構成にする：オープニング → 北極星の確認 → 今月のミッション → 昨日のハイライト → 本日の予定 → ひとことクロージング。",
  "- 各セクションに短い見出しを付ける（例：「◆ オープニング」）。",
  "- 与えられた事実だけを使う。事実を創作・誇張しない。",
  "- 情報が「（未設定）」の項目は、無理に触れず軽く流すか、設定を促すひとことに留める。",
  "- 数字や固有名詞は与えられたとおりに扱う。",
  "- 出力は原稿本文のみ。前置き・後書き・コードブロックは付けない。",
].join("\n");

export function buildNewsUserPrompt(ctx: NewsContext): string {
  return [
    "以下は今日のユーザーの状況です。これをもとに3分ニュースの原稿を作成してください。",
    "",
    contextToFacts(ctx),
  ].join("\n");
}

// ------------------------------------------------------------
// テンプレート版（APIキー無し・オフラインでも動く決定的な原稿）
// ------------------------------------------------------------

function firstNonEmpty(...vals: string[]): string {
  for (const v of vals) if (v && v.trim()) return v.trim();
  return "";
}

export function templateDraft(ctx: NewsContext): string {
  const ns = ctx.northStar;
  const compass = firstNonEmpty(ns.short, ns.mid, ns.long);
  const out: string[] = [];

  out.push(`◆ オープニング`);
  out.push(
    `${ctx.date}（${ctx.weekdayJa}）、おはようございます。今日の北辰ニュース、3分でお届けします。`,
  );
  out.push("");

  out.push(`◆ 北極星`);
  if (compass) {
    out.push(`まず、見失わない一点から。あなたの北極星はこちらです。`);
    if (ns.short.trim()) out.push(`・短期：${ns.short.trim()}`);
    if (ns.mid.trim()) out.push(`・中期：${ns.mid.trim()}`);
    if (ns.long.trim()) out.push(`・長期：${ns.long.trim()}`);
  } else {
    out.push(
      `北極星（最重要目標）はまだ未設定です。今日のどこかで、長期・中期・短期の一点を言葉にしておきましょう。`,
    );
  }
  out.push("");

  out.push(`◆ 今月のミッション`);
  if (ctx.monthly && ctx.monthly.primaryGoal.trim()) {
    out.push(`今月の最重要目標は「${ctx.monthly.primaryGoal.trim()}」。`);
    if (ctx.monthly.actionTheme.trim()) {
      out.push(`行動テーマは「${ctx.monthly.actionTheme.trim()}」です。`);
    }
    if (ctx.monthly.successPoints.length > 0) {
      out.push(`達成のポイントは、${ctx.monthly.successPoints.join("、")}。`);
    }
  } else {
    out.push(`今月の目標はまだ設定されていません。月の一手を決めると、毎日が澄んできます。`);
  }
  out.push("");

  out.push(`◆ 昨日のハイライト`);
  if (ctx.yesterday) {
    const y = ctx.yesterday;
    if (y.done.trim()) out.push(`できたこと：${y.done.trim()}`);
    if (y.note.trim()) out.push(`気づき：${y.note.trim()}`);
    if (y.tomorrow.trim()) out.push(`昨日のあなたから今日へ：${y.tomorrow.trim()}`);
    if (!y.done.trim() && !y.note.trim() && !y.tomorrow.trim()) {
      out.push(`昨日の記録は空白でした。今日の終わりに、ひとことだけでも残してみましょう。`);
    }
  } else {
    out.push(`昨日の日報はありません。小さな一行が、明日のニュースになります。`);
  }
  out.push("");

  out.push(`◆ 本日の予定`);
  if (ctx.todayTasks.length > 0) {
    out.push(`今日のタスクは${ctx.todayTasks.length}件。`);
    for (const t of ctx.todayTasks) {
      const meta: string[] = [];
      if (t.time) meta.push(t.time);
      if (t.field) meta.push(t.field);
      const suffix = meta.length ? `（${meta.join("・")}）` : "";
      out.push(`・${t.title}${suffix}`);
    }
  } else {
    out.push(`今日の予定はまだ入っていません。北極星に向かう一手を、ひとつ書き出すところから。`);
  }
  out.push("");

  out.push(`◆ クロージング`);
  out.push(
    compass
      ? `迷わぬ者は、北辰を仰ぐ。今日も、その一点を見上げて。いってらっしゃい。`
      : `迷わぬ者は、北辰を仰ぐ。まずは目印を決めるところから。今日もよい一日を。`,
  );

  return out.join("\n");
}
