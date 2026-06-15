"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { APP_NAME_JA } from "@/lib/constants";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setBusy(true);
    setErrorMsg("");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: addr,
        options: {
          // implicit フロー：リンクを開いた端末でトップに着地し、
          // URLハッシュのトークンから自動でログインする
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "送信に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <div className="w-full py-16">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-5">
            ★ &nbsp; SIGN&nbsp;IN
          </div>
          <h1 className="serif text-5xl text-[var(--color-ink)] leading-[1.1] mb-3">
            {APP_NAME_JA}
          </h1>
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)]">
            HOKUSHIN
          </div>
        </div>

        {!configured ? (
          <div className="border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-6 text-sm text-[var(--color-fg-mute)] leading-relaxed">
            ログイン機能はまだ準備中です（Supabase 未設定）。
            <br />
            このままでもローカルでご利用いただけます。
            <div className="mt-5">
              <Link
                href="/"
                className="text-xs tracking-[0.25em] text-[var(--color-ink)] hover:opacity-70"
              >
                ← 戻る
              </Link>
            </div>
          </div>
        ) : sent ? (
          <div className="text-center">
            <div className="border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-8">
              <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-4">
                ✓ &nbsp; MAIL&nbsp;SENT
              </div>
              <p className="serif text-lg text-[var(--color-ink)] leading-relaxed mb-3">
                メールを確認してください
              </p>
              <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
                <span className="text-[var(--color-ink)]">{email}</span>{" "}
                宛にログイン用リンクを送りました。
                <br />
                メール内の<strong className="text-[var(--color-ink)]">リンクをタップ</strong>すると、
                そのままログインできます。
              </p>
            </div>
            <button
              onClick={() => {
                setSent(false);
                setErrorMsg("");
              }}
              className="mt-6 text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
            >
              ← 別のメールアドレスで送る
            </button>
            <p className="mt-4 text-[10px] text-[var(--color-fg-faint)] leading-relaxed">
              メールが届かない時は迷惑メールも確認してください（1〜2分かかる場合があります）。
            </p>
          </div>
        ) : (
          <form onSubmit={sendLink} className="space-y-5">
            <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed text-center mb-8">
              メールアドレスにログイン用リンクを送ります。
              <br />
              パスワードは不要です。
            </p>
            <div>
              <label className="block text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
                EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-[var(--color-line)] px-4 py-3 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
              />
            </div>
            {errorMsg && (
              <p className="text-xs text-red-700 leading-relaxed">{errorMsg}</p>
            )}
            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="w-full bg-[var(--color-ink)] text-white px-6 py-3.5 text-sm tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? "送信中…" : "ログインリンクを送る"}
            </button>
            <div className="text-center pt-2">
              <Link
                href="/"
                className="text-xs tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
              >
                ログインせずに使う →
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
