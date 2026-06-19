"use client";

import { useMemo, useState } from "react";
import type { GuidedAnswer, GuidedQuestion } from "@/lib/coach/guided";
import { clearGuide, readGuide, writeGuide } from "@/lib/tools/guideProgress";

interface GuidedDerivationProps {
  questions: GuidedQuestion[];
  synthesize: (answers: GuidedAnswer[]) => string;
  onApply: (text: string) => void;
  onCancel?: () => void;
  doneLabel?: string; // 採用ボタンの文言（例：「これを人生理念にする」）
  draftHeader?: string; // ドラフト見出し
  // 価値ミラーリング（理念のみ）。なければ表示しない。
  mirror?: (answers: GuidedAnswer[]) => string[];
  progressKey?: string; // 指定すると途中保存・再開できる
}

interface SavedDerivation {
  answers: GuidedAnswer[];
  index: number;
  phase: "asking" | "draft";
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
  progressKey,
}: GuidedDerivationProps) {
  const [saved] = useState<SavedDerivation | null>(() =>
    progressKey ? readGuide<SavedDerivation | null>(progressKey, null) : null,
  );
  const [answers, setAnswers] = useState<GuidedAnswer[]>(saved?.answers ?? []);
  const [index, setIndex] = useState(
    Math.min(saved?.index ?? 0, Math.max(0, questions.length - 1)),
  );
  const [freeText, setFreeText] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<"asking" | "draft">(
    saved?.phase ?? "asking",
  );
  const [draft, setDraft] = useState(
    saved?.phase === "draft" ? synthesize(saved.answers) : "",
  );

  const q = questions[index];
  const isLast = index >= questions.length - 1;
  const mirrorList = useMemo(
    () => (mirror ? mirror(answers) : []),
    [answers, mirror],
  );

  function persist(a: GuidedAnswer[], i: number, p: "asking" | "draft") {
    if (progressKey) writeGuide(progressKey, { answers: a, index: i, phase: p });
  }

  function toggle(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  }

  function advance(nextAnswers: GuidedAnswer[]) {
    setSelected([]);
    setFreeText("");
    if (isLast) {
      finish(nextAnswers);
      persist(nextAnswers, index, "draft");
    } else {
      setIndex((i) => i + 1);
      persist(nextAnswers, index + 1, "asking");
    }
  }

  // 選んだチップ（複数可）＋自由記述を1つの回答にまとめて次へ。
  function commit() {
    const labels = [...selected];
    const ft = freeText.trim();
    if (ft) labels.push(ft);
    if (labels.length === 0) {
      advance(answers); // 何も選ばなければスキップ
      return;
    }
    const values = [
      ...new Set(
        q.options
          .filter((o) => selected.includes(o.label))
          .flatMap((o) => o.values),
      ),
    ];
    const next = [
      ...answers.filter((a) => a.questionId !== q.id),
      { questionId: q.id, text: labels.join("、"), values },
    ];
    setAnswers(next);
    advance(next);
  }

  function finish(finalAnswers: GuidedAnswer[]) {
    setDraft(synthesize(finalAnswers));
    setPhase("draft");
  }

  function back() {
    if (index > 0) {
      setIndex((i) => i - 1);
      setFreeText("");
      setSelected([]);
      persist(answers, index - 1, "asking");
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
            onClick={() => {
              if (!draft.trim()) return;
              if (progressKey) clearGuide(progressKey);
              onApply(draft.trim());
            }}
            disabled={!draft.trim()}
            className="bg-[var(--color-ink)] text-white px-6 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ✓ &nbsp; {doneLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              setAnswers([]);
              setPhase("asking");
              setIndex(0);
              if (progressKey) clearGuide(progressKey);
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

      {/* 選択肢チップ（複数選択OK・トグル） */}
      <div>
        <div className="flex flex-wrap gap-2">
          {q.options.map((opt) => {
            const on = selected.includes(opt.label);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => toggle(opt.label)}
                className={`text-xs text-left border px-3 py-2 transition ${
                  on
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                    : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-soft)]"
                }`}
              >
                {on && <span className="text-[var(--color-gold)] mr-1">✓</span>}
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
          ピンと来たものを複数選んでOK（裏で大事な価値を見つけます）
        </div>
      </div>

      {/* 自由記述 */}
      {q.allowFree && (
        <div className="pt-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-px bg-[var(--color-line)]" />
            <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
              自分の言葉も足せます
            </span>
            <div className="flex-1 h-px bg-[var(--color-line)]" />
          </div>
          <textarea
            rows={2}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="自由に書く…（任意）"
            className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-none"
          />
        </div>
      )}

      {/* 次へ */}
      <button
        type="button"
        onClick={commit}
        className="w-full bg-[var(--color-ink)] text-white py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
      >
        {selected.length > 0 || freeText.trim()
          ? isLast
            ? `次へ ・ つくる →`
            : `次へ →（${selected.length + (freeText.trim() ? 1 : 0)}つ選択）`
          : "選ばずに次へ →"}
      </button>

      {/* フッター操作 */}
      <div className="flex items-center justify-between pt-1">
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
            onClick={() => {
              finish(answers);
              persist(answers, index, "draft");
            }}
            className="text-[10px] tracking-[0.25em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
          >
            もう十分 ・ つくる →
          </button>
        )}
      </div>
    </div>
  );
}
