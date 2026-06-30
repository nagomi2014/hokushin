"use client";

// 繰り返し／予定タスクと、第II領域の定期一手を、今日の「本日のタスク」へ自動投入する。
// どのページを開いていても動くよう、レイアウト直下にマウントする（描画はしない）。

import { useEffect } from "react";
import { todayString, useAppState } from "@/lib/storage";
import { useTools } from "@/lib/tools/useTools";
import { isoWeekKey, taskAppliesOn } from "@/lib/recurring";
import type { FieldId } from "@/lib/types";

export default function RecurringInjector() {
  const { state, loaded, addDailyTask } = useAppState();
  const { loaded: toolsLoaded, primeItems, recurringTasks } = useTools();

  useEffect(() => {
    if (!loaded || !toolsLoaded) return;
    const today = todayString();
    const todayWeek = isoWeekKey(today);
    const now = new Date(`${today}T00:00:00`);

    // 第II領域で「定期（毎日/毎週）」にした一手
    for (const p of primeItems) {
      if (!p.cadence || p.done) continue;
      const exists =
        p.cadence === "daily"
          ? state.dailyTasks.some((t) => t.date === today && t.title === p.text)
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

    // 繰り返し／予定タスク（曜日・毎月N日・特定日付）
    for (const r of recurringTasks) {
      if (!taskAppliesOn(r, now)) continue;
      const exists = state.dailyTasks.some(
        (t) => t.date === today && t.title === r.title,
      );
      if (!exists) {
        addDailyTask({
          date: today,
          title: r.title,
          fieldId: (r.fieldId as FieldId | undefined) ?? null,
          completed: false,
        });
      }
    }
  }, [loaded, toolsLoaded, primeItems, recurringTasks, state.dailyTasks, addDailyTask]);

  return null;
}
