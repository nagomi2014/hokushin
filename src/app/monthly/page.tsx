"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  currentYearMonth,
  daysInMonth,
  useAppState,
} from "@/lib/storage";
import { GuidedDerivation } from "@/components/GuidedDerivation";
import { MONTHLY_QUESTIONS, synthesizeMonthly } from "@/lib/coach/guided";
import type { MonthlyPlan } from "@/lib/types";

function emptyPlan(year: number, month: number): MonthlyPlan {
  return {
    year,
    month,
    primaryGoal: "",
    actionTheme: "",
    successPoints: [],
    themeMusic: "",
    habits: [],
    habitChecks: [],
    reflection: "",
    updatedAt: new Date().toISOString(),
  };
}

export default function MonthlyPage() {
  const { state, loaded, upsertMonthlyPlan } = useAppState();
  const initial = currentYearMonth();
  const [ym, setYm] = useState(initial);
  const [coachOpen, setCoachOpen] = useState(false);

  const existing = state.monthlyPlans.find(
    (p) => p.year === ym.year && p.month === ym.month,
  );
  const [plan, setPlan] = useState<MonthlyPlan>(
    existing ?? emptyPlan(ym.year, ym.month),
  );

  // Sync local plan when state or ym changes
  useEffect(() => {
    const found = state.monthlyPlans.find(
      (p) => p.year === ym.year && p.month === ym.month,
    );
    setPlan(found ?? emptyPlan(ym.year, ym.month));
  }, [state.monthlyPlans, ym.year, ym.month]);

  const totalDays = useMemo(() => daysInMonth(ym.year, ym.month), [ym]);

  function update<K extends keyof MonthlyPlan>(key: K, value: MonthlyPlan[K]) {
    const next: MonthlyPlan = {
      ...plan,
      [key]: value,
      updatedAt: new Date().toISOString(),
    };
    setPlan(next);
    upsertMonthlyPlan(next);
  }

  function addSuccessPoint() {
    update("successPoints", [...plan.successPoints, ""]);
  }
  function updateSuccessPoint(i: number, v: string) {
    const next = [...plan.successPoints];
    next[i] = v;
    update("successPoints", next);
  }
  function removeSuccessPoint(i: number) {
    update(
      "successPoints",
      plan.successPoints.filter((_, idx) => idx !== i),
    );
  }

  function shiftMonth(delta: number) {
    let m = ym.month + delta;
    let y = ym.year;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setYm({ year: y, month: m });
  }

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10">

      {/* Header */}
      <section className="pt-20 pb-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; MONTHLY&nbsp;PLAN
        </div>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight">
            {ym.year}<span className="text-[var(--color-fg-faint)]">.</span>
            {String(ym.month).padStart(2, "0")}
          </h1>
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => shiftMonth(-1)}
              className="px-3 py-1.5 border border-[var(--color-line)] hover:border-[var(--color-ink)] transition"
            >
              ← 前月
            </button>
            <button
              onClick={() => setYm(currentYearMonth())}
              className="px-3 py-1.5 border border-[var(--color-line)] hover:border-[var(--color-ink)] transition tracking-widest"
            >
              今月
            </button>
            <button
              onClick={() => shiftMonth(1)}
              className="px-3 py-1.5 border border-[var(--color-line)] hover:border-[var(--color-ink)] transition"
            >
              次月 →
            </button>
          </div>
        </div>
        <p className="text-[var(--color-fg-mute)] text-sm mt-4 tracking-wider">
          ピラミッドの「計画」── 今月この一手を、どこに置くか。
        </p>
        <button
          type="button"
          onClick={() => setCoachOpen(true)}
          className="mt-6 text-[10px] tracking-[0.3em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition border-b border-[var(--color-gold)] hover:border-[var(--color-ink)] pb-0.5"
        >
          ★ 質問で今月の計画を作る →
        </button>
      </section>

      {/* Primary goal */}
      <Section number="01" title="最重要目標" caption="MOST IMPORTANT GOAL">
        <textarea
          value={plan.primaryGoal}
          onChange={(e) => update("primaryGoal", e.target.value)}
          rows={2}
          placeholder="今月、いちばん大切な一手は…"
          className="w-full border border-[var(--color-line)] px-4 py-3 serif text-xl text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
        />
      </Section>

      {/* Action theme */}
      <Section number="02" title="行動テーマ" caption="ACTION THEME">
        <input
          type="text"
          value={plan.actionTheme}
          onChange={(e) => update("actionTheme", e.target.value)}
          placeholder="今月の合言葉…"
          className="w-full border border-[var(--color-line)] px-4 py-3 serif text-lg text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
        />
      </Section>

      {/* Success points */}
      <Section number="03" title="達成のポイント" caption="KEY POINTS">
        <div className="space-y-2">
          {plan.successPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <span className="serif text-[var(--color-fg-faint)] text-sm w-6">
                —
              </span>
              <input
                type="text"
                value={point}
                onChange={(e) => updateSuccessPoint(i, e.target.value)}
                placeholder={`ポイント ${i + 1}`}
                className="flex-1 border-b border-[var(--color-line)] px-2 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
              />
              <button
                onClick={() => removeSuccessPoint(i)}
                className="opacity-0 group-hover:opacity-100 text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition text-xs"
                aria-label="remove"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addSuccessPoint}
            className="mt-3 text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
          >
            ＋ ポイントを追加
          </button>
        </div>
      </Section>

      {/* Theme music */}
      <Section number="04" title="テーマ曲" caption="THEME MUSIC">
        <input
          type="text"
          value={plan.themeMusic}
          onChange={(e) => update("themeMusic", e.target.value)}
          placeholder="今月、何度も聴く一曲…"
          className="w-full border border-[var(--color-line)] px-4 py-3 text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
        />
      </Section>

      {/* Reflection */}
      <Section number="05" title="月間振り返り" caption="REFLECTION">
        <textarea
          value={plan.reflection}
          onChange={(e) => update("reflection", e.target.value)}
          rows={6}
          placeholder="この月、何ができたか・何ができなかったか・気づいたこと…"
          className="w-full border border-[var(--color-line)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
        />
      </Section>

      <div className="hairline-top mt-8 pt-8 pb-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          {totalDays} DAYS · AUTO-SAVED
        </span>
      </div>

      {coachOpen && (
        <>
          <div
            className="fixed inset-0 bg-[var(--color-ink)]/30 z-50"
            onClick={() => setCoachOpen(false)}
            aria-hidden
          />
          <aside className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-50 shadow-2xl flex flex-col">
            <div className="hairline-bottom px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[9px] tracking-[0.4em] text-[var(--color-gold)] mb-1">
                  ★ &nbsp; 質問で今月の計画を作る
                </div>
                <div className="serif text-base text-[var(--color-ink)]">
                  今月の最重要目標
                </div>
              </div>
              <button
                onClick={() => setCoachOpen(false)}
                className="text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] text-xl leading-none px-2"
                aria-label="close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <GuidedDerivation
                questions={MONTHLY_QUESTIONS}
                synthesize={synthesizeMonthly}
                onApply={(draft) => {
                  update("primaryGoal", draft);
                  setCoachOpen(false);
                }}
                onCancel={() => setCoachOpen(false)}
                doneLabel="今月の最重要目標にする"
                draftHeader="あなたの答えから、今月の一手が見えてきました"
                progressKey="monthly"
              />
            </div>
          </aside>
        </>
      )}

    </div>
  );
}

function Section({
  number,
  title,
  caption,
  children,
}: {
  number: string;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-10 hairline-bottom">
      <div className="flex items-baseline justify-between mb-5">
        <div className="flex items-baseline gap-4">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            {number}
          </span>
          <h2 className="serif text-2xl text-[var(--color-ink)]">{title}</h2>
        </div>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          {caption}
        </span>
      </div>
      {children}
    </section>
  );
}
