"use client";

import { useState } from "react";

// 汎用：プロンプトを順にたどって、各回でいくつでも項目を足していく台本ウォーカー。
// 100のリストなど「複数追加」する導き出しに使う（AI不要・$0）。

export interface PromptStep {
  prompt: string;
  placeholder: string;
  hint?: string;
}

interface GuidedPromptsProps {
  steps: PromptStep[];
  onAdd: (text: string) => void;
  onDone: () => void;
  onCancel: () => void;
  doneLabel?: string;
}

export function GuidedPrompts({
  steps,
  onAdd,
  onDone,
  onCancel,
  doneLabel = "完了",
}: GuidedPromptsProps) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [addedHere, setAddedHere] = useState(0);

  const step = steps[index];
  const isLast = index >= steps.length - 1;

  function go(i: number) {
    setIndex(i);
    setText("");
    setAddedHere(0);
  }

  function record(advance: boolean) {
    if (text.trim()) {
      onAdd(text.trim());
      setAddedHere((c) => c + 1);
      setText("");
    }
    if (advance) {
      if (isLast) onDone();
      else go(index + 1);
    }
  }

  function skip() {
    if (isLast) onDone();
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
