// ============================================================
// 3分ニュース（朝のドラフト）生成API
// ============================================================
// POST /api/news/morning
//   Body(JSON): { context: NewsContext }
//   ANTHROPIC_API_KEY があれば Claude で原稿を生成、無ければテンプレート版を返す。
//   レスポンス: { script, source: "ai" | "template" }
// データは端末（クライアント）で組み立てたものをそのまま受け取るので、
// このルートは Supabase を読まない（ログイン状態に依存しない）。
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import {
  NEWS_SYSTEM_PROMPT,
  buildNewsUserPrompt,
  templateDraft,
  type NewsContext,
  type NewsResponse,
} from "@/lib/news/draft";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-opus-4-8";

function json(body: NewsResponse | { error: string }, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// NewsContext を最低限バリデートしつつ、欠けたフィールドを埋めて返す。
function normalizeContext(raw: unknown): NewsContext | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  if (typeof c.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(c.date)) {
    return null;
  }
  const ns = (c.northStar ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  const monthly =
    c.monthly && typeof c.monthly === "object"
      ? (() => {
          const m = c.monthly as Record<string, unknown>;
          return {
            primaryGoal: str(m.primaryGoal),
            actionTheme: str(m.actionTheme),
            successPoints: Array.isArray(m.successPoints)
              ? m.successPoints.map(str).filter(Boolean)
              : [],
          };
        })()
      : null;

  const yesterday =
    c.yesterday && typeof c.yesterday === "object"
      ? (() => {
          const y = c.yesterday as Record<string, unknown>;
          return {
            done: str(y.done),
            note: str(y.note),
            tomorrow: str(y.tomorrow),
          };
        })()
      : null;

  const todayTasks = Array.isArray(c.todayTasks)
    ? c.todayTasks.slice(0, 50).map((t) => {
        const tt = (t ?? {}) as Record<string, unknown>;
        return {
          title: str(tt.title),
          field: typeof tt.field === "string" ? tt.field : null,
          time: typeof tt.time === "string" ? tt.time : null,
          completed: Boolean(tt.completed),
        };
      })
    : [];

  const focusFields = Array.isArray(c.focusFields)
    ? c.focusFields.slice(0, 7).map((f) => {
        const ff = (f ?? {}) as Record<string, unknown>;
        return { name: str(ff.name), shortTerm: str(ff.shortTerm) };
      })
    : [];

  return {
    date: c.date,
    weekdayJa: str(c.weekdayJa),
    philosophy: str(c.philosophy),
    vision: str(c.vision),
    northStar: {
      long: str(ns.long),
      mid: str(ns.mid),
      short: str(ns.short),
    },
    monthly,
    todayTasks,
    yesterday,
    focusFields,
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const ctx = normalizeContext((body as Record<string, unknown>)?.context);
  if (!ctx) {
    return json({ error: "context が不正です（date は YYYY-MM-DD で必須）。" }, 400);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

  // APIキーが無ければテンプレート版（無料・即時・オフライン可）
  if (!apiKey) {
    return json({ script: templateDraft(ctx), source: "template" }, 200);
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: NEWS_SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildNewsUserPrompt(ctx) }],
    });

    const script = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!script) {
      // 念のため：空応答ならテンプレートで埋める
      return json({ script: templateDraft(ctx), source: "template" }, 200);
    }
    return json({ script, source: "ai" }, 200);
  } catch (e) {
    // 生成に失敗してもユーザーには原稿を返す（テンプレートにフォールバック）
    console.error("[hokushin] news generation failed", e);
    return json({ script: templateDraft(ctx), source: "template" }, 200);
  }
}
