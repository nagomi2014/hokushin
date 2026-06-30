"use client";

import { FIELDS } from "@/lib/constants";
import type { RecurringTask } from "@/lib/tools/useTools";

// 「今週のタスク」「今月のタスク」：期間内にやればよいタスク（floating）を、
// 期間ごとのチェックで消化する。期間が変わると key が変わり、自動でリセットされる。

export default function PeriodTasks({
  title,
  dateLabel,
  tasks,
  periodKey,
  taskChecks,
  onToggle,
}: {
  title: string;
  dateLabel: string;
  tasks: RecurringTask[];
  periodKey: string;
  taskChecks: Record<string, boolean>;
  onToggle: (taskId: string, periodKey: string) => void;
}) {
  if (tasks.length === 0) return null;
  const done = tasks.filter((t) => taskChecks[`${t.id}:${periodKey}`]).length;

  return (
    <section className="py-6 hairline-bottom">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] tracking-[0.3em] text-[var(--color-gold)]">
            {title}
          </span>
          <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)]">
            {dateLabel}
          </span>
        </div>
        <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
          {done} / {tasks.length} 完了
        </span>
      </div>

      <div className="hairline-top">
        {tasks.map((t) => {
          const checked = !!taskChecks[`${t.id}:${periodKey}`];
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 py-2.5 hairline-bottom"
            >
              <button
                type="button"
                onClick={() => onToggle(t.id, periodKey)}
                className={`check-box ${checked ? "checked" : ""} shrink-0`}
                aria-label="完了を切り替える"
              >
                {checked && <span className="text-[10px]">✓</span>}
              </button>
              <span
                className={`flex-1 text-sm leading-snug ${
                  checked
                    ? "line-through text-[var(--color-fg-faint)]"
                    : "text-[var(--color-ink)]"
                }`}
              >
                {t.title}
              </span>
              {t.fieldId != null && (
                <span className="text-[9px] tracking-[0.15em] text-[var(--color-fg-mute)] shrink-0">
                  {FIELDS.find((f) => f.id === t.fieldId)?.nameJaShort}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
