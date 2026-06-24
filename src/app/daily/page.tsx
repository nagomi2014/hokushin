"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FIELDS } from "@/lib/constants";
import { todayString, useAppState } from "@/lib/storage";
import { useTools } from "@/lib/tools/useTools";
import type { FieldId } from "@/lib/types";

// ある日付が属する ISO 週のキー（毎週の重複判定用）
function isoWeekKey(d: string): string {
  const dt = new Date(`${d}T00:00:00`);
  const target = new Date(dt.valueOf());
  const dayNr = (dt.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getDay() + 6) % 7)) /
        7,
    );
  return `${target.getFullYear()}-W${week}`;
}

export default function DailyPage() {
  const {
    state,
    loaded,
    addDailyTask,
    toggleDailyTask,
    removeDailyTask,
  } = useAppState();

  const { loaded: toolsLoaded, primeItems } = useTools();

  const [date, setDate] = useState<string>(todayString());
  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState<FieldId | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const today = todayString();

  // 第II領域で「定期（毎日/毎週）」にした一手を、今日の行へ自動投入する。
  // 重複は「同じ文言のタスクが今日（毎日）／今週（毎週）に既にあるか」で判定（端末またぎでも安全）。
  useEffect(() => {
    if (!loaded || !toolsLoaded) return;
    if (date !== today) return;
    const todayWeek = isoWeekKey(today);
    for (const p of primeItems) {
      if (!p.cadence || p.done) continue;
      const exists =
        p.cadence === "daily"
          ? state.dailyTasks.some(
              (t) => t.date === today && t.title === p.text,
            )
          : state.dailyTasks.some(
              (t) => t.title === p.text && isoWeekKey(t.date) === todayWeek,
            );
      if (!exists) {
        addDailyTask({
          date: today,
          title: p.text,
          fieldId: (p.fieldId as FieldId | undefined) ?? null,
          completed: false,
        });
      }
    }
  }, [loaded, toolsLoaded, date, today, primeItems, state.dailyTasks, addDailyTask]);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  const tasks = state.dailyTasks
    .filter((t) => t.date === date)
    .sort((a, b) => (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99"));

  const completed = tasks.filter((t) => t.completed).length;
  const pct = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addDailyTask({
      date,
      title: title.trim(),
      fieldId: fieldId === "" ? null : (fieldId as FieldId),
      completed: false,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    });
    setTitle("");
    setStartTime("");
    setEndTime("");
    setFieldId("");
  }

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10">

      {/* Header */}
      <section className="pt-12 pb-6 hairline-bottom">
        <div className="text-[10px] tracking-[0.45em] text-[var(--color-gold)] mb-2">
          ★ &nbsp; DAILY&nbsp;PRACTICE
        </div>
        <h1 className="serif text-2xl md:text-3xl text-[var(--color-ink)] leading-tight font-medium tracking-tight">
          本日の行
        </h1>
        <p className="text-[var(--color-fg-faint)] text-[11px] tracking-wider mt-1">
          今日この瞬間の一手を、ここで選ぶ。
        </p>
      </section>

      {/* Date selector + summary */}
      <section className="py-8 hairline-bottom">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-2">
              DATE
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="serif text-2xl text-[var(--color-ink)] bg-transparent border-b border-[var(--color-line)] pb-1 focus:outline-none focus:border-[var(--color-ink)] transition"
            />
          </div>
          <div className="flex items-center gap-6 text-xs">
            <div>
              <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-1">
                COMPLETED
              </div>
              <div className="serif text-xl text-[var(--color-ink)]">
                {completed} / {tasks.length}
              </div>
            </div>
            <div className="w-px h-10 bg-[var(--color-line)]" />
            <div>
              <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-1">
                RATE
              </div>
              <div className="serif text-xl text-[var(--color-ink)]">
                {pct}
                <span className="text-[var(--color-fg-faint)] text-xs ml-1">%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add form */}
      <section className="py-8 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          新たに記す
        </div>
        <form onSubmit={handleAdd} className="grid grid-cols-12 gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="行うこと…"
            className="col-span-12 md:col-span-6 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <select
            value={fieldId}
            onChange={(e) =>
              setFieldId(
                e.target.value === ""
                  ? ""
                  : (Number(e.target.value) as FieldId),
              )
            }
            className="col-span-6 md:col-span-2 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] bg-white focus:outline-none focus:border-[var(--color-ink)] transition"
          >
            <option value="">— 分野 —</option>
            {FIELDS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.number} {f.nameJaShort}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="col-span-3 md:col-span-1 border border-[var(--color-line)] px-2 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="col-span-3 md:col-span-1 border border-[var(--color-line)] px-2 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <button
            type="submit"
            disabled={!title.trim()}
            className="col-span-12 md:col-span-2 border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 text-xs tracking-[0.3em] hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ＋ ADD
          </button>
        </form>
      </section>

      {/* Tasks */}
      <section className="py-8">
        {tasks.length === 0 ? (
          <div className="py-20 text-center text-sm text-[var(--color-fg-faint)]">
            この日の行はまだありません。
          </div>
        ) : (
          <>
          <div className="hairline-top">
            {tasks.map((task) => {
              const field = FIELDS.find((f) => f.id === task.fieldId);
              const linkedGoal = task.fieldId != null
                ? state.fields[task.fieldId]?.shortTerm?.trim()
                : "";
              return (
                <div
                  key={task.id}
                  className="py-4 hairline-bottom group"
                >
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => toggleDailyTask(task.id)}
                      className={`check-box ${task.completed ? "checked" : ""}`}
                      aria-label="toggle"
                    >
                      {task.completed && <span className="text-[10px]">✓</span>}
                    </button>
                    <span
                      className={`text-sm flex-1 ${
                        task.completed
                          ? "line-through text-[var(--color-fg-faint)]"
                          : "text-[var(--color-ink)]"
                      }`}
                    >
                      {task.title}
                    </span>
                    {field && (
                      <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-mute)]">
                        {field.number} {field.nameJaShort}
                      </span>
                    )}
                    {task.startTime && (
                      <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)] w-24 text-right">
                        {task.startTime}
                        {task.endTime ? ` — ${task.endTime}` : " —"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeDailyTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition text-xs"
                      aria-label="remove"
                    >
                      ×
                    </button>
                  </div>
                  {linkedGoal && (
                    <div className="ml-9 mt-1.5 flex items-start gap-2 text-[11px] text-[var(--color-fg-faint)] leading-relaxed">
                      <span className="text-[var(--color-gold)] flex-shrink-0">↳</span>
                      <span className="line-clamp-2">{linkedGoal}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] text-center">
            <span className="text-[var(--color-gold)]">↳</span> &nbsp; この一手がつながる目標
          </div>
          </>
        )}
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
