"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { todayString, useAppState } from "@/lib/storage";

export default function JournalPage() {
  const { state, loaded, saveDailyReport } = useAppState();

  const [date, setDate] = useState<string>(todayString());
  const [doneText, setDoneText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [tomorrowText, setTomorrowText] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // 選択日の完了タスクから「できたこと」の下書きを作る
  const completedDraft = useMemo(() => {
    return state.dailyTasks
      .filter((t) => t.date === date && t.completed)
      .map((t) => `・${t.title}`)
      .join("\n");
  }, [state.dailyTasks, date]);

  const report = state.dailyReports.find((r) => r.date === date);

  // 日付変更・初回ロード時にフォームを同期（既存の日報があればそれ、無ければ下書き）
  useEffect(() => {
    if (!loaded) return;
    const r = state.dailyReports.find((x) => x.date === date);
    setDoneText(r ? r.doneText : completedDraft);
    setNoteText(r ? r.noteText : "");
    setTomorrowText(r ? r.tomorrowText : "");
    setSavedMsg("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, loaded]);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  function handleSave() {
    saveDailyReport(date, { doneText, noteText, tomorrowText });
    setSavedMsg("保存しました。");
  }

  function applyDraft() {
    setDoneText((prev) =>
      prev.trim() ? prev + "\n" + completedDraft : completedDraft,
    );
  }

  // 過去の日報（新しい順）
  const recent = [...state.dailyReports].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-10">
      {/* Header */}
      <section className="pt-12 pb-6 hairline-bottom">
        <div className="text-[10px] tracking-[0.45em] text-[var(--color-gold)] mb-2">
          ★ &nbsp; JOURNAL
        </div>
        <h1 className="serif text-2xl md:text-3xl text-[var(--color-ink)] leading-tight font-medium tracking-tight">
          日報
        </h1>
        <p className="text-[var(--color-fg-faint)] text-[11px] tracking-wider mt-1">
          一日を振り返り、言葉にして残す。
        </p>
      </section>

      {/* Date + source */}
      <section className="py-8 hairline-bottom">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-2">
              DATE
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="serif text-2xl text-[var(--color-ink)] bg-transparent border-b border-[var(--color-line)] pb-1 focus:outline-none focus:border-[var(--color-ink)] transition"
            />
          </div>
          {report && (
            <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
              {report.source === "import" ? (
                <span className="text-[var(--color-gold)]">
                  ⇣ 取り込み（Claude Code 等）
                </span>
              ) : (
                <span>✓ 記録済み</span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Editor */}
      <section className="py-8 space-y-8">
        <Field
          label="できたこと"
          en="DONE"
          value={doneText}
          onChange={setDoneText}
          placeholder="今日できたこと・進んだこと…"
          extra={
            completedDraft && (
              <button
                type="button"
                onClick={applyDraft}
                className="text-[10px] tracking-[0.25em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
              >
                ＋ 完了タスクを差し込む
              </button>
            )
          }
        />
        <Field
          label="メモ・気づき"
          en="NOTES"
          value={noteText}
          onChange={setNoteText}
          placeholder="気づき・学び・感じたこと…"
        />
        <Field
          label="明日へ"
          en="NEXT"
          value={tomorrowText}
          onChange={setTomorrowText}
          placeholder="明日やること・引き継ぎ…"
        />

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="bg-[var(--color-ink)] text-white px-8 py-3 text-sm tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
          >
            日報を保存
          </button>
          {savedMsg && (
            <span className="text-[10px] tracking-[0.3em] text-[var(--color-gold)]">
              ✓ {savedMsg}
            </span>
          )}
        </div>
      </section>

      {/* Recent reports */}
      {recent.length > 0 && (
        <section className="py-8 hairline-top">
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-4">
            これまでの日報
          </div>
          <div className="space-y-2">
            {recent.slice(0, 30).map((r) => {
              const preview =
                [r.doneText, r.noteText, r.tomorrowText]
                  .find((t) => t.trim())
                  ?.split("\n")[0]
                  ?.slice(0, 40) ?? "（空）";
              return (
                <button
                  key={r.date}
                  onClick={() => setDate(r.date)}
                  className={`w-full text-left flex items-center gap-4 py-2.5 px-3 hairline-bottom hover:bg-[var(--color-paper-soft)] transition ${
                    r.date === date ? "bg-[var(--color-paper-soft)]" : ""
                  }`}
                >
                  <span className="serif text-sm text-[var(--color-ink)] w-28 flex-shrink-0">
                    {r.date}
                  </span>
                  <span className="text-xs text-[var(--color-fg-mute)] flex-1 truncate">
                    {preview}
                  </span>
                  {r.source === "import" && (
                    <span className="text-[10px] tracking-[0.2em] text-[var(--color-gold)] flex-shrink-0">
                      ⇣
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="hairline-top mt-8 pt-8 pb-16">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
      </div>
    </div>
  );
}

function Field({
  label,
  en,
  value,
  onChange,
  placeholder,
  extra,
}: {
  label: string;
  en: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-3">
          <span className="serif text-lg text-[var(--color-ink)]">{label}</span>
          <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            {en}
          </span>
        </div>
        {extra}
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--color-line)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
      />
    </div>
  );
}
