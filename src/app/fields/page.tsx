"use client";

import Link from "next/link";
import { useState } from "react";
import { FIELDS } from "@/lib/constants";
import { todayString, useAppState } from "@/lib/storage";
import { CoachDrawer } from "@/components/CoachDrawer";
import type { DailyTask, FieldId } from "@/lib/types";

export default function FieldsPage() {
  const { state, loaded, setField } = useAppState();
  const [coachFieldId, setCoachFieldId] = useState<FieldId | null>(null);
  const today = todayString();

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10">

      <section className="pt-20 pb-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; SEVEN&nbsp;FIELDS
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          七つの分野
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          <span className="text-[var(--color-ink)]">長期（5年以上）</span>
          <span className="text-[var(--color-gold)] mx-2">→</span>
          <span className="text-[var(--color-ink)]">中期（1〜5年）</span>
          <span className="text-[var(--color-gold)] mx-2">→</span>
          <span className="text-[var(--color-ink)]">短期（1年以内）</span>
          <span className="text-[var(--color-gold)] mx-2">→</span>
          <span className="text-[var(--color-ink)]">今日のタスク</span>
          へ落とし込んでいく。
        </p>
      </section>

      <section className="py-8 space-y-16">
        {FIELDS.map((field) => {
          const goal = state.fields[field.id];
          const todayTasks = state.dailyTasks.filter(
            (t) => t.date === today && t.fieldId === field.id,
          );
          return (
            <div
              key={field.id}
              id={`field-${field.id}`}
              className="scroll-mt-24"
            >
              {/* Field header */}
              <div className="flex items-baseline justify-between hairline-bottom pb-3 mb-6 gap-3 flex-wrap">
                <div className="flex items-baseline gap-5">
                  <span className="serif text-3xl text-[var(--color-fg-faint)]">
                    {field.number}
                  </span>
                  <h2 className="serif text-2xl text-[var(--color-ink)]">
                    {field.nameJa}
                  </h2>
                  <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                    {field.nameEn}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setCoachFieldId(field.id)}
                    className="text-[10px] tracking-[0.3em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
                  >
                    {state.userPlan === "premium" ? "★ " : "★ PREMIUM ・ "}
                    コーチに相談する
                  </button>
                  <span className="w-px h-4 bg-[var(--color-line)]" />
                  <span className="text-[var(--color-fg-mute)] tracking-widest">
                    PROGRESS
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={goal?.progress ?? 0}
                    onChange={(e) =>
                      setField(field.id, {
                        progress: Math.max(
                          0,
                          Math.min(100, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    className="w-16 text-right border border-[var(--color-line)] px-2 py-1 serif text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
                  />
                  <span className="serif text-[var(--color-fg-faint)] text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* 4-column flow: 長期 → 中期 → 短期 → 今日のタスク */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FieldTermInput
                  label="長期目標"
                  caption="5 年 以上"
                  arrow
                  value={goal?.longTerm ?? ""}
                  onChange={(v) => setField(field.id, { longTerm: v })}
                />
                <FieldTermInput
                  label="中期目標"
                  caption="1 〜 5 年"
                  arrow
                  value={goal?.midTerm ?? ""}
                  onChange={(v) => setField(field.id, { midTerm: v })}
                />
                <FieldTermInput
                  label="短期目標"
                  caption="1 年以内"
                  arrow
                  value={goal?.shortTerm ?? ""}
                  onChange={(v) => setField(field.id, { shortTerm: v })}
                />
                <TodayTasksColumn tasks={todayTasks} />
              </div>

              {/* Progress bar visual */}
              <div className="mt-6 flex items-center gap-3 text-xs">
                <div className="flex-1 h-px bg-[var(--color-line)] relative">
                  <div
                    className="absolute h-px bg-[var(--color-ink)] top-0"
                    style={{ width: `${goal?.progress ?? 0}%` }}
                  />
                </div>
                <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
                  {goal?.updatedAt
                    ? `UPDATED · ${goal.updatedAt.slice(0, 10)}`
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      <div className="hairline-top mt-8 pt-8 pb-16 flex items-center justify-between">
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

      <CoachDrawer
        open={coachFieldId !== null}
        onClose={() => setCoachFieldId(null)}
        context={{
          kind: "field",
          fieldId: (coachFieldId ?? 1) as FieldId,
        }}
        onApply={(draft) => {
          if (coachFieldId !== null) setField(coachFieldId, { shortTerm: draft });
        }}
      />

    </div>
  );
}

function FieldTermInput({
  label,
  caption,
  value,
  onChange,
  arrow = false,
}: {
  label: string;
  caption: string;
  value: string;
  onChange: (v: string) => void;
  arrow?: boolean;
}) {
  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-2">
        <span className="serif text-sm text-[var(--color-ink)]">{label}</span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          {caption}
        </span>
      </div>
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="目標を書く…"
        className="w-full border border-[var(--color-line)] bg-white px-3 py-2 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
      />
      {arrow && (
        <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 text-[var(--color-gold)] text-lg z-10 pointer-events-none">
          →
        </div>
      )}
    </div>
  );
}

function TodayTasksColumn({ tasks }: { tasks: DailyTask[] }) {
  const done = tasks.filter((t) => t.completed).length;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="serif text-sm text-[var(--color-gold)]">今日のタスク</span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          NOW
        </span>
      </div>
      <div className="border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2 min-h-[7.5rem] text-sm">
        {tasks.length === 0 ? (
          <div className="text-[11px] text-[var(--color-fg-faint)] italic">
            この分野のタスクはまだありません。
            <Link
              href="/daily"
              className="block mt-2 text-[10px] tracking-[0.25em] text-[var(--color-ink)] not-italic border-b border-[var(--color-ink)] pb-0.5 inline-block"
            >
              ＋ 追加する
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-1.5 mb-2">
              {tasks.slice(0, 4).map((t) => (
                <li
                  key={t.id}
                  className={`text-[12px] flex items-center gap-2 ${
                    t.completed
                      ? "line-through text-[var(--color-fg-faint)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  <span className="text-[var(--color-gold)] text-[10px]">
                    {t.completed ? "✓" : "□"}
                  </span>
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
              {tasks.length > 4 && (
                <li className="text-[10px] text-[var(--color-fg-faint)] pl-4">
                  …他 {tasks.length - 4} 件
                </li>
              )}
            </ul>
            <div className="flex items-center justify-between text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] hairline-top pt-1.5">
              <span>
                {done} / {tasks.length}
              </span>
              <Link
                href="/daily"
                className="text-[var(--color-ink)] hover:text-[var(--color-gold)] transition"
              >
                → 本日の行
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
