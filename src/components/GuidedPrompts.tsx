"use client";

import { useEffect, useRef, useState } from "react";
import { clearGuide, readGuide, writeGuide } from "@/lib/tools/guideProgress";
import { ResumeChoice } from "./ResumeChoice";

// 汎用：プロンプトを順にたどって、各回でいくつでも項目を足していく台本ウォーカー。
// 100のリストなど「複数追加」する導き出しに使う（AI不要・$0）。

export interface PromptStep {
  prompt: string;
  placeholder: string;
  hint?: string;
  // 入力を完成形に整える（例：「ハワイ」→「ハワイへ行く」）。
  format?: (text: string) => string;
  // 任意の付帯情報（例：金の記録の種別 income/expense/asset/goal）。
  meta?: string;
}

interface GuidedPromptsProps {
  steps: PromptStep[];
  onAdd: (text: string, step: PromptStep) => void;
  onDone: () => void;
  onCancel: () => void;
  doneLabel?: string;
  progressKey?: string; // 指定すると途中保存・再開できる
}

export function GuidedPrompts({
  steps,
  onAdd,
  onDone,
  onCancel,
  doneLabel = "完了",
  progressKey,
}: GuidedPromptsProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [addedHere, setAddedHere] = useState(0);
  const [pendingResume, setPendingResume] = useState<number | null>(null);

  // 前回の続きがあれば「途中から/最初から」を選んでもらう。
  const checked = useRef(false);
  useEffect(() => {
    if (checked.current || !progressKey) return;
    checked.current = true;
    const saved = readGuide(progressKey, 0);
    if (saved > 0) setPendingResume(Math.min(saved, Math.max(0, steps.length - 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressKey]);

  const step = steps[index];
  const isLast = index >= steps.length - 1;

  if (pendingResume !== null) {
    return (
      <ResumeChoice
        count={pendingResume + 1}
        onResume={() => {
          setIndex(pendingResume);
          setPendingResume(null);
        }}
        onRestart={() => {
          if (progressKey) clearGuide(progressKey);
          setIndex(0);
          setPendingResume(null);
        }}
      />
    );
  }

  function go(i: number) {
    setIndex(i);
    setText("");
    setAddedHere(0);
    if (progressKey) writeGuide(progressKey, i);
  }

  function finish() {
    if (progressKey) clearGuide(progressKey);
    onDone();
  }

  function record(advance: boolean) {
    const t = text.trim();
    if (t) {
      onAdd(step.format ? step.format(t) : t, step);
      setAddedHere((c) => c + 1);
      setText("");
    }
    if (advance) {
      if (isLast) finish();
      else go(index + 1);
    }
  }

  function skip() {
    if (isLast) finish();
    else go(index + 1);
  }

  return (
    <div className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          {index + 1} / {steps.length}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)] relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
            style={{
              width: `${((index + 1) / steps.length) * 100}%`,
              top: -1,
              height: 3,
            }}
          />
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[var(--color-fg-faint)] hover:text-[var(--color-ink)]"
        >
          閉じる
        </button>
      </div>

      {/* prompt */}
      <div>
        <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
          {step.prompt}
        </div>
        {step.hint && (
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            {step.hint}
          </div>
        )}
        {addedHere > 0 && (
          <div className="text-[11px] text-[var(--color-gold)] mt-2">
            ✓ {addedHere} 件 追加しました
          </div>
        )}
      </div>

      {/* input */}
      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={step.placeholder}
        className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-none"
      />

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => record(true)}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
        >
          {isLast ? "追加して完了 →" : "追加して次へ →"}
        </button>
        <button
          type="button"
          onClick={() => record(false)}
          disabled={!text.trim()}
          className="text-xs tracking-[0.25em] border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ＋ もう一つ
        </button>
        <button
          type="button"
          onClick={skip}
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition ml-auto"
        >
          {isLast ? doneLabel : "スキップ →"}
        </button>
      </div>

      {index > 0 && (
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="text-[11px] tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
        >
          ← ひとつ前へ
        </button>
      )}
    </div>
  );
}
