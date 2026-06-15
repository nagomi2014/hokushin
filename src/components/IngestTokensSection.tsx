"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sha256hex } from "@/lib/hash";

interface TokenRow {
  id: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
}

export function IngestTokensSection() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [endpoint, setEndpoint] = useState("");

  useEffect(() => {
    setEndpoint(`${window.location.origin}/api/ingest/daily-report`);
  }, []);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("ingest_tokens")
      .select("id,label,created_at,last_used_at")
      .order("created_at", { ascending: false });
    if (!error) setTokens((data as TokenRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    setBusy(true);
    setErr("");
    setNewToken(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインが必要です。");

      const bytes = crypto.getRandomValues(new Uint8Array(24));
      const raw =
        "hk_" +
        Array.from(bytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      const hash = await sha256hex(raw);

      const { error } = await supabase.from("ingest_tokens").insert({
        user_id: user.id,
        token_hash: hash,
        label: label.trim() || "日報インポート",
      });
      if (error) throw error;

      setNewToken(raw);
      setLabel("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "発行に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("このトークンを削除しますか？\n使用中の連携は動かなくなります。"))
      return;
    const supabase = createClient();
    await supabase.from("ingest_tokens").delete().eq("id", id);
    await load();
  }

  return (
    <div>
      <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-5">
        日報を外部から取り込むためのトークンを発行します。
        Claude Code などからこのトークンで送信すると、その日の日報に反映されます。
      </p>

      {/* 発行 */}
      <div className="border border-[var(--color-line)] p-5 mb-6">
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
          新しいトークンを発行
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="メモ（例：自宅PC / Claude Code）"
            className="flex-1 min-w-[200px] border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <button
            onClick={generate}
            disabled={busy}
            className="text-xs tracking-[0.3em] border border-[var(--color-ink)] text-[var(--color-ink)] px-5 py-2 hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-40"
          >
            {busy ? "発行中…" : "＋ 発行"}
          </button>
        </div>
        {err && <p className="mt-3 text-xs text-red-700">{err}</p>}

        {newToken && (
          <div className="mt-4 bg-[var(--color-paper-soft)] border border-[var(--color-gold)] p-4">
            <div className="text-[10px] tracking-[0.3em] text-[var(--color-gold)] mb-2">
              ★ 今だけ表示されます ・ 必ずコピーして保管してください
            </div>
            <code className="block break-all text-sm text-[var(--color-ink)] bg-white border border-[var(--color-line)] px-3 py-2 select-all">
              {newToken}
            </code>
            <p className="mt-2 text-[10px] text-[var(--color-fg-faint)] leading-relaxed">
              この画面を離れると二度と表示されません（保存されるのはハッシュのみ）。
            </p>
          </div>
        )}
      </div>

      {/* 一覧 */}
      {tokens.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
            発行済みトークン
          </div>
          <div className="hairline-top">
            {tokens.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 py-2.5 hairline-bottom text-sm"
              >
                <span className="text-[var(--color-ink)] flex-1 truncate">
                  {t.label || "（無題）"}
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)] whitespace-nowrap">
                  {t.last_used_at
                    ? `最終使用 ${t.last_used_at.slice(0, 10)}`
                    : "未使用"}
                </span>
                <button
                  onClick={() => remove(t.id)}
                  className="text-[var(--color-fg-faint)] hover:text-red-600 transition text-xs"
                  aria-label="delete"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 使い方 */}
      <details className="text-xs text-[var(--color-fg-mute)]">
        <summary className="cursor-pointer text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)]">
          送信方法（開発者向け）
        </summary>
        <div className="mt-3 leading-relaxed space-y-2">
          <p>エンドポイント：</p>
          <code className="block break-all bg-[var(--color-paper-soft)] border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)]">
            POST {endpoint}
          </code>
          <p>例（Markdown を丸ごと送る）：</p>
          <code className="block whitespace-pre-wrap break-all bg-[var(--color-paper-soft)] border border-[var(--color-line)] px-3 py-2 text-[var(--color-ink)] text-[11px] leading-relaxed">
{`curl -X POST ${endpoint} \\
  -H "Authorization: Bearer <トークン>" \\
  -H "Content-Type: application/json" \\
  -d '{"date":"2026-06-13","markdown":"## できたこと\\n・..."}'`}
          </code>
        </div>
      </details>
    </div>
  );
}
