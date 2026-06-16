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
}

export interface ToolsData {
  lifeEvents: LifeEvent[];
  moneyEntries: MoneyEntry[];
  primeItems: PrimeItem[];
  // マンダラート派生：8観点 × 8項目（フル9×9の外周ブロック）
  mandalaSub: string[][];
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
    return {
      lifeEvents: parsed.lifeEvents ?? [],
      moneyEntries: parsed.moneyEntries ?? [],
      primeItems: parsed.primeItems ?? [],
      mandalaSub,
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
  addPrimeItem: (text: string) => void;
  togglePrimeItem: (id: string) => void;
  removePrimeItem: (id: string) => void;
  // マンダラート派生
  setMandalaSub: (aspect: number, sub: number, text: string) => void;
  addMandalaSub: (aspect: number, text: string) => void; // 空いている枠へ
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

    addPrimeItem: (text) => {
      const t = text.trim();
      if (!t) return;
      mutate((prev) => ({
        ...prev,
        primeItems: [...prev.primeItems, { id: uid("pi"), text: t, done: false }],
      }));
    },
    togglePrimeItem: (id) =>
      mutate((prev) => ({
        ...prev,
        primeItems: prev.primeItems.map((p) =>
          p.id === id ? { ...p, done: !p.done } : p,
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
  };
}
