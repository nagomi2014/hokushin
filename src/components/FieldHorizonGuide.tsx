"use client";

import { useState } from "react";
import { fieldIdealOptions } from "@/lib/coach/guided";
import { clearGuide, readGuide, writeGuide } from "@/lib/tools/guideProgress";
import type { FieldId } from "@/lib/types";

// 一分野の目標を「長期 → 中期 → 短期」の順に、質問で立てる（$0・LLM不要）。
// 遠い未来から手前に降ろす、目標設定の王道の順番。

type HorizonKey = "longTerm" | "midTerm" | "shortTerm";

interface Horizon {
  key: HorizonKey;
  label: string;
  prompt: string;
  placeholder: string;
  hint?: string;
  useIdealChips?: boolean;
}

// 毎年末〆。短期＝今年末、中期＝mid年後の年末、長期＝long年後の年末。
function buildHorizons(
  fieldName: string,
  baseYear: number,
  midYears: number,
  longYears: number,
): Horizon[] {
  const midY = baseYear + midYears;
  const longY = baseYear + longYears;
  return [
    {
      key: "longTerm",
      label: `長期 ・ ${longY}年末（${longYears}年後）`,
      prompt: `${fieldName}で、${longYears}年後（${longY}年末）には、どうなっていたい？`,
      placeholder: "例：いつまでも自分の足で歩ける体でいる",
      hint: "大きな方向でOK。下のボタンから選んでも、自分の言葉でも。",
      useIdealChips: true,
    },
    {
      key: "midTerm",
      label: `中期 ・ ${midY}年末（${midYears}年後）`,
      prompt: `では、その途中——${midYears}年後（${midY}年末）には、どうなっていたい？`,
      placeholder: "例：週3回の運動が習慣になっている",
      hint: "長期と「今」のあいだの“通過点”を、ひとつ。",
    },
    {
      key: "shortTerm",
      label: `短期 ・ ${baseYear}年末（今年）`,
      prompt: `では、今年（${baseYear}年12月31日）までに何をする？`,
      placeholder: "例：まず毎朝10分のウォーキングから始める",
      hint: "小さく、確実にできることから。",
    },
  ];
}

interface FieldHorizonGuideProps {
  fieldId: FieldId;
  fieldName: string;
  current: { longTerm: string; midTerm: string; shortTerm: string };
  midYears: number;
  longYears: number;
  onSet: (key: HorizonKey, value: string) => void;
  onDone: () => void;
  onCancel: () => void;
  progressKey?: string;
}

export function FieldHorizonGuide({
  fieldId,
  fieldName,
  current,
  midYears,
  longYears,
  onSet,
  onDone,
  onCancel,
  progressKey,
}: FieldHorizonGuideProps) {
  const baseYear = new Date().getFullYear();
  const horizons = buildHorizons(fieldName, baseYear, midYears, longYears);
  const key = progressKey ? `${progressKey}-horizon` : undefined;
  const initStep = key ? Math.min(readGuide(key, 0), horizons.length - 1) : 0;

  const [step, setStep] = useState(initStep);
  const h = horizons[step];
  const [text, setText] = useState(current[h.key] ?? "");
  const isLast = step >= horizons.length - 1;
  const chips = h.useIdealChips ? fieldIdealOptions(fieldId) : [];

  function go(i: number) {
    setStep(i);
    setText(current[horizons[i].key] ?? "");
    if (key) writeGuide(key, i);
  }

  function next(save: boolean) {
    if (save && text.trim()) onSet(h.key, text.trim());
    if (isLast) {
      if (key) clearGuide(key);
      onDone();
    } else {
      go(step + 1);
    }
  }

  return (
    <div className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          {step + 1} / {horizons.length}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)] relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
            style={{
              width: `${((step + 1) / horizons.length) * 100}%`,
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

      {/* 直前の地平（文脈） */}
      {step === 1 && current.longTerm.trim() && (
        <ContextLine label="長期" text={current.longTerm} />
      )}
      {step === 2 && current.midTerm.trim() && (
        <ContextLine label="中期" text={current.midTerm} />
      )}

      {/* prompt */}
      <div>
        <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
          {h.label}
        </div>
        <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
          {h.prompt}
        </div>
        {h.hint && (
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            {h.hint}
          </div>
        )}
      </div>

      {/* chips（長期のみ・タップで入力欄に入る） */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setText(c)}
              className="text-xs border border-[var(--color-line)] text-[var(--color-ink)] px-3 py-1.5 hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-soft)] transition"
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <textarea
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={h.placeholder}
        className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => next(true)}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
        >
          {isLast ? "決定して完了 →" : "決定して次へ →"}
        </button>
        <button
          type="button"
          onClick={() => next(false)}
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition ml-auto"
        >
          {isLast ? "スキップして完了" : "スキップ →"}
        </button>
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => go(step - 1)}
          className="text-[11px] tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
        >
          ← ひとつ前へ
        </button>
      )}
    </div>
  );
}

function ContextLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-l-2 border-[var(--color-gold)] pl-3 text-[11px] text-[var(--color-fg-mute)]">
      <span className="text-[var(--color-fg-faint)] tracking-[0.2em] mr-2">
        {label}
      </span>
      {text}
    </div>
  );
}
