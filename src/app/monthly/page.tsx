"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  currentYearMonth,
  daysInMonth,
  useAppState,
} from "@/lib/storage";
import { GuidedDerivation } from "@/components/GuidedDerivation";
import { buildMonthlyQuestions, synthesizeMonthly } from "@/lib/coach/guided";
import { FIELD_MAP } from "@/lib/constants";
import { useTools } from "@/lib/tools/useTools";
import { activeFieldIds, fieldHasState } from "@/lib/fields";
import type { FieldId, MonthlyPlan } from "@/lib/types";

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

  const { selectedFields } = useTools();

  // 取り組む分野に絞って、今月の問いを組み立てる（紐づけ）
  const activeFieldGoals = useMemo(() => {
    const rec: Partial<
      Record<FieldId, { shortTerm: string; midTerm: string; longTerm: string }>
    > = {};
    for (const id of activeFieldIds(selectedFields, state.fields)) {
      rec[id] = state.fields[id];
    }
    return rec;
  }, [selectedFields, state.fields]);
  const monthlyQuestions = useMemo(
    () => buildMonthlyQuestions(activeFieldGoals),
    [activeFieldGoals],
  );
  const fieldsWithStates = useMemo(
    () =>
      activeFieldIds(selectedFields, state.fields)
        .map((id) => FIELD_MAP[id])
        .filter((f) => fieldHasState(state.fields[f.id])),
    [selectedFields, state.fields],
  );

  // 先月（前月）の振り返り
  const prevYm =
    ym.month === 1
      ? { year: ym.year - 1, month: 12 }
      : { year: ym.year, month: ym.month - 1 };
  const prevReflection =
    state.monthlyPlans
      .find((p) => p.year === prevYm.year && p.month === prevYm.month)
      ?.reflection?.trim() ?? "";

  function update<K extends keyof MonthlyPlan>(key: K, value: MonthlyPlan[K]) {
    const next: MonthlyPlan = {
      ...plan,
      [key]: value,
      updatedAt: new Date().toISOString(),
    };
    setPlan(next);
    upsertMonthlyPlan(next);
  }

  function setGoalFromField(fieldId: FieldId) {
    const g = state.fields[fieldId];
    const target = (g.shortTerm || g.midTerm || g.longTerm).trim();
    if (!target) return;
    update("primaryGoal", `${FIELD_MAP[fieldId].nameJaShort}「${target}」に近づく`);
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
          選んだ目標から、今月この一手をどこに置くか。
        </p>
      </section>

      {/* 先月の振り返り（読むだけ・今月を決める手がかり） */}
      <Section number="00" title="先月の振り返り" caption="LAST MONTH">
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
          {prevYm.year}.{String(prevYm.month).padStart(2, "0")}
        </div>
        {prevReflection ? (
          <div className="border-l-2 border-[var(--color-gold)] pl-4 text-sm leading-relaxed text-[var(--color-ink)] whitespace-pre-wrap">
            {prevReflection}
          </div>
        ) : (
          <p className="text-[12px] text-[var(--color-fg-faint)] italic">
            先月の振り返りはまだありません。
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="ml-2 not-italic border-b border-[var(--color-line)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            >
              先月を開いて書く →
            </button>
          </p>
        )}
      </Section>

      {/* Primary goal（選んだ分野の長期・中期・短期から作る） */}
      <Section number="01" title="今月の最重要目標" caption="THIS MONTH'S GOAL">
        {fieldsWithStates.length > 0 && (
          <div className="mb-5">
            <div className="flex items-baseline justify-between mb-3">
              <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                選んだ目標から決める
              </div>
              <button
                type="button"
                onClick={() => setCoachOpen(true)}
                className="text-[10px] tracking-[0.25em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition border-b border-[var(--color-gold)] hover:border-[var(--color-ink)] pb-0.5"
              >
                ★ 質問で決める →
              </button>
            </div>
            <div className="space-y-px bg-[var(--color-line)] border border-[var(--color-line)]">
              {fieldsWithStates.map((f) => {
                const g = state.fields[f.id];
                return (
                  <div key={f.id} className="bg-white px-4 py-3">
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <span className="serif text-sm text-[var(--color-ink)]">
                        {f.nameJa}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGoalFromField(f.id)}
                        className="text-[10px] tracking-[0.2em] text-[var(--color-ink)] border border-[var(--color-line)] px-2.5 py-1 hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-soft)] transition whitespace-nowrap"
                      >
                        今月これを進める →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] leading-relaxed">
                      {g.longTerm.trim() && (
                        <span>
                          <span className="text-[var(--color-fg-faint)] tracking-[0.15em] mr-1">
                            長期
                          </span>
                          <span className="text-[var(--color-fg-mute)]">
                            {g.longTerm.trim()}
                          </span>
                        </span>
                      )}
                      {g.midTerm.trim() && (
                        <span>
                          <span className="text-[var(--color-fg-faint)] tracking-[0.15em] mr-1">
                            中期
                          </span>
                          <span className="text-[var(--color-fg-mute)]">
                            {g.midTerm.trim()}
                          </span>
                        </span>
                      )}
                      {g.shortTerm.trim() && (
                        <span>
                          <span className="text-[var(--color-gold)] tracking-[0.15em] mr-1">
                            短期
                          </span>
                          <span className="text-[var(--color-ink)]">
                            {g.shortTerm.trim()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <textarea
          value={plan.primaryGoal}
          onChange={(e) => update("primaryGoal", e.target.value)}
          rows={2}
          placeholder="今月、いちばん大切な一手は…（上のボタンから引き込んで、整えてもOK）"
          className="w-full border border-[var(--color-line)] px-4 py-3 serif text-xl text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
        />
      </Section>

      {/* Reflection（今月を振り返る・月末に書く） */}
      <Section number="02" title="今月の振り返り" caption="REFLECTION">
        <p className="text-[11px] text-[var(--color-fg-faint)] mb-3">
          月末に、この月を振り返って書きます。来月の「先月の振り返り」として、ここに見えるようになります。
        </p>
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
              {fieldsWithStates.length > 0 && (
                <div className="mb-5 bg-[var(--color-paper-soft)] border-l-2 border-[var(--color-gold)] px-4 py-3">
                  <div className="text-[9px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
                    目標・目指す状態
                  </div>
                  <div className="space-y-1">
                    {fieldsWithStates.map((f) => {
                      const g = state.fields[f.id];
                      const goal = (g.shortTerm || g.midTerm || g.longTerm).trim();
                      return (
                        <div key={f.id} className="flex items-baseline gap-2 text-[11px]">
                          <span className="text-[var(--color-gold)] tracking-[0.15em] w-12 shrink-0">
                            {f.nameJaShort}
                          </span>
                          <span className="text-[var(--color-ink)]">{goal}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <GuidedDerivation
                questions={monthlyQuestions}
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
