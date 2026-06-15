// ============================================================
// Hokushin - Data Types
// ============================================================

export type PyramidLevel = 1 | 2 | 3 | 4 | 5;

export interface PyramidEntry {
  level: PyramidLevel;
  content: string;
  updatedAt: string;
}

export type Pyramid = Record<PyramidLevel, PyramidEntry>;

// ------------------------------------------------------------
// 7 Fields
// ------------------------------------------------------------

export type FieldId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface FieldGoal {
  fieldId: FieldId;
  shortTerm: string; // 短期 (1年以内)
  midTerm: string;   // 中期 (1〜5年)
  longTerm: string;  // 長期 (5年以上)
  progress: number;  // 0–100
  updatedAt: string;
}

export type Fields = Record<FieldId, FieldGoal>;

// ------------------------------------------------------------
// Daily Task
// ------------------------------------------------------------

export interface DailyTask {
  id: string;
  date: string;        // YYYY-MM-DD
  title: string;
  fieldId: FieldId | null;
  completed: boolean;
  startTime?: string;  // HH:mm
  endTime?: string;    // HH:mm
  createdAt: string;
}

// ------------------------------------------------------------
// Monthly Plan
// ------------------------------------------------------------

export interface MonthlyPlan {
  year: number;
  month: number;             // 1–12
  primaryGoal: string;       // 最重要目標
  actionTheme: string;       // 行動テーマ
  successPoints: string[];   // 達成のポイント
  themeMusic: string;        // テーマ曲
  habits: Habit[];
  habitChecks: HabitCheck[]; // 日付ごとの達成記録
  reflection: string;        // 月間振り返り
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
}

export interface HabitCheck {
  habitId: string;
  date: string;       // YYYY-MM-DD
  done: boolean;
}

// ------------------------------------------------------------
// Mandala chart (自分を知るための簡易マンダラ：中央＋周囲8セル)
// ------------------------------------------------------------

export interface MandalaChart {
  center: string;       // 中央テーマ：「自分が人生で大切にしたいこと」
  cells: string[];      // 周囲8セル（length=8）
  updatedAt: string;
}

// ------------------------------------------------------------
// Wishlist (人生でやりたいこと100のリスト)
// ------------------------------------------------------------

export interface WishlistItem {
  id: string;
  index: number;    // 表示順（任意）
  text: string;
  done: boolean;
  createdAt: string;
}

// ------------------------------------------------------------
// Daily Report (日報)
// ------------------------------------------------------------

export type DailyReportSource = "app" | "import";

export interface DailyReport {
  id: string;
  date: string; // YYYY-MM-DD（ユーザー内で日付ユニーク）
  doneText: string;     // できたこと
  noteText: string;     // メモ・気づき
  tomorrowText: string; // 明日へ
  source: DailyReportSource;
  updatedAt: string;
}

// ------------------------------------------------------------
// User plan (Free / Premium)
// ------------------------------------------------------------

export type UserPlan = "free" | "premium";

// ------------------------------------------------------------
// Application state (root)
// ------------------------------------------------------------

export interface AppState {
  pyramid: Pyramid;
  fields: Fields;
  dailyTasks: DailyTask[];
  monthlyPlans: MonthlyPlan[];
  mandala: MandalaChart;
  wishlist: WishlistItem[];
  dailyReports: DailyReport[];
  userPlan: UserPlan;
  schemaVersion: number;
}
