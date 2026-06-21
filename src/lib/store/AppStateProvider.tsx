"use client";

// ============================================================
// Hokushin · AppStateProvider
// ============================================================
// 永続化層を 1 か所に集約する。
//   - 未ログイン or Supabase未設定 → localStorage（従来どおり・オフライン可）
//   - ログイン中 → Supabase（PC/スマホ同期）。楽観更新＋非同期upsert。
// ページ側は従来どおり useAppState() を呼ぶだけ（戻り値の形は不変）。
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  emptyState,
  loadState,
  saveState,
  type AppStateApi,
} from "@/lib/storage";
import type {
  AppState,
  DailyReport,
  DailyTask,
  FieldGoal,
  FieldId,
  MandalaChart,
  MonthlyPlan,
  PyramidLevel,
  UserPlan,
  WishlistItem,
} from "@/lib/types";

type StoreMode = "local" | "cloud";

export interface StoreMeta {
  /** localStorage か Supabase か */
  mode: StoreMode;
  /** 認証状態の初期判定が終わったか */
  authReady: boolean;
  /** ログイン中ユーザーのメール（未ログインは null） */
  userEmail: string | null;
  /** Supabaseが設定されているか（ログインUIの表示判定） */
  supabaseEnabled: boolean;
  signOut: () => Promise<void>;
  /** このデバイスのlocalStorageデータをアカウントへ一括コピー */
  syncLocalToCloud: () => Promise<{ ok: boolean; message: string }>;
}

export type AppStateContextValue = AppStateApi & StoreMeta;

const AppStateContext = createContext<AppStateContextValue | null>(null);

// ------------------------------------------------------------
// Row <-> Model マッピング
// ------------------------------------------------------------

function trimTime(t: string | null | undefined): string | undefined {
  if (!t) return undefined;
  return t.slice(0, 5); // "HH:MM:SS" -> "HH:MM"
}

function rowToTask(r: Record<string, unknown>): DailyTask {
  return {
    id: String(r.id),
    date: String(r.date),
    title: String(r.title ?? ""),
    fieldId: (r.field_id as FieldId | null) ?? null,
    completed: Boolean(r.completed),
    startTime: trimTime(r.start_time as string | null),
    endTime: trimTime(r.end_time as string | null),
    createdAt: String(r.created_at ?? ""),
  };
}

function taskToRow(t: DailyTask, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    date: t.date,
    title: t.title,
    field_id: t.fieldId,
    completed: t.completed,
    start_time: t.startTime || null,
    end_time: t.endTime || null,
    created_at: t.createdAt,
  };
}

function rowToMonthly(r: Record<string, unknown>): MonthlyPlan {
  return {
    year: Number(r.year),
    month: Number(r.month),
    primaryGoal: String(r.primary_goal ?? ""),
    actionTheme: String(r.action_theme ?? ""),
    successPoints: (r.success_points as string[]) ?? [],
    themeMusic: String(r.theme_music ?? ""),
    habits: (r.habits as MonthlyPlan["habits"]) ?? [],
    habitChecks: (r.habit_checks as MonthlyPlan["habitChecks"]) ?? [],
    reflection: String(r.reflection ?? ""),
    updatedAt: String(r.updated_at ?? ""),
  };
}

function monthlyToRow(p: MonthlyPlan, userId: string) {
  return {
    user_id: userId,
    year: p.year,
    month: p.month,
    primary_goal: p.primaryGoal,
    action_theme: p.actionTheme,
    success_points: p.successPoints,
    theme_music: p.themeMusic,
    habits: p.habits,
    habit_checks: p.habitChecks,
    reflection: p.reflection,
    updated_at: p.updatedAt,
  };
}

function fieldToRow(f: FieldGoal, userId: string) {
  return {
    user_id: userId,
    field_id: f.fieldId,
    short_term: f.shortTerm,
    mid_term: f.midTerm,
    long_term: f.longTerm,
    progress: f.progress,
    updated_at: f.updatedAt,
  };
}

function rowToReport(r: Record<string, unknown>): DailyReport {
  return {
    id: String(r.id),
    date: String(r.date),
    doneText: String(r.done_text ?? ""),
    noteText: String(r.note_text ?? ""),
    tomorrowText: String(r.tomorrow_text ?? ""),
    source: (r.source as DailyReport["source"]) ?? "app",
    updatedAt: String(r.updated_at ?? ""),
  };
}

