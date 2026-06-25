// ============================================================
// 本日の行（日々タスク）インポートAPI（汎用）
// ============================================================
// POST /api/ingest/daily-tasks
//   Headers: Authorization: Bearer <ingest_token>
//   Body(JSON): {
//     date: "YYYY-MM-DD",
//     tasks: [{ title: string, fieldId?: number|null,
//               startTime?: string, endTime?: string, done?: boolean }]
//   }
// トークンを SHA-256 で照合 → 対応ユーザーの daily_tasks に upsert する。
// Claude Code 等から「今日のタスク」を push して「本日の行」に自動反映する用途。
//
// 設計上の安全策：
//  - 各タスクの id は (user_id, date, title) から決定的に生成（再 push しても重複しない）。
//  - 既存行は ignoreDuplicates で温存（ユーザーが付けた完了チェック・時刻を上書きしない）。
//  - done:true のタスクだけ、完了フラグを true に更新（外部からの「できたらチェック」）。
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

// sha256 hex(64桁) の先頭32桁を UUID 形（8-4-4-4-12）に整形する。
// Postgres uuid 型はこのレイアウトなら version に関係なく受け付ける。
function hexToUuid(hex: string): string {
  const h = hex.slice(0, 32);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    h.slice(12, 16),
    h.slice(16, 20),
    h.slice(20, 32),
  ].join("-");
}

async function taskId(userId: string, date: string, title: string): Promise<string> {
  return hexToUuid(await sha256hex(`${userId}:${date}:${title}`));
}

interface InTask {
  title?: string;
  fieldId?: number | null;
  startTime?: string;
  endTime?: string;
  done?: boolean;
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
  let body: { date?: string; tasks?: InTask[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const date = body.date?.trim();
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "date は YYYY-MM-DD 形式で必須です。" }, 400);
  }
  if (!Array.isArray(body.tasks) || body.tasks.length === 0) {
    return json({ error: "tasks は1件以上の配列で必須です。" }, 400);
  }

  // タイトルを正規化・重複除去（同日同名は1つにまとめる）
  const seen = new Set<string>();
  const tasks = body.tasks
    .map((t) => ({
      title: (t.title ?? "").trim(),
      fieldId:
        typeof t.fieldId === "number" && t.fieldId >= 1 && t.fieldId <= 7
          ? t.fieldId
          : null,
      startTime: t.startTime?.trim() || null,
      endTime: t.endTime?.trim() || null,
      done: t.done === true,
    }))
    .filter((t) => {
      if (!t.title || seen.has(t.title)) return false;
      seen.add(t.title);
      return true;
    });
  if (tasks.length === 0) {
    return json({ error: "有効な title を持つタスクがありません。" }, 400);
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

  const nowIso = new Date().toISOString();

  // --- 行を組み立て（id は決定的）---
  const rows = await Promise.all(
    tasks.map(async (t) => ({
      id: await taskId(userId, date, t.title),
      user_id: userId,
      date,
      title: t.title,
      field_id: t.fieldId,
      completed: false,
      start_time: t.startTime,
      end_time: t.endTime,
      created_at: nowIso,
    })),
  );

  // (1) 「存在を保証」：既存行は温存（完了チェック・編集を上書きしない）
  const { error: insErr } = await admin
    .from("daily_tasks")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (insErr) {
    return json({ error: "タスク保存に失敗しました。", detail: insErr.message }, 500);
  }

  // (2) done:true のタスクだけ、完了フラグを立てる（外部からのチェック反映）
  const doneIds = await Promise.all(
    tasks.filter((t) => t.done).map((t) => taskId(userId, date, t.title)),
  );
  let marked = 0;
  if (doneIds.length > 0) {
    const { error: updErr, count } = await admin
      .from("daily_tasks")
      .update({ completed: true }, { count: "exact" })
      .in("id", doneIds);
    if (updErr) {
      return json(
        { error: "完了フラグ更新に失敗しました。", detail: updErr.message },
        500,
      );
    }
    marked = count ?? doneIds.length;
  }

  // last_used_at 更新（失敗しても無視）
  await admin
    .from("ingest_tokens")
    .update({ last_used_at: nowIso })
    .eq("token_hash", tokenHash);

  return json({ ok: true, date, pushed: rows.length, marked_done: marked }, 200);
}
