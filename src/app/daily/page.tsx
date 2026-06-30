"use client";

import Link from "next/link";
import { useState } from "react";
import { FIELDS } from "@/lib/constants";
import { todayString, useAppState } from "@/lib/storage";
import { useTools, type RecurringTask } from "@/lib/tools/useTools";
import { describeSchedule } from "@/lib/recurring";
import type { FieldId } from "@/lib/types";

export default function DailyPage() {
  const {
    state,
    loaded,
    addDailyTask,
    toggleDailyTask,
    removeDailyTask,
  } = useAppState();

  const { recurringTasks, addRecurringTask, removeRecurringTask } = useTools();

  const [date, setDate] = useState<string>(todayString());
  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState<FieldId | "">("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // ※ 繰り返し／定期タスクの本日への自動投入は、アプリ全体で動く
  //    RecurringInjector（layout.tsx 直下）に集約済み。

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

      {/* 繰り返しタスク（曜日）。日にち指定・特定日は目標設定ページのタスク作成から */}
      <RecurringTasksSection
        recurringTasks={recurringTasks}
        onAdd={(t, days) => addRecurringTask({ title: t, days })}
        onRemove={removeRecurringTask}
      />

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

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function describeDays(days: number[]): string {
  const s = [...days].sort();
  if (s.length === 7) return "毎日";
  if (s.join() === "1,2,3,4,5") return "平日";
  if (s.join() === "0,6") return "週末";
  if (s.join() === "1,2,3,4,5,6") return "日曜以外";
  return s.map((d) => DOW_LABELS[d]).join("・") + "曜";
}

function RecurringTasksSection({
  recurringTasks,
  onAdd,
  onRemove,
}: {
  recurringTasks: RecurringTask[];
  onAdd: (title: string, days: number[], fieldId?: number) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }
  function add() {
    if (!title.trim() || days.length === 0) return;
    onAdd(title, days);
    setTitle("");
  }

  const presets: { label: string; days: number[] }[] = [
    { label: "毎日", days: [0, 1, 2, 3, 4, 5, 6] },
    { label: "平日", days: [1, 2, 3, 4, 5] },
    { label: "日曜以外", days: [1, 2, 3, 4, 5, 6] },
    { label: "週末", days: [0, 6] },
  ];

  return (
    <section className="py-8 hairline-bottom">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between group"
        aria-expanded={open}
      >
        <span className="flex items-baseline gap-3">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            ↻ 繰り返し
          </span>
          <span className="serif text-base text-[var(--color-ink)]">
            毎日・曜日ごとのタスク
          </span>
          {recurringTasks.length > 0 && (
            <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)]">
              {recurringTasks.length}件
            </span>
          )}
        </span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-mute)] group-hover:text-[var(--color-ink)]">
          {open ? "閉じる −" : "設定する ＋"}
        </span>
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <p className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed">
            登録すると、その曜日になるたび「本日の行」に自動で入ります（例：平日だけ／毎週水曜だけ）。
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="繰り返すタスク（例：スロージョギング20分）"
            className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />

          {/* presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] mr-1">
              おまかせ：
            </span>
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDays(p.days)}
                className="text-[11px] border border-[var(--color-line)] text-[var(--color-fg-mute)] px-2.5 py-1 hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* weekday chips */}
          <div className="flex flex-wrap gap-2">
            {DOW_LABELS.map((label, d) => {
              const on = days.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`w-9 h-9 text-sm border transition ${
                    on
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                      : "border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-ink)]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={add}
            disabled={!title.trim() || days.length === 0}
            className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30"
          >
            ＋ 繰り返しに追加（{describeDays(days)}）
          </button>

          {/* list */}
          {recurringTasks.length > 0 && (
            <div className="hairline-top pt-3">
              {recurringTasks.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 py-2.5 hairline-bottom group"
                >
                  <span className="text-[9px] tracking-[0.15em] text-[var(--color-gold)] border border-[var(--color-gold)]/40 px-1.5 py-0.5 whitespace-nowrap">
                    {describeSchedule(r)}
                  </span>
                  <span className="text-sm flex-1 text-[var(--color-ink)]">
                    {r.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(r.id)}
                    className="text-[10px] text-[var(--color-fg-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-ink)] transition"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
