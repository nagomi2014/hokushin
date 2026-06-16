"use client";

import { useState } from "react";

// マンダラチャート（フル9×9）を質問形式で埋める（$0・LLM不要）。
// 中央テーマ → 8観点 → 各観点の派生8項目、を順にたずねる。

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
  onAddSub: (aspectIndex: number, text: string) => void;
  onDone: () => void;
  onCancel: () => void;
}

export function MandalaGuide({
  currentCenter,
  onSetCenter,
  onSetCell,
  onAddSub,
  onDone,
  onCancel,
}: MandalaGuideProps) {
  type Phase = "main" | "bridge" | "sub";
  const [phase, setPhase] = useState<Phase>("main");
  // main: 0=中央, 1〜8=観点
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [center, setCenter] = useState(currentCenter);
  const [cells, setCells] = useState<string[]>(Array(8).fill(""));
  // sub
  const [queue, setQueue] = useState<number[]>([]);
  const [qPos, setQPos] = useState(0);
  const [subAdded, setSubAdded] = useState(0);

  const isCenter = step === 0;
  const aspectIdx = step - 1;

  // ---- main phase ----
  function recordMain() {
    const t = text.trim();
    if (isCenter) {
      if (t) {
        onSetCenter(t);
        setCenter(t);
      }
    } else if (t) {
      onSetCell(aspectIdx, t);
      setCells((prev) => {
        const n = [...prev];
        n[aspectIdx] = t;
        return n;
      });
    }
    setText("");
    if (step >= 8) setPhase("bridge");
    else setStep((s) => s + 1);
  }

  function skipMain() {
    setText("");
    if (step >= 8) setPhase("bridge");
    else setStep((s) => s + 1);
  }

  // ---- bridge ----
  function startSub() {
    const q = cells
      .map((v, i) => (v.trim() ? i : -1))
      .filter((i) => i >= 0);
    if (q.length === 0) {
      onDone();
      return;
    }
    setQueue(q);
    setQPos(0);
    setSubAdded(0);
    setText("");
    setPhase("sub");
  }

  // ---- sub phase ----
  function recordSub(advance: boolean) {
    const t = text.trim();
    if (t) {
      onAddSub(queue[qPos], t);
      setSubAdded((c) => c + 1);
      setText("");
    }
    if (advance) nextSub();
  }
  function nextSub() {
    setText("");
    setSubAdded(0);
    if (qPos >= queue.length - 1) onDone();
    else setQPos((p) => p + 1);
  }

  // ============ render ============
  const totalMain = 9;

  if (phase === "bridge") {
    return (
      <div className="space-y-5">
        <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)]">
          ✓ &nbsp; 8つの観点まで書けました
        </div>
        <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
          それぞれの観点を、さらに8マスに展開しますか？
        </div>
        <div className="text-[11px] text-[var(--color-fg-faint)]">
          観点ごとに「具体的にやること・要素」を質問していきます。あとから足してもOK。
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startSub}
            className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
          >
            ★ 展開する →
          </button>
          <button
            type="button"
            onClick={onDone}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
          >
            ここで完了する
          </button>
        </div>
      </div>
    );
  }

  if (phase === "sub") {
    const a = queue[qPos];
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          <span>
            観点 {qPos + 1} / {queue.length}
          </span>
          <div className="flex-1 h-px bg-[var(--color-line)] relative">
            <div
              className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
              style={{
                width: `${((qPos + 1) / queue.length) * 100}%`,
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

        <div>
          <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
            {cells[a]}
          </div>
          <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
            「{cells[a]}」を実現するために、
            <br />
            具体的にやること・要素は？（最大8つ）
          </div>
          {subAdded > 0 && (
            <div className="text-[11px] text-[var(--color-gold)] mt-2">
              ✓ {subAdded} 件 追加しました
            </div>
          )}
        </div>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && recordSub(false)}
          placeholder="一言・キーワードで…"
          className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => recordSub(true)}
            className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
          >
            {qPos >= queue.length - 1 ? "追加して完了 →" : "追加して次の観点へ →"}
          </button>
          <button
            type="button"
            onClick={() => recordSub(false)}
            disabled={!text.trim()}
            className="text-xs tracking-[0.25em] border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ＋ もう一つ
          </button>
          <button
            type="button"
            onClick={nextSub}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition ml-auto"
          >
            {qPos >= queue.length - 1 ? "完了する" : "この観点はスキップ →"}
          </button>
        </div>
      </div>
    );
  }

  // phase === "main"
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          {step + 1} / {totalMain}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)] relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
            style={{
              width: `${((step + 1) / totalMain) * 100}%`,
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

      {isCenter ? (
        <div>
          <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
            中央
          </div>
          <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
            マンダラの真ん中に置く、人生で一番大切にしたいテーマは？
          </div>
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            一言で。タップでも、自分の言葉でもOK。
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
            {CELL_AREAS[aspectIdx]}
          </div>
          <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
            「{center || "あなたのテーマ"}」を支えるために、
            <br />
            {CELL_AREAS[aspectIdx]}で大事にしたいことは？
          </div>
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            一言・キーワードでOK。思いつかなければスキップを。
          </div>
        </div>
      )}

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && recordMain()}
        placeholder={isCenter ? "例：家族との時間／挑戦し続ける" : "一言で書く…"}
        className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recordMain}
          disabled={isCenter && !text.trim()}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {step >= 8 ? "記録して次へ →" : "記録して次へ →"}
        </button>
        {!isCenter && (
          <button
            type="button"
            onClick={skipMain}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition ml-auto"
          >
            スキップ →
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
