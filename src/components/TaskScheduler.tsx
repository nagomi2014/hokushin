"use client";

import { useState } from "react";
import { FIELDS } from "@/lib/constants";
import type { Cadence, RecurringTask } from "@/lib/tools/useTools";
import { describeSchedule } from "@/lib/recurring";

// 目標設定ページで「タスク」を作る。日次／週次／月次／単発で分ける。
// 週次・月次は「曜日/日にちを決める（固定）」と「期間内にやる（いつでも）」の両対応。
// 作ったタスクは、日次/固定/単発は当日「本日のタスク」へ、週次/月次の期間内タスクは
// ダッシュボードの「今週／今月のタスク」に並ぶ。

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

const CADENCE_LABEL: Record<Cadence, string> = {
  daily: "日次",
  weekly: "週次",
  monthly: "月次",
  once: "単発",
};

export default function TaskScheduler({
  recurringTasks,
  onAdd,
  onRemove,
}: {
  recurringTasks: RecurringTask[];
  onAdd: (
    task: Omit<RecurringTask, "id" | "cadence"> & { cadence?: Cadence },
  ) => void;
  onRemove: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState<number | "">("");
  const [mode, setMode] = useState<Cadence>("daily");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [weeklyFixed, setWeeklyFixed] = useState(true);
  const [monthlyFixed, setMonthlyFixed] = useState(true);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [onceDate, setOnceDate] = useState("");

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  const canAdd =
    title.trim() !== "" &&
    (mode === "daily" ||
      (mode === "weekly" && (!weeklyFixed || days.length > 0)) ||
      (mode === "monthly" && (!monthlyFixed || (monthlyDay >= 1 && monthlyDay <= 31))) ||
      (mode === "once" && !!onceDate));

  function add() {
    if (!canAdd) return;
    const base = {
      title: title.trim(),
      ...(fieldId !== "" ? { fieldId: Number(fieldId) } : {}),
    };
    if (mode === "daily") onAdd({ ...base, cadence: "daily" });
    else if (mode === "weekly")
      onAdd({ ...base, cadence: "weekly", ...(weeklyFixed ? { days } : {}) });
    else if (mode === "monthly")
      onAdd({
        ...base,
        cadence: "monthly",
        ...(monthlyFixed ? { monthlyDay } : {}),
      });
    else if (mode === "once") onAdd({ ...base, cadence: "once", onceDate });
    setTitle("");
  }

  const grouped: Record<Cadence, RecurringTask[]> = {
    daily: [],
    weekly: [],
    monthly: [],
    once: [],
  };
  for (const t of recurringTasks) grouped[t.cadence].push(t);

  return (
    <section className="py-10 hairline-bottom scroll-mt-24" id="task-scheduler">
      <div className="flex items-baseline justify-between mb-5">
        <div className="flex items-baseline gap-4">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            ↻ TASKS
          </span>
          <h2 className="serif text-2xl text-[var(--color-ink)]">タスクを作る</h2>
        </div>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          日次 / 週次 / 月次
        </span>
      </div>

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

      {/* 区分（日次/週次/月次/単発） */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["daily", "weekly", "monthly", "once"] as Cadence[]).map((m) => (
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
            {CADENCE_LABEL[m]}
          </button>
        ))}
      </div>

      {/* 区分ごとの設定 */}
      {mode === "daily" && (
        <p className="text-[11px] text-[var(--color-fg-faint)] mb-4">
          毎日「本日のタスク」に入ります。
        </p>
      )}

      {mode === "weekly" && (
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <SubToggle
              on={weeklyFixed}
              onClick={() => setWeeklyFixed(true)}
              label="曜日を決める"
            />
            <SubToggle
              on={!weeklyFixed}
              onClick={() => setWeeklyFixed(false)}
              label="今週やる（いつでも）"
            />
          </div>
          {weeklyFixed && (
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
          )}
          {!weeklyFixed && (
            <p className="text-[11px] text-[var(--color-fg-faint)]">
              「今週のタスク」に並びます。日曜まで、週明けにリセットされます。
            </p>
          )}
        </div>
      )}

      {mode === "monthly" && (
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <SubToggle
              on={monthlyFixed}
              onClick={() => setMonthlyFixed(true)}
              label="毎月N日"
            />
            <SubToggle
              on={!monthlyFixed}
              onClick={() => setMonthlyFixed(false)}
              label="今月やる（いつでも）"
            />
          </div>
          {monthlyFixed ? (
            <div className="flex items-center gap-2 text-sm">
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
          ) : (
            <p className="text-[11px] text-[var(--color-fg-faint)]">
              「今月のタスク」に並びます。月末まで、月初にリセットされます。
            </p>
          )}
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
          <span className="text-[11px] text-[var(--color-fg-faint)]">
            に1回だけ「本日のタスク」へ
          </span>
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

      {/* 登録済み一覧（区分ごと） */}
      {recurringTasks.length > 0 && (
        <div className="mt-8 space-y-5">
          {(["daily", "weekly", "monthly", "once"] as Cadence[])
            .filter((c) => grouped[c].length > 0)
            .map((c) => (
              <div key={c}>
                <div className="text-[10px] tracking-[0.3em] text-[var(--color-gold)] mb-1 hairline-bottom pb-1">
                  {CADENCE_LABEL[c]}（{grouped[c].length}）
                </div>
                {grouped[c].map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 py-2 hairline-bottom group"
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
            ))}
        </div>
      )}
    </section>
  );
}

function SubToggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] tracking-[0.1em] px-3 py-1.5 border transition ${
        on
          ? "border-[var(--color-gold)] text-[var(--color-gold)]"
          : "border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
      }`}
    >
      {label}
    </button>
  );
}
