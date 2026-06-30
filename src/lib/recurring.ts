// 繰り返し／予定タスクの「いつ出すか」判定と、説明テキストを一元化する。
import type { RecurringTask } from "@/lib/tools/useTools";

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function dateToStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ある日付が属する ISO 週のキー（毎週の重複判定用）
export function isoWeekKey(dateStr: string): string {
  const dt = new Date(`${dateStr}T00:00:00`);
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

// その日に、このタスクを「本日のタスク」へ出すべきか
export function taskAppliesOn(t: RecurringTask, date: Date): boolean {
  if (t.onceDate) return t.onceDate === dateToStr(date);
  if (t.monthlyDay != null) return date.getDate() === t.monthlyDay;
  if (t.days && t.days.length > 0) return t.days.includes(date.getDay());
  return false;
}

export function describeDays(days: number[]): string {
  const s = [...days].sort((a, b) => a - b);
  if (s.length === 7) return "毎日";
  if (s.join() === "1,2,3,4,5") return "平日";
  if (s.join() === "0,6") return "週末";
  if (s.join() === "1,2,3,4,5,6") return "日曜以外";
  return s.map((d) => DOW_LABELS[d]).join("・") + "曜";
}

// スケジュールを短い日本語で説明する
export function describeSchedule(t: RecurringTask): string {
  if (t.onceDate) {
    const dt = new Date(`${t.onceDate}T00:00:00`);
    return `${dt.getMonth() + 1}/${dt.getDate()}（${DOW_LABELS[dt.getDay()]}）に1回`;
  }
  if (t.monthlyDay != null) return `毎月${t.monthlyDay}日`;
  if (t.days && t.days.length > 0) return describeDays(t.days);
  return "—";
}
