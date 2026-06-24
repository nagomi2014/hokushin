"use client";

// ============================================================
// Hokushin · 補助ツール（100年史 / 金の記録 / 第II領域）
// ------------------------------------------------------------
// この3ツールは端末ローカル保存（localStorage）。
// マイグレーション不要・オフライン可。クラウド同期は将来追加できる。
// 既存の AppState（Supabase同期）とは独立。
// ============================================================

import { useEffect, useState } from "react";

const KEY = "hokushin:tools:v1";

// 100年史：人生の出来事（過去の記録＋未来の願い）を年齢で並べる
export interface LifeEvent {
  id: string;
  age: number; // 何歳のときのことか
  text: string;
  kind: "past" | "future"; // 過去の出来事 / 未来の願い
}

// 金の記録：お金まわりの記録（収入・支出・資産・目標）
export interface MoneyEntry {
  id: string;
  label: string;
  amount: number | null; // 任意（金額がなくてもメモとして残せる）
  kind: "income" | "expense" | "asset" | "goal";
  note: string;
  date: string; // YYYY-MM
}

// 第II領域：重要だが緊急でないこと（7つの習慣）
export interface PrimeItem {
  id: string;
  text: string;
  done: boolean;
  fieldId?: number; // どの分野の状態に近づくための一手か（任意）
  cadence?: "daily" | "weekly"; // 日々のタスクへ定期投入する頻度（任意）
}

// 目標の区切り（毎年末〆）。短期＝今年末、中期＝mid年後、長期＝long年後。
export interface HorizonSpan {
  mid: number;
  long: number;
}

// 今月の目標：選んだ分野ごとに、その月の目標を複数書ける。
export interface MonthGoal {
  id: string;
  ym: string; // "2026-06"
  fieldId: number;
  text: string;
}

// 繰り返しタスク：指定した曜日に、本日のタスクへ自動で入る
export interface RecurringTask {
  id: string;
  title: string;
  fieldId?: number;
  days: number[]; // 0=日, 1=月, … 6=土
}

export interface ToolsData {
  lifeEvents: LifeEvent[];
  moneyEntries: MoneyEntry[];
  primeItems: PrimeItem[];
  // マンダラート派生：8観点 × 8項目（フル9×9の外周ブロック）
  mandalaSub: string[][];
  horizonSpan: HorizonSpan;
  // 取り組む分野（七つの分野のうち、自分が選んだものだけ）。空＝未選択。
  selectedFields: number[];
  // 月の分野別目標
  monthGoals: MonthGoal[];
  // 月ごとの最重要目標（ym -> monthGoalのid）
  primaryMonthGoal: Record<string, string>;
  // 繰り返しタスク
  recurringTasks: RecurringTask[];
}

function emptyMandalaSub(): string[][] {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ""));
}

function emptyTools(): ToolsData {
  return {
    lifeEvents: [],
    moneyEntries: [],
    primeItems: [],
    mandalaSub: emptyMandalaSub(),
    horizonSpan: { mid: 3, long: 10 },
    selectedFields: [],
    monthGoals: [],
    primaryMonthGoal: {},
    recurringTasks: [],
  };
}

function loadTools(): ToolsData {
  if (typeof window === "undefined") return emptyTools();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyTools();
    const parsed = JSON.parse(raw) as Partial<ToolsData>;
    const sub = Array.isArray(parsed.mandalaSub) ? parsed.mandalaSub : [];
    const mandalaSub = emptyMandalaSub().map((row, i) =>
      row.map((_, j) => String(sub[i]?.[j] ?? "")),
    );
    const hs = parsed.horizonSpan;
    const horizonSpan: HorizonSpan = {
      mid: typeof hs?.mid === "number" ? hs.mid : 3,
      long: typeof hs?.long === "number" ? hs.long : 10,
    };
    const selectedFields = Array.isArray(parsed.selectedFields)
      ? parsed.selectedFields.filter((n) => typeof n === "number")
      : [];
    const monthGoals = Array.isArray(parsed.monthGoals)
      ? parsed.monthGoals.filter(
          (g): g is MonthGoal =>
            !!g && typeof g.id === "string" && typeof g.ym === "string",
        )
      : [];
    const primaryMonthGoal =
      parsed.primaryMonthGoal && typeof parsed.primaryMonthGoal === "object"
        ? (parsed.primaryMonthGoal as Record<string, string>)
        : {};
    const recurringTasks = Array.isArray(parsed.recurringTasks)
      ? parsed.recurringTasks.filter(
          (t): t is RecurringTask =>
            !!t && typeof t.id === "string" && Array.isArray(t.days),
        )
      : [];
    return {
      lifeEvents: parsed.lifeEvents ?? [],
      moneyEntries: parsed.moneyEntries ?? [],
      primeItems: parsed.primeItems ?? [],
      mandalaSub,
      horizonSpan,
      selectedFields,
      monthGoals,
      primaryMonthGoal,
      recurringTasks,
    };
  } catch {
    return emptyTools();
  }
}

