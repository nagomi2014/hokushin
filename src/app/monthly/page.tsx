"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  currentYearMonth,
  daysInMonth,
  monthMoment,
  todayString,
  useAppState,
} from "@/lib/storage";
import { FIELD_MAP } from "@/lib/constants";
import { useTools } from "@/lib/tools/useTools";
import { activeFieldIds } from "@/lib/fields";
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
  const { state, loaded, upsertMonthlyPlan, addDailyTask } = useAppState();
  const [addedMsg, setAddedMsg] = useState(false);
  const [reflectOpen, setReflectOpen] = useState(false);

  // 今が月初（目標を立てる）／月末（振り返る）か
  const moment = useMemo(() => monthMoment(), []);
  const {
    selectedFields,
    monthGoals,
    primaryMonthGoal,
    addMonthGoal,
    setMonthGoalText,
    removeMonthGoal,
    setPrimaryMonthGoal,
  } = useTools();

  const initial = currentYearMonth();
  const [ym, setYm] = useState(initial);

  const ymKey = `${ym.year}-${String(ym.month).padStart(2, "0")}`;
  const isViewingThisMonth =
    ym.year === initial.year && ym.month === initial.month;

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

  // 取り組む分野
  const monthFieldIds = useMemo(
    () => activeFieldIds(selectedFields, state.fields),
    [selectedFields, state.fields],
  );

  // 今月の最重要目標（idと本文）
  const primaryId = primaryMonthGoal[ymKey];
  const primaryGoalObj = monthGoals.find((g) => g.id === primaryId);
  const primaryText = primaryGoalObj?.text.trim() ?? "";

  // この月に書いた「今月の目標」（振り返りへ引用する対象）
  const thisMonthGoals = monthGoals.filter(
    (g) => g.ym === ymKey && g.text.trim(),
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

  // 最重要目標（★で選んだもの）を、クラウド同期の primaryGoal にも反映する。
  // この月で新モデル（今月の目標）を使い始めた場合のみ反映し、過去データは触らない。
  const usesMonthGoals = monthGoals.some((g) => g.ym === ymKey);
  useEffect(() => {
    if (!loaded || !usesMonthGoals) return;
    if (primaryText !== (plan.primaryGoal ?? "").trim()) {
      update("primaryGoal", primaryText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryText, loaded, usesMonthGoals, plan.primaryGoal]);

  function addPrimaryToToday() {
    if (!primaryText) return;
    addDailyTask({
      date: todayString(),
      title: primaryText,
      fieldId: (primaryGoalObj?.fieldId as FieldId | undefined) ?? null,
      completed: false,
    });
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 1800);
  }

  // 今月の目標を、達成チェック（☐＝未達がデフォルト）付きで振り返り欄に引用する
  function quoteGoalsIntoReflection() {
    if (thisMonthGoals.length === 0) return;
    const header = "■ 今月の目標の振り返り";
    if (plan.reflection.includes(header)) return; // 二重挿入を防ぐ
    const lines = thisMonthGoals.map((g) => {
      const fname =
        g.fieldId != null ? `${FIELD_MAP[g.fieldId as FieldId].nameJaShort}：` : "";
      const star = g.id === primaryId ? "（★最重要）" : "";
      return `☐ ${fname}${g.text.trim()}${star}`;
    });
    const block = `${header}\n${lines.join(
      "\n",
    )}\n（☐＝未達／☑＝達成。達成できたものは☑に変えてください）`;
    const cur = plan.reflection.trim();
    update("reflection", cur ? `${cur}\n\n${block}` : block);
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
          選んだ分野ごとに、今月の目標を立てる。その中から最重要をひとつ。
        </p>
      </section>

      {/* 月初／月末の合図（開いてすぐ気づくように） */}
      {isViewingThisMonth && moment === "start" && (
        <button
          type="button"
          onClick={() => {
            document
              .getElementById("month-goals")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="block w-full text-left bg-[var(--color-ink)] text-white px-6 py-4 mt-6 hover:bg-[var(--color-ink-soft)] transition"
        >
          <span className="text-[var(--color-gold)] mr-2">★</span>
          <span className="text-sm tracking-[0.15em]">
            新しい月のはじまりです。今月の目標を立てましょう
          </span>
          <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
            先月の振り返りを手がかりに、分野ごとの今月の目標を →
          </span>
        </button>
      )}
      {isViewingThisMonth && moment === "end" && (
        <button
          type="button"
          onClick={() => {
            setReflectOpen(true);
            setTimeout(
              () =>
                document
                  .getElementById("this-month-reflection")
                  ?.scrollIntoView({ behavior: "smooth" }),
              60,
            );
          }}
          className="block w-full text-left bg-[var(--color-ink)] text-white px-6 py-4 mt-6 hover:bg-[var(--color-ink-soft)] transition"
        >
          <span className="text-[var(--color-gold)] mr-2">★</span>
          <span className="text-sm tracking-[0.15em]">
            今月もおつかれさまでした。ふり返りを書きましょう
          </span>
          <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
            来月の「先月の振り返り」として、ここに残ります →
          </span>
        </button>
      )}

      {/* 今月の最重要目標（★で選ばれたもの） */}
      <Section number="01" title="今月の最重要目標" caption="MOST IMPORTANT">
        {primaryText ? (
          <div className="bg-[var(--color-ink)] text-white px-5 py-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="text-[9px] tracking-[0.3em] text-[var(--color-gold)]">
                ★ THIS MONTH
              </div>
              <button
                type="button"
                onClick={addPrimaryToToday}
                className="text-[10px] tracking-[0.2em] border border-white/30 text-white px-2.5 py-1 hover:bg-white hover:text-[var(--color-ink)] transition whitespace-nowrap"
              >
                {addedMsg ? "追加しました ✓" : "＋ 今日のタスクに追加"}
              </button>
            </div>
            <div className="serif text-xl leading-relaxed">{primaryText}</div>
          </div>
        ) : (
          <p className="text-[12px] text-[var(--color-fg-faint)] italic">
            下の「今月の目標」を書いて、その中のひとつを ★ で「最重要」に選んでください。
          </p>
        )}
      </Section>

      {/* 今月の目標（分野ごとに複数） */}
      <Section number="02" title="今月の目標" caption="THIS MONTH'S GOALS" id="month-goals">
        <p className="text-[11px] text-[var(--color-fg-faint)] mb-6 leading-relaxed">
          選んだ分野ごとに、今月の目標を書きます（いくつでも）。
          いちばん大切なものを ★ で選ぶと、上の「最重要目標」になります。
        </p>

        {monthFieldIds.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--color-fg-faint)]">
            取り組む分野がまだありません。
            <Link
              href="/fields"
              className="ml-2 border-b border-[var(--color-line)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            >
              目標設定で分野を選ぶ →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {monthFieldIds.map((fid) => {
              const f = FIELD_MAP[fid];
              const goals = monthGoals.filter(
                (g) => g.ym === ymKey && g.fieldId === fid,
              );
              const shortTerm = state.fields[fid]?.shortTerm?.trim() ?? "";
              return (
                <div key={fid}>
                  <div className="flex items-baseline gap-3 mb-3 hairline-bottom pb-2">
                    <span className="serif text-lg text-[var(--color-ink)]">
                      {f.nameJa}
                    </span>
                    {shortTerm && (
                      <span className="text-[10px] text-[var(--color-fg-faint)]">
                        <span className="tracking-[0.15em] mr-1">短期目標</span>
                        {shortTerm}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {goals.map((g) => {
                      const isPrimary = primaryId === g.id;
                      return (
                        <div key={g.id} className="flex items-center gap-2 group">
                          <button
                            type="button"
                            onClick={() => setPrimaryMonthGoal(ymKey, g.id)}
                            className={`text-base leading-none ${
                              isPrimary
                                ? "text-[var(--color-gold)]"
                                : "text-[var(--color-line)] hover:text-[var(--color-gold)]"
                            } transition`}
                            aria-label="最重要に選ぶ"
                            title="最重要に選ぶ"
                          >
                            {isPrimary ? "★" : "☆"}
                          </button>
                          <input
                            type="text"
                            value={g.text}
                            onChange={(e) => setMonthGoalText(g.id, e.target.value)}
                            placeholder="今月の目標を書く…"
                            className={`flex-1 border-b px-2 py-2 text-sm text-[var(--color-ink)] focus:outline-none transition ${
                              isPrimary
                                ? "border-[var(--color-gold)]"
                                : "border-[var(--color-line)] focus:border-[var(--color-ink)]"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => removeMonthGoal(g.id)}
                            className="opacity-0 group-hover:opacity-100 text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition text-xs"
                            aria-label="削除"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => addMonthGoal(ymKey, fid)}
                      className="mt-1 text-[11px] tracking-[0.2em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
                    >
                      ＋ {f.nameJaShort}の目標を追加
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {primaryText && (
        <section className="mt-12 pt-10 hairline-top">
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
            ③ 動く ・ NEXT
          </div>
          <h2 className="serif text-2xl md:text-3xl text-[var(--color-ink)] mb-2">
            今月の目標を、今日の行動へ
          </h2>
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-8 max-w-2xl">
            目標は立てただけでは動きません。最重要目標を、今日できる小さな一歩に分けましょう。
            上の「今日のタスクに追加」を押すか、日々のページで組み立てます。
          </p>
          <Link
            href="/daily"
            className="block bg-white p-6 hover:bg-[var(--color-paper-soft)] transition group border border-[var(--color-line)]"
          >
            <div className="flex items-baseline justify-between mb-3">
              <span className="serif text-2xl text-[var(--color-fg-faint)] group-hover:text-[var(--color-gold)] transition">
                →
              </span>
              <span className="text-[9px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                DAILY
              </span>
            </div>
            <div className="serif text-lg text-[var(--color-ink)] mb-2">
              今日のタスクに落とす
              <span className="text-[var(--color-gold)] ml-2 text-sm">→</span>
            </div>
            <p className="text-[12px] text-[var(--color-fg-mute)] leading-relaxed">
              今月の一手を、今日できる行動に分ける。ここで初めて“動き”が始まる。
            </p>
          </Link>
        </section>
      )}

      {/* 先月の振り返り（読むだけ・下に置く） */}
      <Section number="03" title="先月の振り返り" caption="LAST MONTH">
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

      {/* 今月の振り返り（ふだんは畳んでおく・月末に書く） */}
      <section id="this-month-reflection" className="py-8 hairline-bottom scroll-mt-24">
        {reflectOpen ? (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="serif text-lg text-[var(--color-ink)]">
                今月の振り返り
              </h2>
              <button
                type="button"
                onClick={() => setReflectOpen(false)}
                className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)]"
              >
                閉じる −
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-fg-faint)] mb-3">
              この月を振り返って書きます。来月の「先月の振り返り」として見えるようになります。
            </p>
            {thisMonthGoals.length > 0 && (
              <div className="mb-3 flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={quoteGoalsIntoReflection}
                  disabled={plan.reflection.includes("■ 今月の目標の振り返り")}
                  className="text-[11px] tracking-[0.2em] border border-[var(--color-line)] text-[var(--color-fg-mute)] px-3 py-1.5 hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ★ 今月の目標を引用
                </button>
                <span className="text-[10px] text-[var(--color-fg-faint)]">
                  {plan.reflection.includes("■ 今月の目標の振り返り")
                    ? "引用済み"
                    : `${thisMonthGoals.length}件の目標を達成チェック付きで挿入`}
                </span>
              </div>
            )}
            <textarea
              value={plan.reflection}
              onChange={(e) => update("reflection", e.target.value)}
              rows={6}
              placeholder="この月、何ができたか・何ができなかったか・気づいたこと…"
              className="w-full border border-[var(--color-line)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setReflectOpen(true)}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
          >
            ＋ 今月の振り返りを書く{plan.reflection.trim() ? "（記入済み）" : ""}
          </button>
        )}
      </section>

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

    </div>
  );
}

function Section({
  number,
  title,
  caption,
  children,
  id,
}: {
  number: string;
  title: string;
  caption: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="py-10 hairline-bottom scroll-mt-24">
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
