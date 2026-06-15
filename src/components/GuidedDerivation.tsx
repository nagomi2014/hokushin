"use client";

import { useMemo, useState } from "react";
import type { GuidedAnswer, GuidedQuestion } from "@/lib/coach/guided";

interface GuidedDerivationProps {
  questions: GuidedQuestion[];
  synthesize: (answers: GuidedAnswer[]) => string;
  onApply: (text: string) => void;
  onCancel?: () => void;
  doneLabel?: string; // 採用ボタンの文言（例：「これを人生理念にする」）
  draftHeader?: string; // ドラフト見出し
  // 価値ミラーリング（理念のみ）。なければ表示しない。
  mirror?: (answers: GuidedAnswer[]) => string[];
}

/**
 * 台本式「導き出し対話」（AI不要・費用ゼロ）。
 * 易しい質問に選択肢で答えていくと、最後にドラフトが立ち上がる。
 * questions / synthesize を差し替えれば、理念・分野目標・月次のいずれにも使える。
 */
export function GuidedDerivation({
  questions,
  synthesize,
  onApply,
  onCancel,
  doneLabel = "これで決定する",
  draftHeader = "あなたの答えから、こんな形が見えてきました",
  mirror,
}: GuidedDerivationProps) {
  const [answers, setAnswers] = useState<GuidedAnswer[]>([]);
  const [index, setIndex] = useState(0);
  const [freeText, setFreeText] = useState("");
  const [phase, setPhase] = useState<"asking" | "draft">("asking");
  const [draft, setDraft] = useState("");

  const q = questions[index];
  const isLast = index >= questions.length - 1;
  const mirrorList = useMemo(
    () => (mirror ? mirror(answers) : []),
    [answers, mirror],
  );

  function record(text: string, values: GuidedAnswer["values"]) {
    const next = [
      ...answers.filter((a) => a.questionId !== q.id),
      { questionId: q.id, text, values },
    ];
    setAnswers(next);
    setFreeText("");
    if (isLast) {
      finish(next);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function finish(finalAnswers: GuidedAnswer[]) {
    setDraft(synthesize(finalAnswers));
    setPhase("draft");
  }

  function back() {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFreeText("");
    }
  }

  // ---- ドラフト確認フェーズ ----
  if (phase === "draft") {
    return (
      <div className="space-y-5">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
          ✓ &nbsp; {draftHeader}
        </div>
        {mirrorList.length > 0 && (
          <div className="text-xs text-[var(--color-fg-mute)]">
            見えてきた価値：
            {mirrorList.map((m, i) => (
              <span key={m} className="text-[var(--color-ink)]">
                {i > 0 ? " ・ " : " "}
                {m}
              </span>
            ))}
          </div>
        )}
        <textarea
          rows={5}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full border border-[var(--color-line)] bg-white px-4 py-3 serif text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
        />
        <div className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed">
          しっくりこなければ、自由に書き換えてOKです。あとからいつでも直せます。
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => draft.trim() && onApply(draft.trim())}
            disabled={!draft.trim()}
            className="bg-[var(--color-ink)] text-white px-6 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ✓ &nbsp; {doneLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("asking");
              setIndex(0);
            }}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
          >
            ↻ もう一度答える
          </button>
        </div>
      </div>
    );
  }

  // ---- 質問フェーズ ----
  return (
    <div className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          Q {index + 1} / {questions.length}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)] relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
            style={{
              width: `${((index + 1) / questions.length) * 100}%`,
              top: -1,
              height: 3,
            }}
          />
        </div>
      </div>

      {/* mirror（2問以上答えたら、見えてきた価値を見せる：理念のみ） */}
      {mirrorList.length > 0 && answers.length >= 2 && (
        <div className="text-[11px] text-[var(--color-fg-mute)] border-l-2 border-[var(--color-gold)] pl-3">
          ここまでで、あなたは
          <span className="text-[var(--color-ink)]">
            「{mirrorList.join("・")}」
          </span>
          を大事にしてそうですね。
        </div>
      )}

      {/* 質問 */}
      <div className="serif text-lg text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
        {q.prompt}
      </div>
      {q.hint && (
        <div className="text-[11px] text-[var(--color-fg-faint)]">{q.hint}</div>
      )}

      {/* 選択肢チップ */}
      <div className="flex flex-wrap gap-2">
        {q.options.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => record(opt.label, opt.values)}
            className="text-xs text-left border border-[var(--color-line)] text-[var(--color-ink)] px-3 py-2 hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-soft)] transition"
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 自由記述 */}
      {q.allowFree && (
        <div className="pt-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-[var(--color-line)]" />
            <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
              または自分の言葉で
            </span>
            <div className="flex-1 h-px bg-[var(--color-line)]" />
          </div>
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="自由に書く…"
              className="flex-1 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-none"
            />
            <button
              type="button"
              onClick={() => freeText.trim() && record(freeText.trim(), [])}
              disabled={!freeText.trim()}
              className="text-xs tracking-[0.25em] border border-[var(--color-ink)] text-[var(--color-ink)] px-3 py-2 hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
            >
              答える →
            </button>
          </div>
        </div>
      )}

      {/* フッター操作 */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={index > 0 ? back : onCancel}
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
        >
          {index > 0 ? "← ひとつ戻る" : "← やめる"}
        </button>
        {answers.length >= 3 && (
          <button
            type="button"
            onClick={() => finish(answers)}
            className="text-[10px] tracking-[0.25em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
          >
            もう十分 ・ 理念を作る →
          </button>
        )}
      </div>
    </div>
  );
}
