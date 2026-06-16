"use client";

import { useState } from "react";

// マンダラチャートを質問形式で埋める（$0・LLM不要）。
// 中央テーマ → それを支える8つの要素、を1つずつ。

const CENTER_CHIPS = [
  "家族",
  "健康",
  "自由",
  "成長",
  "挑戦",
  "貢献",
  "つながり",
  "安心",
];

// 8セルの観点（マンダラ周囲）
const CELL_AREAS = [
  "体・健康",
  "家族・身近な人",
  "仕事・役割",
  "お金・経済",
  "学び・成長",
  "つながり・仲間",
  "楽しみ・趣味",
  "心・あり方",
];

interface MandalaGuideProps {
  currentCenter: string;
  onSetCenter: (text: string) => void;
  onSetCell: (index: number, text: string) => void;
  onDone: () => void;
  onCancel: () => void;
}

export function MandalaGuide({
  currentCenter,
  onSetCenter,
  onSetCell,
  onDone,
  onCancel,
}: MandalaGuideProps) {
  // step 0 = 中央、1〜8 = セル0〜7
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [center, setCenter] = useState(currentCenter);

  const total = 9;
  const isCenter = step === 0;
  const cellIndex = step - 1;
  const isLast = step >= total - 1;

  function next() {
    if (isLast) onDone();
    else {
      setStep((s) => s + 1);
      setText("");
    }
  }

  function record() {
    const t = text.trim();
    if (isCenter) {
      if (t) {
        onSetCenter(t);
        setCenter(t);
      }
    } else if (t) {
      onSetCell(cellIndex, t);
    }
    next();
  }

  return (
    <div className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          {step + 1} / {total}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)] relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
            style={{ width: `${((step + 1) / total) * 100}%`, top: -1, height: 3 }}
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
      {isCenter ? (
        <div>
          <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
            中央
          </div>
          <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
            マンダラの真ん中に置く、人生で一番大切にしたいテーマは？
          </div>
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            一言で。ピンと来たものをタップしても、自分の言葉でもOK。
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {CENTER_CHIPS.map((c) => (
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
        </div>
      ) : (
        <div>
          <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
            {CELL_AREAS[cellIndex]}
          </div>
          <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
            「{center || "あなたのテーマ"}」を支えるために、
            <br />
            {CELL_AREAS[cellIndex]}で大事にしたいことは？
          </div>
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            一言・キーワードでOK。思いつかなければスキップを。
          </div>
        </div>
      )}

      {/* input */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && record()}
        placeholder={isCenter ? "例：家族との時間／挑戦し続ける" : "一言で書く…"}
        className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
      />

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={record}
          disabled={isCenter && !text.trim()}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLast ? "記録して完了 →" : "記録して次へ →"}
        </button>
        {!isCenter && (
          <button
            type="button"
            onClick={next}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition ml-auto"
          >
            {isLast ? "完了する" : "スキップ →"}
          </button>
        )}
      </div>

      {step > 0 && (
        <button
          type="button"
          onClick={() => {
            setStep((s) => s - 1);
            setText("");
          }}
          className="text-[11px] tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
        >
          ← ひとつ前へ
        </button>
      )}
    </div>
  );
}
