"use client";

import Link from "next/link";
import {
  PLAN_FEATURES,
  PREMIUM_PRICE_MONTHLY_JPY,
  PREMIUM_PRICE_YEARLY_JPY,
} from "@/lib/constants";

interface PremiumGateProps {
  open: boolean;
  onClose: () => void;
  /** Title shown at the top of the gate. */
  feature?: string;
}

export function PremiumGate({
  open,
  onClose,
  feature = "AI コーチ",
}: PremiumGateProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-[var(--color-ink)]/40 z-50 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="hairline-bottom px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] tracking-[0.4em] text-[var(--color-gold)] mb-1">
              ★ &nbsp; PREMIUM
            </div>
            <div className="serif text-base text-[var(--color-ink)]">
              {feature} を使うには
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] text-xl leading-none px-2"
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8">

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="serif text-4xl text-[var(--color-ink)] leading-tight mb-2">
              対話で、深く。
            </div>
            <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
              一人で書くと、手が止まる。
              <br />
              コーチが質問しながら、あなたの中の言葉を引き出します。
            </p>
          </div>

          {/* Pricing */}
          <div className="border border-[var(--color-line)] p-6 mb-8">
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
              PREMIUM
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="serif text-5xl text-[var(--color-ink)]">
                ¥{PREMIUM_PRICE_MONTHLY_JPY.toLocaleString()}
              </span>
              <span className="text-sm text-[var(--color-fg-mute)]">/ 月</span>
            </div>
            <div className="text-[11px] text-[var(--color-fg-faint)] mb-4">
              年払い：¥{PREMIUM_PRICE_YEARLY_JPY.toLocaleString()}（2 ヶ月分お得）
            </div>

            <button
              type="button"
              disabled
              className="w-full py-3 bg-[var(--color-ink)] text-white text-xs tracking-[0.3em] mb-2 opacity-50 cursor-not-allowed"
            >
              アップグレード（準備中）
            </button>
            <p className="text-[10px] text-[var(--color-fg-faint)] text-center leading-relaxed">
              ※ 課金システムは Phase 3 で接続予定。
              <br />
              開発中は{" "}
              <Link
                href="/settings"
                onClick={onClose}
                className="text-[var(--color-ink)] underline"
              >
                設定
              </Link>{" "}
              から手動で切り替えできます。
            </p>
          </div>

          {/* Features comparison */}
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-3">
            プランで使えるもの
          </div>
          <div className="hairline-top">
            {PLAN_FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 hairline-bottom text-xs"
              >
                <span
                  className={`w-4 text-center ${
                    f.premium ? "text-[var(--color-gold)]" : "text-[var(--color-fg-faint)]"
                  }`}
                >
                  {f.premium ? "★" : "—"}
                </span>
                <span className="flex-1 text-[var(--color-ink)]">{f.label}</span>
                <span
                  className={`w-12 text-center text-[10px] tracking-widest ${
                    f.free ? "text-[var(--color-fg-mute)]" : "text-[var(--color-fg-faint)]"
                  }`}
                >
                  {f.free ? "FREE" : "—"}
                </span>
                <span className="w-16 text-center text-[10px] tracking-widest text-[var(--color-gold)]">
                  PREMIUM
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="hairline-top px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs tracking-[0.3em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
          >
            自分で書く（Free のまま続ける）
          </button>
          <Link
            href="/settings"
            onClick={onClose}
            className="text-xs tracking-[0.3em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
          >
            設定へ →
          </Link>
        </div>
      </aside>
    </>
  );
}