// 何か中身が入っているか（クラウド空判定・ローカル復元の判断に使う）
function hasContent(s: AppState): boolean {
  return (
    Object.values(s.pyramid).some((p) => p.content.trim() !== "") ||
    Object.values(s.fields).some(
      (f) =>
        f.shortTerm.trim() !== "" ||
        f.midTerm.trim() !== "" ||
        f.longTerm.trim() !== "",
    ) ||
    s.dailyTasks.length > 0 ||
    s.monthlyPlans.some((m) => m.primaryGoal.trim() !== "") ||
    s.wishlist.length > 0 ||
    s.mandala.center.trim() !== "" ||
    s.mandala.cells.some((c) => c.trim() !== "") ||
    s.dailyReports.length > 0
  );
}

function normalizeCells(cells: unknown): string[] {
  const arr = Array.isArray(cells) ? cells.map((c) => String(c ?? "")) : [];
  while (arr.length < 8) arr.push("");
  return arr.slice(0, 8);
}

// ------------------------------------------------------------
// クラウド読み込み（全テーブル → AppState）
// ------------------------------------------------------------

async function loadCloud(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppState> {
  const base = emptyState();

  const [pyr, fld, tsk, mon, man, wsh, rep, prof] = await Promise.all([
    supabase.from("pyramid_entries").select("*").eq("user_id", userId),
    supabase.from("field_goals").select("*").eq("user_id", userId),
    supabase.from("daily_tasks").select("*").eq("user_id", userId),
    supabase.from("monthly_plans").select("*").eq("user_id", userId),
    supabase.from("mandala_charts").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("wishlist_items").select("*").eq("user_id", userId).order("idx"),
    supabase.from("daily_reports").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("profiles").select("plan").eq("id", userId).maybeSingle(),
  ]);

  for (const r of pyr.data ?? []) {
    const level = Number(r.level) as PyramidLevel;
    base.pyramid[level] = {
      level,
      content: String(r.content ?? ""),
      updatedAt: String(r.updated_at ?? ""),
    };
  }

  for (const r of fld.data ?? []) {
    const fieldId = Number(r.field_id) as FieldId;
    base.fields[fieldId] = {
      fieldId,
      shortTerm: String(r.short_term ?? ""),
      midTerm: String(r.mid_term ?? ""),
      longTerm: String(r.long_term ?? ""),
      progress: Number(r.progress ?? 0),
      updatedAt: String(r.updated_at ?? ""),
    };
  }

  base.dailyTasks = (tsk.data ?? []).map(rowToTask);
  base.monthlyPlans = (mon.data ?? []).map(rowToMonthly);

  if (man.data) {
    base.mandala = {
      center: String(man.data.center ?? ""),
      cells: normalizeCells(man.data.cells),
      updatedAt: String(man.data.updated_at ?? ""),
    };
  }

  base.wishlist = (wsh.data ?? []).map((r) => ({
    id: String(r.id),
    index: Number(r.idx ?? 0),
    text: String(r.text ?? ""),
    done: Boolean(r.done),
    createdAt: String(r.created_at ?? ""),
  }));

  base.dailyReports = (rep.data ?? []).map(rowToReport);

  base.userPlan = (prof.data?.plan as UserPlan) ?? "free";

  return base;
}

// ------------------------------------------------------------
// Provider
// ------------------------------------------------------------

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState());
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<StoreMode>("local");
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const supabaseEnabled = isSupabaseConfigured();

  // 安定参照（setState updater 内から最新値を読むため）
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const userIdRef = useRef<string | null>(null);
  const modeRef = useRef<StoreMode>("local");
  modeRef.current = mode;

  // -- 初期化：セッション判定 → ローカル or クラウド読み込み --
  useEffect(() => {
    let active = true;

    if (!supabaseEnabled) {
      setState(loadState());
      setMode("local");
      setLoaded(true);
      setAuthReady(true);
      return;
    }

    const supabase = createClient();
    supabaseRef.current = supabase;

    async function applySession(
      userId: string | null,
      email: string | null,
    ) {
      if (userId) {
        userIdRef.current = userId;
        setUserEmail(email);
        setMode("cloud");
        modeRef.current = "cloud";
        setLoaded(false);
        try {
          const cloud = await loadCloud(supabase, userId);
          if (!active) return;
          const local = loadState();
          // クラウドが空（書き込み失敗等）でローカルに中身があれば、ローカルを採用して
          // クラウドへ復旧プッシュする。これでデータ消失を防ぐ。
          if (!hasContent(cloud) && hasContent(local)) {
            setState(local);
            void pushFullState(supabase, userId, local);
          } else {
            setState(cloud);
          }
        } catch (e) {
          console.error("[hokushin] cloud load failed", e);
          if (!active) return;
          setState(loadState());
          setMode("local");
          modeRef.current = "local";
        }
        if (active) setLoaded(true);
      } else {
        userIdRef.current = null;
        setUserEmail(null);
        setMode("local");
        modeRef.current = "local";
        setState(loadState());
        setLoaded(true);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      applySession(data.user?.id ?? null, data.user?.email ?? null);
      setAuthReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      applySession(session?.user?.id ?? null, session?.user?.email ?? null);
      setAuthReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabaseEnabled]);

  // -- 永続化ヘルパ：常にローカルへ保存（クラウド失敗時の保険）＋クラウド時はcloudFnも --
  const persist = useCallback((next: AppState, cloudFn?: () => void) => {
    // ログイン中でも、まずローカルへ必ずバックアップする（書き込み失敗・通信断でも消えない）
    saveState(next);
    if (modeRef.current === "cloud") {
      try {
        cloudFn?.();
      } catch (e) {
        console.error("[hokushin] cloud write failed", e);
      }
    }
  }, []);

  const cloud = () => supabaseRef.current;
  const uid = () => userIdRef.current;

  // ---------------------------------------------------------
  // ミューテーション（ローカルAPIと同一シグネチャ）
  // ---------------------------------------------------------

  const setPyramid = useCallback(
    (level: PyramidLevel, content: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const next: AppState = {
          ...prev,
          pyramid: { ...prev.pyramid, [level]: { level, content, updatedAt: now } },
        };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()
              ?.from("pyramid_entries")
              .upsert(
                { user_id: u, level, content, updated_at: now },
                { onConflict: "user_id,level" },
              );
        });
        return next;
      });
    },
    [persist],
  );

  const setField = useCallback(
    (fieldId: FieldId, patch: Partial<FieldGoal>) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const merged: FieldGoal = {
          ...prev.fields[fieldId],
          ...patch,
          fieldId,
          updatedAt: now,
        };
        const next: AppState = {
          ...prev,
          fields: { ...prev.fields, [fieldId]: merged },
        };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()
              ?.from("field_goals")
              .upsert(fieldToRow(merged, u), { onConflict: "user_id,field_id" });
        });
        return next;
      });
    },
    [persist],
  );

  const addDailyTask = useCallback(
    (task: Omit<DailyTask, "id" | "createdAt">) => {
      const now = new Date().toISOString();
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const full: DailyTask = { ...task, id, createdAt: now };
      setState((prev) => {
        const next: AppState = {
          ...prev,
          dailyTasks: [...prev.dailyTasks, full],
        };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()
              ?.from("daily_tasks")
              .upsert(taskToRow(full, u), { onConflict: "id" });
        });
        return next;
      });
    },
    [persist],
  );

  const toggleDailyTask = useCallback(
    (id: string) => {
      setState((prev) => {
        let toggled: DailyTask | undefined;
        const dailyTasks = prev.dailyTasks.map((t) => {
          if (t.id === id) {
            toggled = { ...t, completed: !t.completed };
            return toggled;
          }
          return t;
        });
        const next: AppState = { ...prev, dailyTasks };
        persist(next, () => {
          const u = uid();
          if (u && toggled)
            void cloud()
              ?.from("daily_tasks")
              .update({ completed: toggled.completed })
              .eq("id", id);
        });
        return next;
      });
    },
    [persist],
  );

  const removeDailyTask = useCallback(
    (id: string) => {
      setState((prev) => {
        const next: AppState = {
          ...prev,
          dailyTasks: prev.dailyTasks.filter((t) => t.id !== id),
        };
        persist(next, () => {
          const u = uid();
          if (u) void cloud()?.from("daily_tasks").delete().eq("id", id);
        });
        return next;
      });
    },
    [persist],
  );

  const upsertMonthlyPlan = useCallback(
    (plan: MonthlyPlan) => {
      setState((prev) => {
        const idx = prev.monthlyPlans.findIndex(
          (p) => p.year === plan.year && p.month === plan.month,
        );
        const list = [...prev.monthlyPlans];
        if (idx >= 0) list[idx] = plan;
        else list.push(plan);
        const next: AppState = { ...prev, monthlyPlans: list };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()
              ?.from("monthly_plans")
              .upsert(monthlyToRow(plan, u), {
                onConflict: "user_id,year,month",
              });
        });
        return next;
      });
    },
    [persist],
  );

  const writeMandala = (next: AppState, mandala: MandalaChart) => {
    persist(next, () => {
      const u = uid();
      if (u)
        void cloud()
          ?.from("mandala_charts")
          .upsert(
            {
              user_id: u,
              center: mandala.center,
              cells: mandala.cells,
              updated_at: mandala.updatedAt,
            },
            { onConflict: "user_id" },
          );
    });
  };

  const setMandalaCenter = useCallback(
    (text: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const mandala = { ...prev.mandala, center: text, updatedAt: now };
        const next = { ...prev, mandala };
        writeMandala(next, mandala);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persist],
  );

  const setMandalaCell = useCallback(
    (index: number, text: string) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const cells = [...prev.mandala.cells];
        cells[index] = text;
        const mandala = { ...prev.mandala, cells, updatedAt: now };
        const next = { ...prev, mandala };
        writeMandala(next, mandala);
        return next;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [persist],
  );

  const addWishlistItem = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const now = new Date().toISOString();
      const id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `w_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setState((prev) => {
        const item: WishlistItem = {
          id,
          index: prev.wishlist.length + 1,
          text: trimmed,
          done: false,
          createdAt: now,
        };
        const next: AppState = { ...prev, wishlist: [...prev.wishlist, item] };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()
              ?.from("wishlist_items")
              .upsert(
                {
                  id: item.id,
                  user_id: u,
                  idx: item.index,
                  text: item.text,
                  done: item.done,
                  created_at: item.createdAt,
                },
                { onConflict: "id" },
              );
        });
        return next;
      });
    },
    [persist],
  );

  const updateWishlistItem = useCallback(
    (id: string, text: string) => {
      setState((prev) => {
        const next: AppState = {
          ...prev,
          wishlist: prev.wishlist.map((w) =>
            w.id === id ? { ...w, text } : w,
          ),
        };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()?.from("wishlist_items").update({ text }).eq("id", id);
        });
        return next;
      });
    },
    [persist],
  );

  const toggleWishlistItem = useCallback(
    (id: string) => {
      setState((prev) => {
        let done = false;
        const wishlist = prev.wishlist.map((w) => {
          if (w.id === id) {
            done = !w.done;
            return { ...w, done };
          }
          return w;
        });
        const next: AppState = { ...prev, wishlist };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()?.from("wishlist_items").update({ done }).eq("id", id);
        });
        return next;
      });
    },
    [persist],
  );

  const removeWishlistItem = useCallback(
    (id: string) => {
      setState((prev) => {
        const next: AppState = {
          ...prev,
          wishlist: prev.wishlist.filter((w) => w.id !== id),
        };
        persist(next, () => {
          const u = uid();
          if (u) void cloud()?.from("wishlist_items").delete().eq("id", id);
        });
        return next;
      });
    },
    [persist],
  );

  const saveDailyReport = useCallback(
    (
      date: string,
      fields: { doneText: string; noteText: string; tomorrowText: string },
    ) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const idx = prev.dailyReports.findIndex((r) => r.date === date);
        const existing = idx >= 0 ? prev.dailyReports[idx] : undefined;
        const merged: DailyReport = {
          id:
            existing?.id ??
            (typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `r_${date}`),
          date,
          doneText: fields.doneText,
          noteText: fields.noteText,
          tomorrowText: fields.tomorrowText,
          source: existing?.source ?? "app",
          updatedAt: now,
        };
        const list = [...prev.dailyReports];
        if (idx >= 0) list[idx] = merged;
        else list.unshift(merged);
        const next: AppState = { ...prev, dailyReports: list };
        persist(next, () => {
          const u = uid();
          if (u)
            void cloud()
              ?.from("daily_reports")
              .upsert(
                {
                  user_id: u,
                  date,
                  done_text: merged.doneText,
                  note_text: merged.noteText,
                  tomorrow_text: merged.tomorrowText,
                  source: merged.source,
                  updated_at: now,
                },
                { onConflict: "user_id,date" },
              );
        });
        return next;
      });
    },
    [persist],
  );

  const setUserPlan = useCallback(
    (plan: UserPlan) => {
      setState((prev) => {
        const next: AppState = { ...prev, userPlan: plan };
        persist(next, () => {
          const u = uid();
          if (u) void cloud()?.from("profiles").update({ plan }).eq("id", u);
        });
        return next;
      });
    },
    [persist],
  );

  const update = useCallback(
    (updater: (prev: AppState) => AppState) => {
      // 汎用 update：ローカルのみ完全対応。クラウドでは個別ヘルパ推奨だが、
      // フォールバックとして全エンティティを upsert する。
      setState((prev) => {
        const next = updater(prev);
        if (modeRef.current === "cloud") {
          const u = uid();
          if (u) void pushFullState(cloud(), u, next);
        } else {
          saveState(next);
        }
        return next;
      });
    },
    [],
  );

  // ---------------------------------------------------------
  // Auth / 同期メタ
  // ---------------------------------------------------------

  const signOut = useCallback(async () => {
    await supabaseRef.current?.auth.signOut();
    // onAuthStateChange が local モードへ戻す
  }, []);

  const syncLocalToCloud = useCallback(async (): Promise<{
    ok: boolean;
    message: string;
  }> => {
    const supabase = supabaseRef.current;
    const u = userIdRef.current;
    if (!supabase || !u) {
      return { ok: false, message: "ログインしていません。" };
    }
    const local = loadState();
    try {
      await pushFullState(supabase, u, local);
      const cloudState = await loadCloud(supabase, u);
      setState(cloudState);
      return { ok: true, message: "このデバイスのデータをアカウントへ移しました。" };
    } catch (e) {
      console.error("[hokushin] migrate failed", e);
      return { ok: false, message: "移行に失敗しました。時間をおいて再試行してください。" };
    }
  }, []);

  const value: AppStateContextValue = {
    state,
    loaded,
    update,
    setPyramid,
    setField,
    addDailyTask,
    toggleDailyTask,
    removeDailyTask,
    upsertMonthlyPlan,
    setMandalaCenter,
    setMandalaCell,
    addWishlistItem,
    updateWishlistItem,
    toggleWishlistItem,
    removeWishlistItem,
    saveDailyReport,
    setUserPlan,
    // meta
    mode,
    authReady,
    userEmail,
    supabaseEnabled,
    signOut,
    syncLocalToCloud,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// ------------------------------------------------------------
// 全エンティティを一括 upsert（移行 / 汎用 update のフォールバック）
// ------------------------------------------------------------

async function pushFullState(
  supabase: SupabaseClient | null,
  userId: string,
  s: AppState,
): Promise<void> {
  if (!supabase) return;

  const pyramidRows = Object.values(s.pyramid).map((p) => ({
    user_id: userId,
    level: p.level,
    content: p.content,
    updated_at: p.updatedAt,
  }));
  const fieldRows = Object.values(s.fields).map((f) => fieldToRow(f, userId));
  const taskRows = s.dailyTasks.map((t) => taskToRow(t, userId));
  const monthlyRows = s.monthlyPlans.map((p) => monthlyToRow(p, userId));
  const wishRows = s.wishlist.map((w) => ({
    id: w.id,
    user_id: userId,
    idx: w.index,
    text: w.text,
    done: w.done,
    created_at: w.createdAt,
  }));
  const reportRows = s.dailyReports.map((r) => ({
    user_id: userId,
    date: r.date,
    done_text: r.doneText,
    note_text: r.noteText,
    tomorrow_text: r.tomorrowText,
    source: r.source,
    updated_at: r.updatedAt,
  }));

  await Promise.all([
    supabase
      .from("pyramid_entries")
      .upsert(pyramidRows, { onConflict: "user_id,level" }),
    supabase
      .from("field_goals")
      .upsert(fieldRows, { onConflict: "user_id,field_id" }),
    taskRows.length
      ? supabase.from("daily_tasks").upsert(taskRows, { onConflict: "id" })
      : Promise.resolve(),
    monthlyRows.length
      ? supabase
          .from("monthly_plans")
          .upsert(monthlyRows, { onConflict: "user_id,year,month" })
      : Promise.resolve(),
    supabase.from("mandala_charts").upsert(
      {
        user_id: userId,
        center: s.mandala.center,
        cells: s.mandala.cells,
        updated_at: s.mandala.updatedAt,
      },
      { onConflict: "user_id" },
    ),
    wishRows.length
      ? supabase.from("wishlist_items").upsert(wishRows, { onConflict: "id" })
      : Promise.resolve(),
    reportRows.length
      ? supabase
          .from("daily_reports")
          .upsert(reportRows, { onConflict: "user_id,date" })
      : Promise.resolve(),
    supabase.from("profiles").update({ plan: s.userPlan }).eq("id", userId),
  ]);
}

// ------------------------------------------------------------
// Hook
// ------------------------------------------------------------

export function useAppStateContext(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within <AppStateProvider>");
  }
  return ctx;
}
