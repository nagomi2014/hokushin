"use client";

import Link from "next/link";
import { useState } from "react";
import { useTools } from "@/lib/tools/useTools";
import { GuidedPrompts, type PromptStep } from "@/components/GuidedPrompts";

const PRIME_PROMPTS: PromptStep[] = [
  { prompt: "健康・体のために、後回しにしがちだけど大事なことは？", placeholder: "例：運動を習慣にする／定期健診を受ける", hint: "いくつでも。" },
  { prompt: "家族・大切な人との関係で、時間をかけたいことは？", placeholder: "例：週に一度ゆっくり話す／一緒に出かける" },
  { prompt: "学び・成長で、いつかやりたいことは？", placeholder: "例：資格の勉強／読書を習慣にする" },
  { prompt: "仕事の“準備・仕組み化”で、緊急じゃないけど効くことは？", placeholder: "例：マニュアルを作る／自動化を進める" },
  { prompt: "心・休息のために、整えたいことは？", placeholder: "例：睡眠を整える／趣味の時間をとる" },
];

export default function PrimePage() {
  const { loaded, primeItems, addPrimeItem, togglePrimeItem, removePrimeItem } =
    useTools();
  const [text, setText] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  function add() {
    if (!text.trim()) return;
    addPrimeItem(text);
    setText("");
  }

  const done = primeItems.filter((p) => p.done).length;

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10">
      <section className="pt-20 pb-10 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; QUADRANT&nbsp;II
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          第II領域
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          「重要だけど、緊急ではない」こと。ここに時間を使えるかで、人生は変わる。
          急かされないからこそ後回しになりがちな一手を、ここに集めておく。
        </p>
      </section>

      {/* 4象限の説明 */}
      <section className="py-8 hairline-bottom">
        <div className="grid grid-cols-2 gap-px bg-[var(--color-line)] max-w-md text-[11px]">
          <div className="bg-[var(--color-paper-soft)] p-3">
            <div className="text-[var(--color-fg-faint)] tracking-[0.2em] mb-1">
              I ・ 緊急 × 重要
            </div>
            <div className="text-[var(--color-fg-mute)]">締切・トラブル対応</div>
          </div>
          <div className="bg-white p-3 border border-[var(--color-gold)]">
            <div className="text-[var(--color-gold)] tracking-[0.2em] mb-1">
              II ・ 重要 × 非緊急
            </div>
            <div className="text-[var(--color-ink)]">準備・学び・健康・関係づくり</div>
          </div>
          <div className="bg-[var(--color-paper-soft)] p-3">
            <div className="text-[var(--color-fg-faint)] tracking-[0.2em] mb-1">
              III ・ 緊急 × 非重要
            </div>
            <div className="text-[var(--color-fg-mute)]">多くの会議・割り込み</div>
          </div>
          <div className="bg-[var(--color-paper-soft)] p-3">
            <div className="text-[var(--color-fg-faint)] tracking-[0.2em] mb-1">
              IV ・ 非緊急 × 非重要
            </div>
            <div className="text-[var(--color-fg-mute)]">暇つぶし・だらだら</div>
          </div>
        </div>
      </section>

      {/* Guide */}
      {guideOpen ? (
        <section className="py-8 hairline-bottom">
          <GuidedPrompts
            steps={PRIME_PROMPTS}
            onAdd={(t) => addPrimeItem(t)}
            onDone={() => setGuideOpen(false)}
            onCancel={() => setGuideOpen(false)}
            doneLabel="完了する"
            progressKey="prime"
          />
        </section>
      ) : (
        <section className="py-8 hairline-bottom">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="block w-full text-left bg-[var(--color-ink)] text-white px-6 py-4 hover:bg-[var(--color-ink-soft)] transition"
          >
            <span className="text-[var(--color-gold)] mr-2">★</span>
            <span className="text-sm tracking-[0.15em]">質問に沿って書く</span>
            <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
              分野ごとの質問に答えて、大事だけど後回しになることを集める
            </span>
          </button>
        </section>
      )}

      {/* Add */}
      <section className="py-8 hairline-bottom">
        <div className="flex items-end gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="重要だけど後回しにしがちなこと（例：運動・読書・家族との時間）"
            className="flex-1 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <button
            type="button"
            onClick={add}
            className="bg-[var(--color-ink)] text-white px-5 py-2 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition whitespace-nowrap"
          >
            ＋ 追加
          </button>
        </div>
      </section>

      {/* List */}
      <section className="py-8">
        {primeItems.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-fg-faint)]">
            まだありません。
            <br />
            「やった方がいいのに、つい後回し」を、ひとつ置いてみましょう。
          </div>
        ) : (
          <>
            <div className="hairline-top">
              {primeItems.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 py-4 hairline-bottom group"
                >
                  <button
                    type="button"
                    onClick={() => togglePrimeItem(p.id)}
                    className={`check-box ${p.done ? "checked" : ""}`}
                    aria-label="toggle"
                  >
                    {p.done && <span className="text-[10px]">✓</span>}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      p.done
                        ? "line-through text-[var(--color-fg-faint)]"
                        : "text-[var(--color-ink)]"
                    }`}
                  >
                    {p.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePrimeItem(p.id)}
                    className="text-[10px] text-[var(--color-fg-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-ink)] transition"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5 text-xs text-[var(--color-fg-mute)] tracking-widest">
              DONE &nbsp; {done} / {primeItems.length}
            </div>
          </>
        )}
      </section>

      <div className="hairline-top mt-4 pt-8 pb-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          SAVED · THIS DEVICE
        </span>
      </div>
    </div>
  );
}
