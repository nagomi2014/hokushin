"use client";

import { useState } from "react";
import { FIELDS } from "@/lib/constants";
import type { RecurringTask } from "@/lib/tools/useTools";
import { describeSchedule } from "@/lib/recurring";

// 目標設定ページで「繰り返し／予定タスク」を作る。
// 曜日（毎日・平日・曜日選択）／毎月N日／特定の日付（1回）に対応。
// 作ったタスクは、その日になると自動で「本日のタスク」に入る。

const DOW = ["日", "月", "火", "水", "木", "金", "土"];
type Mode = "weekday" | "monthly" | "once";

export default function TaskScheduler({
  recurringTasks,
  onAdd,
  onRemove,
}: {
  recurringTasks: RecurringTask[];
  onAdd: (task: Omit<RecurringTask, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState<number | "">("");
  const [mode, setMode] = useState<Mode>("weekday");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [monthlyDay, setMonthlyDay] = useState<number>(1);
  const [onceDate, setOnceDate] = useState<string>("");

  const presets: { label: string; days: number[] }[] = [
    { label: "毎日", days: [0, 1, 2, 3, 4, 5, 6] },
    { label: "平日", days: [1, 2, 3, 4, 5] },
    { label: "日曜以外", days: [1, 2, 3, 4, 5, 6] },
    { label: "週末", days: [0, 6] },
  ];

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  const canAdd =
    title.trim() !== "" &&
    ((mode === "weekday" && days.length > 0) ||
      (mode === "monthly" && monthlyDay >= 1 && monthlyDay <= 31) ||
      (mode === "once" && !!onceDate));

  function add() {
    if (!canAdd) return;
    const base = {
      title: title.trim(),
      ...(fieldId !== "" ? { fieldId: Number(fieldId) } : {}),
    };
    if (mode === "weekday") onAdd({ ...base, days });
    else if (mode === "monthly") onAdd({ ...base, monthlyDay });
    else if (mode === "once") onAdd({ ...base, onceDate });
    setTitle("");
  }

  return (
    <section className="py-10 hairline-bottom scroll-mt-24" id="task-scheduler">
      <div className="flex items-baseline justify-between mb-5">
        <div className="flex items-baseline gap-4">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            ↻ TASKS
          </span>
          <h2 className="serif text-2xl text-[var(--color-ink)]">
            タスクを作る
          </h2>
        </div>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          → 本日のタスクに自動で入る
        </span>
      </div>

      <p className="text-[11px] text-[var(--color-fg-faint)] mb-5 leading-relaxed">
        曜日・毎月の日にち・特定の日付で繰り返しを設定すると、その日になるたび「本日のタスク」に自動で入ります。
      </p>

      {/* タイトル＋分野 */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タスク（例：スロージョギング20分）"
          className="flex-1 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
        />
        <select
          value={fieldId}
          onChange={(e) =>
            setFieldId(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="border border-[var(--color-line)] px-2 py-2 text-xs text-[var(--color-fg-mute)] bg-white focus:outline-none focus:border-[var(--color-ink)] transition"
          title="分野（任意）"
        >
          <option value="">分野（任意）</option>
          {FIELDS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.number} {f.nameJaShort}
            </option>
          ))}
        </select>
      </div>

      {/* 繰り返しの種類 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ["weekday", "曜日で"],
            ["monthly", "毎月N日"],
            ["once", "特定の日付"],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`text-[11px] tracking-[0.15em] px-3 py-1.5 border transition ${
              mode === m
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 種類ごとの設定 */}
      {mode === "weekday" && (
        <div className="space-y-3 mb-4">
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
          <div className="flex flex-wrap gap-2">
            {DOW.map((label, d) => {
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
        </div>
      )}

      {mode === "monthly" && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-[var(--color-fg-mute)]">毎月</span>
          <input
            type="number"
            min={1}
            max={31}
            value={monthlyDay}
            onChange={(e) =>
              setMonthlyDay(
                Math.max(1, Math.min(31, Number(e.target.value) || 1)),
              )
            }
            className="w-16 border border-[var(--color-line)] px-2 py-1.5 text-center text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
          />
          <span className="text-[var(--color-fg-mute)]">日</span>
        </div>
      )}

      {mode === "once" && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <input
            type="date"
            value={onceDate}
            onChange={(e) => setOnceDate(e.target.value)}
            className="border border-[var(--color-line)] px-3 py-1.5 text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)]"
          />
          <span className="text-[11px] text-[var(--color-fg-faint)]">に1回だけ</span>
        </div>
      )}

      <button
        type="button"
        onClick={add}
        disabled={!canAdd}
        className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ＋ タスクを追加
      </button>

      {/* 登録済み一覧 */}
      {recurringTasks.length > 0 && (
        <div className="hairline-top mt-8 pt-4">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
            登録済み（{recurringTasks.length}）
          </div>
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
              {r.fieldId != null && (
                <span className="text-[10px] tracking-[0.15em] text-[var(--color-fg-mute)]">
                  {FIELDS.find((f) => f.id === r.fieldId)?.nameJaShort}
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(r.id)}
                className="opacity-0 group-hover:opacity-100 text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition text-xs"
                aria-label="削除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
