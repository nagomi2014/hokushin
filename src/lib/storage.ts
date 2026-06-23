import type {
  AppState,
  DailyTask,
  FieldGoal,
  FieldId,
  Fields,
  MandalaChart,
  MonthlyPlan,
  Pyramid,
  PyramidLevel,
  UserPlan,
  WishlistItem,
} from "./types";
import { FIELDS, SCHEMA_VERSION, STORAGE_KEY } from "./constants";

// ============================================================
// State factories
// ============================================================

export function emptyState(): AppState {
  const now = new Date().toISOString();

  const pyramid = {} as Pyramid;
  for (const level of [1, 2, 3, 4, 5] as PyramidLevel[]) {
    pyramid[level] = { level, content: "", updatedAt: now };
  }

  const fields = {} as Fields;
  for (const f of FIELDS) {
    fields[f.id] = {
      fieldId: f.id,
      shortTerm: "",
      midTerm: "",
      longTerm: "",
      progress: 0,
      updatedAt: now,
    };
  }

  const mandala: MandalaChart = {
    center: "",
    cells: ["", "", "", "", "", "", "", ""],
    updatedAt: now,
  };

  return {
    pyramid,
    fields,
    dailyTasks: [],
    monthlyPlans: [],
    mandala,
    wishlist: [],
    dailyReports: [],
    userPlan: "free",
    schemaVersion: SCHEMA_VERSION,
  };
}

// ============================================================
// Persistence (localStorage)
// ============================================================

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.schemaVersion || parsed.schemaVersion !== SCHEMA_VERSION) {
      return emptyState();
    }
    // 後方互換：後から追加したフィールドの既定値を補う
    if (!parsed.dailyReports) parsed.dailyReports = [];
    return parsed;
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    // localStorage が使えない（プライベートモード・容量・無効化など）
    return false;
  }
}

// ============================================================
// Store API contract（localStorage / Supabase 共通の戻り値の形）
// 実装は @/lib/store/AppStateProvider
// ============================================================

export interface AppStateApi {
  state: AppState;
  loaded: boolean;
  update: (updater: (prev: AppState) => AppState) => void;
  // Convenience helpers
  setPyramid: (level: PyramidLevel, content: string) => void;
  setField: (fieldId: FieldId, patch: Partial<FieldGoal>) => void;
  addDailyTask: (task: Omit<DailyTask, "id" | "createdAt">) => void;
  toggleDailyTask: (id: string) => void;
  removeDailyTask: (id: string) => void;
  upsertMonthlyPlan: (plan: MonthlyPlan) => void;
  // Mandala
  setMandalaCenter: (text: string) => void;
  setMandalaCell: (index: number, text: string) => void;
  // Wishlist
  addWishlistItem: (text: string) => void;
  updateWishlistItem: (id: string, text: string) => void;
  toggleWishlistItem: (id: string) => void;
  removeWishlistItem: (id: string) => void;
  // Daily report (日報)
  saveDailyReport: (
    date: string,
    fields: { doneText: string; noteText: string; tomorrowText: string },
  ) => void;
  // Plan
  setUserPlan: (plan: UserPlan) => void;
  // 明示的に「ここまで保存」する（端末＋クラウド）。結果メッセージを返す。
  saveNow: () => Promise<{ ok: boolean; message: string }>;
}

// useAppState は Provider 実装を再エクスポート（既存ページの import を維持）
export { useAppStateContext as useAppState } from "./store/AppStateProvider";

// ============================================================
// Date helpers (used widely)
// ============================================================

export function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentYearMonth(): { year: number; month: number } {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// 月初（最初の5日）／月末（最後の4日）かを判定。目標設定・振り返りを促すため。
export function monthMoment(d: Date = new Date()): "start" | "end" | null {
  const day = d.getDate();
  const total = daysInMonth(d.getFullYear(), d.getMonth() + 1);
  if (day <= 5) return "start";
  if (day >= total - 3) return "end";
  return null;
}
