"use client";

// ============================================================
// 3分ニュース（朝のドラフト）
// ------------------------------------------------------------
// 北極星・今月の目標・昨日の日報・今日のタスクをもとに、
// 毎朝3分で読める「ニュース番組風」の原稿を生成して表示する。
// 文脈はこの端末の状態（useAppState / useTools）から組み立て、
// /api/news/morning へ渡す（サーバ側で Claude かテンプレートで生成）。
// ============================================================

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FIELD_MAP, FIELDS } from "@/lib/constants";
import { activeFieldIds } from "@/lib/fields";
import { currentYearMonth, todayString, useAppState } from "@/lib/storage";
import { useTools, type Horizon } from "@/lib/tools/useTools";
import type { FieldId } from "@/lib/types";
import type {
  NewsContext,
  NewsResponse,
  NewsSource,
} from "@/lib/news/draft";

const WEEKDAYS_JA = [
  "日曜日",
  "月曜日",
  "火曜日",
  "水曜日",
  "木曜日",
  "金曜日",
  "土曜日",
];

const TERM_BY_HORIZON: Record<Horizon, "longTerm" | "midTerm" | "shortTerm"> = {
  long: "longTerm",
  mid: "midTerm",
  short: "shortTerm",
};

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NewsPage() {
  const { state, loaded } = useAppState();
  const tools = useTools();

  const [script, setScript] = useState("");
  const [source, setSource] = useState<NewsSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const requestedRef = useRef(false);

  const ready = loaded && tools.loaded;

  // この端末の状態から「今日の文脈」を組み立てる。
  const context = useMemo<NewsContext | null>(() => {
    if (!ready) return null;

    const now = new Date();
    const today = todayString();
    const yesterday = ymd(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const { year, month } = currentYearMonth();

    // 北極星：分野連動ならその目標を、無ければ自由記入を採用
    const resolveNorth = (horizon: Horizon): string => {
      const goal = tools.northStar[horizon];
      if (goal.fieldId != null) {
        const term = TERM_BY_HORIZON[horizon];
        const linked = (state.fields[goal.fieldId as FieldId]?.[term] ?? "").trim();
        if (linked) return linked;
      }
      return goal.text.trim();
    };

    const monthly = state.monthlyPlans.find(
      (p) => p.year === year && p.month === month,
    );

    const todayTasks = state.dailyTasks
      .filter((t) => t.date === today)
      .map((t) => ({
        title: t.title,
        field:
          t.fieldId != null
            ? FIELDS.find((f) => f.id === t.fieldId)?.nameJaShort ?? null
            : null,
        time: t.startTime
          ? t.endTime
            ? `${t.startTime} — ${t.endTime}`
            : t.startTime
          : null,
        completed: t.completed,
      }));

    const yReport = state.dailyReports.find((r) => r.date === yesterday);

    const focusIds = activeFieldIds(tools.selectedFields, state.fields);
    const focusFields = focusIds.map((id) => ({
      name: FIELD_MAP[id].nameJaShort,
      shortTerm: state.fields[id]?.shortTerm ?? "",
    }));

    return {
      date: today,
      weekdayJa: WEEKDAYS_JA[now.getDay()],
      philosophy: state.pyramid[1]?.content ?? "",
      vision: state.pyramid[2]?.content ?? "",
      northStar: {
        long: resolveNorth("long"),
        mid: resolveNorth("mid"),
        short: resolveNorth("short"),
      },
      monthly: monthly
        ? {
            primaryGoal: monthly.primaryGoal,
            actionTheme: monthly.actionTheme,
            successPoints: monthly.successPoints,
          }
        : null,
      todayTasks,
      yesterday: yReport
        ? {
            done: yReport.doneText,
            note: yReport.noteText,
            tomorrow: yReport.tomorrowText,
          }
        : null,
      focusFields,
    };
  }, [ready, state, tools.northStar, tools.selectedFields]);

  const generate = useCallback(async () => {
    if (!context) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch("/api/news/morning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      const data = (await res.json()) as NewsResponse | { error: string };
      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || "生成に失敗しました。");
        return;
      }
      setScript(data.script);
      setSource(data.source);
    } catch {
      setError("通信に失敗しました。時間をおいて再試行してください。");
    } finally {
      setLoading(false);
    }
  }, [context]);

  // 文脈が整ったら最初の1回だけ自動生成
  useEffect(() => {
    if (!context || requestedRef.current) return;
    requestedRef.current = true;
    void generate();
  }, [context, generate]);

  const copy = useCallback(async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("コピーできませんでした。");
    }
  }, [script]);

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 pb-24">
      {/* ===== ヘッダー ===== */}
      <section className="pt-10 pb-6 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          ★ 3 MIN NEWS
        </div>
        <h1 className="serif text-3xl text-[var(--color-ink)] mb-2">
          3分ニュース
        </h1>
        <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
          北極星・今月の目標・昨日の記録・今日の予定から、朝に3分で読めるニュース原稿を仕立てます。
        </p>
      </section>

      {/* ===== 操作列 ===== */}
      <div className="py-4 hairline-bottom flex items-center justify-between gap-4 flex-wrap">
        <div className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
          {source === "ai"
            ? "AI が生成"
            : source === "template"
              ? "定型フォーマットで生成"
              : ""}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copy}
            disabled={!script || loading}
            className="text-[11px] tracking-[0.2em] px-3 py-1.5 border border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
          <button
            type="button"
            onClick={generate}
            disabled={!context || loading}
            className="text-[11px] tracking-[0.2em] px-3 py-1.5 bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)] transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "生成中…" : script ? "もう一度生成" : "生成する"}
          </button>
        </div>
      </div>

      {/* ===== 本文 ===== */}
      <section className="py-8">
        {!ready || (loading && !script) ? (
          <div className="py-24 text-center text-sm tracking-widest text-[var(--color-fg-faint)]">
            {!ready ? "読み込み中…" : "原稿を生成しています…"}
          </div>
        ) : error && !script ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[var(--color-fg-mute)] mb-4">{error}</p>
            <button
              type="button"
              onClick={generate}
              className="text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
            >
              再試行する →
            </button>
          </div>
        ) : script ? (
          <article className="serif text-[15px] leading-loose text-[var(--color-ink)] whitespace-pre-wrap">
            {script}
          </article>
        ) : (
          <div className="py-16 text-center text-sm text-[var(--color-fg-faint)]">
            「生成する」を押すと、今日のニュース原稿を作ります。
          </div>
        )}
        {error && script && (
          <p className="mt-6 text-xs text-[var(--color-fg-faint)]">{error}</p>
        )}
      </section>

      {/* ===== フッター導線 ===== */}
      <div className="hairline-top pt-6 flex items-center justify-between text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
        <Link href="/" className="hover:text-[var(--color-ink)]">
          ← ダッシュボード
        </Link>
        <Link href="/journal" className="hover:text-[var(--color-ink)]">
          日報を書く →
        </Link>
      </div>
    </div>
  );
}
