"use client";

import Link from "next/link";
import { useState } from "react";
import { PYRAMID_TIERS, PYRAMID_WIDTHS } from "@/lib/constants";
import { useAppState } from "@/lib/storage";
import { CoachDrawer } from "@/components/CoachDrawer";
import type { PyramidLevel } from "@/lib/types";

export default function PyramidPage() {
  const { state, loaded, setPyramid } = useAppState();
  const [coachLevel, setCoachLevel] = useState<PyramidLevel | null>(null);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10">

      {/* Header */}
      <section className="pt-20 pb-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; SUCCESS&nbsp;PYRAMID
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          成功のピラミッド
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          土台が深いほど、頂点は澄み切る。
          土台（人生理念）から順に書き上げ、頂点（日々の実践）に降りてくる。
        </p>
      </section>

      {/* Visual pyramid */}
      <section className="py-12 hairline-bottom">
        <div className="flex flex-col items-center max-w-2xl mx-auto">
          {PYRAMID_TIERS.map((tier) => {
            const isFoundation = tier.level === 1;
            return (
              <a
                key={tier.level}
                href={`#tier-${tier.level}`}
                className="pyramid-tier"
                style={{
                  width: PYRAMID_WIDTHS[tier.level],
                  background: tier.gradient,
                }}
              >
                <span
                  className="tier-num"
                  style={
                    isFoundation ? { color: "var(--color-gold)" } : undefined
                  }
                >
                  {tier.kanji}
                </span>
                <span className="tier-name">{tier.nameJa}</span>
                <span
                  className="tier-en"
                  style={
                    isFoundation ? { color: "var(--color-gold)" } : undefined
                  }
                >
                  {tier.nameEn}
                  {isFoundation && " ★"}
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Editor */}
      <section className="py-12">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          編集
        </div>
        <h2 className="serif text-2xl text-[var(--color-ink)] mb-10">
          五つの階層を書き整える
        </h2>

        <div className="space-y-12">
          {/* 下から積み上げる順で並べる（土台が最初） */}
          {[...PYRAMID_TIERS].reverse().map((tier) => {
            const entry = state.pyramid[tier.level];
            const isFoundation = tier.level === 1;
            return (
              <div
                key={tier.level}
                id={`tier-${tier.level}`}
                className="grid grid-cols-12 gap-8 scroll-mt-24"
              >
                <div className="col-span-12 md:col-span-3">
                  <div
                    className="serif text-4xl mb-3"
                    style={{
                      color: isFoundation
                        ? "var(--color-gold)"
                        : "var(--color-ink)",
                    }}
                  >
                    {tier.kanji}
                  </div>
                  <div className="serif text-lg text-[var(--color-ink)] mb-1">
                    {tier.nameJa}
                  </div>
                  <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-3">
                    {tier.nameEn}
                  </div>
                  <p className="text-xs text-[var(--color-fg-mute)] leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                <div className="col-span-12 md:col-span-9">
                  <textarea
                    value={entry?.content ?? ""}
                    onChange={(e) => setPyramid(tier.level, e.target.value)}
                    placeholder={`${tier.nameJa.replace(/　/g, "")} を書く…`}
                    rows={isFoundation ? 6 : 4}
                    className="w-full border border-[var(--color-line)] bg-white px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    {entry?.updatedAt && entry.content ? (
                      <div className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
                        LAST UPDATED · {entry.updatedAt.slice(0, 10)}
                      </div>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => setCoachLevel(tier.level)}
                      className="text-[10px] tracking-[0.3em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
                    >
                      {state.userPlan === "premium" ? "★ " : "★ PREMIUM ・ "}
                      コーチに相談する →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 hairline-top pt-8 flex items-center justify-between">
          <Link
            href="/"
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
          >
            ← BACK&nbsp;TO&nbsp;DASHBOARD
          </Link>
          <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            AUTO-SAVED · LOCAL
          </span>
        </div>
      </section>

      <CoachDrawer
        open={coachLevel !== null}
        onClose={() => setCoachLevel(null)}
        context={{
          kind: "pyramid",
          level: (coachLevel ?? 1) as PyramidLevel,
        }}
        onApply={(draft) => {
          if (coachLevel !== null) setPyramid(coachLevel, draft);
        }}
      />

    </div>
  );
}
