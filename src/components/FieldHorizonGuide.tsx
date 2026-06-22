"use client";

import { useState } from "react";
import { fieldIdealOptions } from "@/lib/coach/guided";
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

// 分野ごとの例文（長期/中期/短期）。すべて「どんな状態でいたいか」＝“状態”で書く。
// （※「やること（行動）」は、目標が決まったあと別で立てる）
const FIELD_EXAMPLES: Record<FieldId, { long: string; mid: string; short: string }> = {
  1: { long: "いつまでも自分の足で歩ける体でいる", mid: "週3回の運動が習慣になっている", short: "階段で息切れしない体になっている" },
  2: { long: "信頼し合える仲間に囲まれている", mid: "大切な人と気軽に会える関係になっている", short: "気軽に話せる友人が増えている" },
  3: { long: "家族みんなが安心して笑い合える家庭", mid: "家族で過ごす時間が増えている", short: "家族との会話が増えている" },
  4: { long: "自分の強みで価値を出し続けている", mid: "収入が1.5倍になっている", short: "新しい仕事に手応えを感じている" },
  5: { long: "専門分野で頼られる存在になっている", mid: "資格が取れている／英語で話せるようになっている", short: "学びの習慣が身についている" },
  6: { long: "お金の不安なく暮らせる土台がある", mid: "貯蓄が◯◯万円に増えている", short: "毎月少しずつ貯金できている" },
  7: { long: "夢中になれる趣味が人生を豊かにしている", mid: "趣味を定期的に楽しめている", short: "夢中になれることが見つかっている" },
};

// 毎年末〆。短期＝今年末、中期＝mid年後の年末、長期＝long年後の年末。
function buildHorizons(
  fieldId: FieldId,
  fieldName: string,
  baseYear: number,
  midYears: number,
  longYears: number,
): Horizon[] {
  const midY = baseYear + midYears;
  const longY = baseYear + longYears;
  const ex = FIELD_EXAMPLES[fieldId];
  return [
    {
      key: "longTerm",
      label: `長期 ・ ${longY}年末（${longYears}年後）`,
      prompt: `${fieldName}で、${longYears}年後（${longY}年末）には、どんな状態でいたい？`,
      placeholder: `例：${ex.long}`,
      hint: "“やること”ではなく“どうなっていたいか（状態）”を。下のボタンや自分の言葉で。",
      useIdealChips: true,
    },
    {
      key: "midTerm",
      label: `中期 ・ ${midY}年末（${midYears}年後）`,
      prompt: `では、その途中——${midYears}年後（${midY}年末）には、どんな状態でいたい？`,
      placeholder: `例：${ex.mid}`,
      hint: "長期と「今」のあいだの“通過点の状態”を、ひとつ。",
    },
    {
      key: "shortTerm",
      label: `短期 ・ ${baseYear}年末（今年）`,
      prompt: `では、今年（${baseYear}年12月31日）の終わりには、どんな状態でいたい？`,
      placeholder: `例：${ex.short}`,
      hint: "ここも“状態”でOK。具体的な“やること”は、目標が決まったあと別で立てます。",
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
}: FieldHorizonGuideProps) {
  const baseYear = new Date().getFullYear();
  const horizons = buildHorizons(fieldId, fieldName, baseYear, midYears, longYears);
  // 未入力の地平（長期→中期→短期）から始める＝データそのものから再開（確実）。
  const order = horizons.map((hz) => hz.key);
  const firstEmpty = order.findIndex((k) => !(current[k] ?? "").trim());

  const [step, setStep] = useState(firstEmpty === -1 ? 0 : firstEmpty);
  const h = horizons[step];
  const [text, setText] = useState(current[h.key] ?? "");
  const isLast = step >= horizons.length - 1;
  const chips = h.useIdealChips ? fieldIdealOptions(fieldId) : [];

  function go(i: number) {
    setStep(i);
    setText(current[horizons[i].key] ?? "");
  }

  function next(save: boolean) {
    if (save && text.trim()) onSet(h.key, text.trim());
    if (isLast) onDone();
    else go(step + 1);
  }

  // チップは複数選択（入力欄に足す／再タップで外す）
  const selectedChips = new Set(
    text
      .split(/[、,]/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  function toggleChip(c: string) {
    setText((prev) => {
      const parts = prev
        .split(/[、,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.includes(c)) return parts.filter((p) => p !== c).join("、");
      return [...parts, c].join("、");
    });
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
        <div>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => {
              const on = selectedChips.has(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChip(c)}
                  className={`text-xs border px-3 py-1.5 transition ${
                    on
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                      : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-soft)]"
                  }`}
                >
                  {on && <span className="text-[var(--color-gold)] mr-1">✓</span>}
                  {c}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            複数選んでOK（下の欄で自由に書き換えもできます）
          </div>
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