function saveTools(data: ToolsData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(data));
}

function uid(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface UseToolsResult extends ToolsData {
  loaded: boolean;
  // 100年史
  addLifeEvent: (age: number, text: string, kind: LifeEvent["kind"]) => void;
  updateLifeEvent: (id: string, patch: Partial<LifeEvent>) => void;
  removeLifeEvent: (id: string) => void;
  // 金の記録
  addMoneyEntry: (entry: Omit<MoneyEntry, "id">) => void;
  removeMoneyEntry: (id: string) => void;
  // 第II領域
  addPrimeItem: (text: string, fieldId?: number) => void;
  togglePrimeItem: (id: string) => void;
  removePrimeItem: (id: string) => void;
  setPrimeCadence: (id: string, cadence: "none" | "daily" | "weekly") => void;
  // マンダラート派生
  setMandalaSub: (aspect: number, sub: number, text: string) => void;
  addMandalaSub: (aspect: number, text: string) => void; // 空いている枠へ
  // 目標の区切り
  setHorizonSpan: (patch: Partial<HorizonSpan>) => void;
  // 取り組む分野の選択
  setSelectedFields: (ids: number[]) => void;
  toggleSelectedField: (id: number) => void;
  // 月の分野別目標
  addMonthGoal: (ym: string, fieldId: number) => void;
  setMonthGoalText: (id: string, text: string) => void;
  removeMonthGoal: (id: string) => void;
  setPrimaryMonthGoal: (ym: string, goalId: string) => void;
  // 繰り返しタスク
  addRecurringTask: (title: string, days: number[], fieldId?: number) => void;
  removeRecurringTask: (id: string) => void;
}

export function useTools(): UseToolsResult {
  const [data, setData] = useState<ToolsData>(emptyTools());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(loadTools());
    setLoaded(true);
  }, []);

  function mutate(fn: (prev: ToolsData) => ToolsData) {
    setData((prev) => {
      const next = fn(prev);
      saveTools(next);
      return next;
    });
  }

  return {
    ...data,
    loaded,

    addLifeEvent: (age, text, kind) => {
      const t = text.trim();
      if (!t) return;
      mutate((prev) => ({
        ...prev,
        lifeEvents: [
          ...prev.lifeEvents,
          { id: uid("le"), age, text: t, kind },
        ],
      }));
    },
    updateLifeEvent: (id, patch) =>
      mutate((prev) => ({
        ...prev,
        lifeEvents: prev.lifeEvents.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      })),
    removeLifeEvent: (id) =>
      mutate((prev) => ({
        ...prev,
        lifeEvents: prev.lifeEvents.filter((e) => e.id !== id),
      })),

    addMoneyEntry: (entry) =>
      mutate((prev) => ({
        ...prev,
        moneyEntries: [...prev.moneyEntries, { ...entry, id: uid("me") }],
      })),
    removeMoneyEntry: (id) =>
      mutate((prev) => ({
        ...prev,
        moneyEntries: prev.moneyEntries.filter((e) => e.id !== id),
      })),

    addPrimeItem: (text, fieldId) => {
      const t = text.trim();
      if (!t) return;
      mutate((prev) => ({
        ...prev,
        primeItems: [
          ...prev.primeItems,
          { id: uid("pi"), text: t, done: false, ...(fieldId ? { fieldId } : {}) },
        ],
      }));
    },
    togglePrimeItem: (id) =>
      mutate((prev) => ({
        ...prev,
        primeItems: prev.primeItems.map((p) =>
          p.id === id ? { ...p, done: !p.done } : p,
        ),
      })),
    setPrimeCadence: (id, cadence) =>
      mutate((prev) => ({
        ...prev,
        primeItems: prev.primeItems.map((p) =>
          p.id === id
            ? { ...p, cadence: cadence === "none" ? undefined : cadence }
            : p,
        ),
      })),
    removePrimeItem: (id) =>
      mutate((prev) => ({
        ...prev,
        primeItems: prev.primeItems.filter((p) => p.id !== id),
      })),

    setMandalaSub: (aspect, sub, text) =>
      mutate((prev) => {
        if (aspect < 0 || aspect > 7 || sub < 0 || sub > 7) return prev;
        const grid = prev.mandalaSub.map((r) => [...r]);
        grid[aspect][sub] = text;
        return { ...prev, mandalaSub: grid };
      }),
    addMandalaSub: (aspect, text) => {
      const t = text.trim();
      if (!t) return;
      mutate((prev) => {
        if (aspect < 0 || aspect > 7) return prev;
        const grid = prev.mandalaSub.map((r) => [...r]);
        const slot = grid[aspect].findIndex((c) => !c.trim());
        if (slot === -1) return prev; // 8枠が埋まっている
        grid[aspect][slot] = t;
        return { ...prev, mandalaSub: grid };
      });
    },

    setHorizonSpan: (patch) =>
      mutate((prev) => {
        const mid = Math.max(1, Math.min(9, patch.mid ?? prev.horizonSpan.mid));
        const long = Math.max(
          mid + 1,
          Math.min(50, patch.long ?? prev.horizonSpan.long),
        );
        return { ...prev, horizonSpan: { mid, long } };
      }),

    setSelectedFields: (ids) =>
      mutate((prev) => ({
        ...prev,
        selectedFields: [...new Set(ids.filter((n) => n >= 1 && n <= 7))].sort(
          (a, b) => a - b,
        ),
      })),
    toggleSelectedField: (id) =>
      mutate((prev) => {
        if (id < 1 || id > 7) return prev;
        const has = prev.selectedFields.includes(id);
        const next = has
          ? prev.selectedFields.filter((n) => n !== id)
          : [...prev.selectedFields, id];
        return { ...prev, selectedFields: next.sort((a, b) => a - b) };
      }),

    addMonthGoal: (ym, fieldId) =>
      mutate((prev) => ({
        ...prev,
        monthGoals: [
          ...prev.monthGoals,
          { id: uid("mg"), ym, fieldId, text: "" },
        ],
      })),
    setMonthGoalText: (id, text) =>
      mutate((prev) => ({
        ...prev,
        monthGoals: prev.monthGoals.map((g) =>
          g.id === id ? { ...g, text } : g,
        ),
      })),
    removeMonthGoal: (id) =>
      mutate((prev) => {
        const primaryMonthGoal = { ...prev.primaryMonthGoal };
        for (const k of Object.keys(primaryMonthGoal)) {
          if (primaryMonthGoal[k] === id) delete primaryMonthGoal[k];
        }
        return {
          ...prev,
          monthGoals: prev.monthGoals.filter((g) => g.id !== id),
          primaryMonthGoal,
        };
      }),
    setPrimaryMonthGoal: (ym, goalId) =>
      mutate((prev) => {
        const primaryMonthGoal = { ...prev.primaryMonthGoal };
        if (primaryMonthGoal[ym] === goalId) delete primaryMonthGoal[ym];
        else primaryMonthGoal[ym] = goalId;
        return { ...prev, primaryMonthGoal };
      }),

    addRecurringTask: (title, days, fieldId) => {
      const t = title.trim();
      if (!t || days.length === 0) return;
      mutate((prev) => ({
        ...prev,
        recurringTasks: [
          ...prev.recurringTasks,
          { id: uid("rt"), title: t, days: [...days].sort(), ...(fieldId ? { fieldId } : {}) },
        ],
      }));
    },
    removeRecurringTask: (id) =>
      mutate((prev) => ({
        ...prev,
        recurringTasks: prev.recurringTasks.filter((r) => r.id !== id),
      })),
  };
}
