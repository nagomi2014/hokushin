"use client";

import Link from "next/link";
import { useState } from "react";
import {
  PLAN_FEATURES,
  PREMIUM_PRICE_MONTHLY_JPY,
  PREMIUM_PRICE_YEARLY_JPY,
} from "@/lib/constants";
import { useAppState } from "@/lib/storage";
import { IngestTokensSection } from "@/components/IngestTokensSection";

export default function SettingsPage() {
  const {
    state,
    loaded,
    setUserPlan,
    supabaseEnabled,
    userEmail,
    mode,
    signOut,
    syncLocalToCloud,
  } = useAppState();

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  async function handleSync() {
    setSyncing(true);
    setSyncMsg("");
    const res = await syncLocalToCloud();
    setSyncMsg(res.message);
    setSyncing(false);
  }

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  const plan = state.userPlan;
  const isPremium = plan === "premium";

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10">

      {/* Header */}
      <section className="pt-20 pb-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; SETTINGS
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          設定
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm tracking-wider">
          プラン・データ・アプリの設定を管理します。
        </p>
      </section>

      {/* Account */}
      <section className="py-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          00 ・ アカウント
        </div>

        {!supabaseEnabled ? (
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
            クラウド同期（ログイン）はまだ準備中です。
            現在はこのデバイスにのみデータが保存されます。
          </p>
        ) : userEmail ? (
          <div className="border border-[var(--color-line)] p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-1">
                  SIGNED IN
                </div>
                <div className="serif text-lg text-[var(--color-ink)] break-all">
                  {userEmail}
                </div>
                <div className="text-[10px] tracking-[0.3em] text-[var(--color-gold)] mt-1">
                  ● クラウド同期中（PC・スマホ共通）
                </div>
              </div>
              <button
                onClick={signOut}
                className="text-[10px] tracking-[0.3em] border border-[var(--color-line)] text-[var(--color-fg-mute)] px-3 py-1.5 hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition whitespace-nowrap"
              >
                ログアウト
              </button>
            </div>

            <div className="hairline-top pt-4">
              <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
                このデバイスのデータをアカウントへ移す
              </div>
              <p className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed mb-3">
                ログイン前にこの端末で入力した内容を、クラウドへ一括コピーします。
                同じ項目はこの端末の内容で上書きされます。
              </p>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs tracking-[0.3em] border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-40"
              >
                {syncing ? "移行中…" : "↑ アカウントへ移す"}
              </button>
              {syncMsg && (
                <p className="mt-3 text-[11px] text-[var(--color-fg-mute)] leading-relaxed">
                  {syncMsg}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-6">
            <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-4">
              ログインすると、PC とスマホで同じデータを使えます。
              今このデバイスにある内容は、ログイン後に「アカウントへ移す」で引き継げます。
            </p>
            <Link
              href="/login"
              className="inline-block text-xs tracking-[0.3em] bg-[var(--color-ink)] text-white px-5 py-2.5 hover:bg-[var(--color-ink-soft)] transition"
            >
              ログイン / 新規登録 →
            </Link>
          </div>
        )}
      </section>

      {/* Current plan */}
      <section className="py-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          01 ・ 現在のプラン
        </div>

        <div className="border border-[var(--color-line)] p-6 mb-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <div>
              <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-1">
                YOUR PLAN
              </div>
              <div className="serif text-3xl text-[var(--color-ink)]">
                {isPremium ? "Premium" : "Free"}
              </div>
            </div>
            {isPremium ? (
              <div className="text-right">
                <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
                  ★ ACTIVE
                </div>
                <div className="serif text-xl text-[var(--color-ink)] mt-1">
                  ¥{PREMIUM_PRICE_MONTHLY_JPY.toLocaleString()}
                  <span className="text-sm text-[var(--color-fg-mute)] ml-1">/月</span>
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)]">
                  無料で全機能（コーチ除く）
                </div>
              </div>
            )}
          </div>

          {/* Dev-mode toggle */}
          <div className="hairline-top pt-4">
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-2">
              開発用 ・ プラン切替（Phase 3 で Stripe 接続予定）
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUserPlan("free")}
                className={`flex-1 py-2.5 text-xs tracking-[0.3em] border transition ${
                  plan === "free"
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                    : "border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
                }`}
              >
                FREE
              </button>
              <button
                onClick={() => setUserPlan("premium")}
                className={`flex-1 py-2.5 text-xs tracking-[0.3em] border transition ${
                  plan === "premium"
                    ? "border-[var(--color-gold)] bg-[var(--color-gold)] text-white"
                    : "border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
                }`}
              >
                ★ PREMIUM
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plan comparison */}
      <section className="py-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          02 ・ プランで使えるもの
        </div>

        <div className="hairline-top">
          <div className="grid grid-cols-12 gap-3 py-2.5 hairline-bottom text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            <div className="col-span-6">機能</div>
            <div className="col-span-3 text-center">FREE</div>
            <div className="col-span-3 text-center text-[var(--color-gold)]">★ PREMIUM</div>
          </div>
          {PLAN_FEATURES.map((f, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-3 items-center py-3 hairline-bottom text-sm"
            >
              <div className="col-span-6 text-[var(--color-ink)]">{f.label}</div>
              <div className="col-span-3 text-center">
                {f.free ? (
                  <span className="text-[var(--color-ink)]">✓</span>
                ) : (
                  <span className="text-[var(--color-fg-faint)]">—</span>
                )}
              </div>
              <div className="col-span-3 text-center">
                {f.premium ? (
                  <span className="text-[var(--color-gold)]">★</span>
                ) : (
                  <span className="text-[var(--color-fg-faint)]">—</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-[11px] text-[var(--color-fg-faint)] leading-relaxed">
          Premium: ¥{PREMIUM_PRICE_MONTHLY_JPY.toLocaleString()}/月 ・ 年払い ¥
          {PREMIUM_PRICE_YEARLY_JPY.toLocaleString()}（2 ヶ月分お得）
        </div>
      </section>

      {/* Daily report import */}
      <section className="py-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          03 ・ 日報インポート
        </div>
        {mode === "cloud" ? (
          <IngestTokensSection />
        ) : (
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
            日報インポート（トークン発行）はログイン中のみ利用できます。
            <Link
              href="/login"
              className="text-[var(--color-ink)] underline ml-1"
            >
              ログイン
            </Link>
          </p>
        )}
      </section>

      {/* Data management */}
      <section className="py-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          04 ・ データ
        </div>
        <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-4">
          {mode === "cloud"
            ? "現在、データはクラウド（アカウント）に保存され、PC・スマホで同期されます。"
            : "現在、データはこのブラウザにのみ保存されています。ログインするとクラウドで同期できます。"}
        </p>
        <button
          onClick={() => {
            if (typeof window === "undefined") return;
            if (!confirm("すべてのデータを消去しますか？\nこの操作は取り消せません。")) return;
            window.localStorage.removeItem("hokushin:v3:state");
            window.localStorage.removeItem("hokushin:onboardingSkipped");
            window.location.href = "/";
          }}
          className="text-xs tracking-[0.3em] border border-red-500/40 text-red-600 px-4 py-2 hover:bg-red-50 transition"
        >
          ⚠ すべてのデータを消去（開発用）
        </button>
      </section>

      <div className="hairline-top mt-8 pt-8 pb-16">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
      </div>
    </div>
  );
}
