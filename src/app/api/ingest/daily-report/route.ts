// ============================================================
// 日報インポートAPI（汎用）
// ============================================================
// POST /api/ingest/daily-report
//   Headers: Authorization: Bearer <ingest_token>
//   Body(JSON): { date: "YYYY-MM-DD", markdown?: string,
//                 doneText?, noteText?, tomorrowText? }
// トークンを SHA-256 で照合 → 対応ユーザーの daily_reports に
// source='import' で upsert する。Claude Code 等から push して使う。
// ============================================================

import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { sha256hex } from "@/lib/hash";

export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Markdown を「できたこと / メモ / 明日へ」に大まかに振り分ける。
// 見出し（# 〜 ######）の文言で判定。該当が無ければ全文をメモへ。
function parseMarkdown(md: string): {
  doneText: string;
  noteText: string;
  tomorrowText: string;
} {
  const lines = md.split(/\r?\n/);
  const buckets = { done: [] as string[], note: [] as string[], tomorrow: [] as string[] };
  let current: "done" | "note" | "tomorrow" | null = null;
  let sawHeading = false;

  for (const line of lines) {
    const h = line.match(/^#{1,6}\s*(.+?)\s*$/);
    if (h) {
      const title = h[1];
      sawHeading = true;
      if (/(できたこと|やったこと|完了|done)/i.test(title)) current = "done";
      else if (/(明日|翌日|next|やること|todo)/i.test(title)) current = "tomorrow";
      else if (/(メモ|気づき|振り返り|できなかった|note)/i.test(title))
        current = "note";
      else current = "note";
      continue;
    }
    if (current) buckets[current].push(line);
    else buckets.note.push(line);
  }

  const join = (arr: string[]) => arr.join("\n").trim();
  if (!sawHeading) {
    return { doneText: "", noteText: md.trim(), tomorrowText: "" };
  }
  return {
    doneText: join(buckets.done),
    noteText: join(buckets.note),
    tomorrowText: join(buckets.tomorrow),
  };
}

export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return json(
      { error: "SUPABASE_SERVICE_ROLE_KEY が未設定です（サーバ環境変数）。" },
      503,
    );
  }

  // --- トークン取得 ---
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim();
  if (!token) {
    return json({ error: "Authorization: Bearer <token> が必要です。" }, 401);
  }

  // --- body ---
  let body: {
    date?: string;
    markdown?: string;
    doneText?: string;
    noteText?: string;
    tomorrowText?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const date = body.date?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "date は YYYY-MM-DD 形式で必須です。" }, 400);
  }

  // --- トークン照合（service_role で RLS を越える）---
  const admin = createAdminClient();
  const tokenHash = await sha256hex(token);
  const { data: tokenRow, error: tokenErr } = await admin
    .from("ingest_tokens")
    .select("user_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenErr) {
    return json({ error: "token lookup failed" }, 500);
  }
  if (!tokenRow) {
    return json({ error: "トークンが無効です。" }, 401);
  }
  const userId = tokenRow.user_id as string;

  // --- 内容の決定（構造化フィールド優先・無ければ markdown を解析）---
  const hasStructured =
    body.doneText != null || body.noteText != null || body.tomorrowText != null;
  const parsed = hasStructured
    ? {
        doneText: body.doneText ?? "",
        noteText: body.noteText ?? "",
        tomorrowText: body.tomorrowText ?? "",
      }
    : parseMarkdown(body.markdown ?? "");

  const nowIso = new Date().toISOString();

  // --- upsert（user_id, date 一意）---
  const { error: upErr } = await admin.from("daily_reports").upsert(
    {
      user_id: userId,
      date,
      done_text: parsed.doneText,
      note_text: parsed.noteText,
      tomorrow_text: parsed.tomorrowText,
      source: "import",
      raw_md: body.markdown ?? "",
      updated_at: nowIso,
    },
    { onConflict: "user_id,date" },
  );

  if (upErr) {
    return json({ error: "保存に失敗しました。", detail: upErr.message }, 500);
  }

  // last_used_at 更新（失敗しても無視）
  await admin
    .from("ingest_tokens")
    .update({ last_used_at: nowIso })
    .eq("token_hash", tokenHash);

  return json({ ok: true, date }, 200);
}
