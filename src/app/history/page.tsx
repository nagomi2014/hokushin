"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTools } from "@/lib/tools/useTools";

export default function HistoryPage() {
  const {
    loaded,
    lifeEvents,
    addLifeEvent,
    removeLifeEvent,
  } = useTools();

  const [age, setAge] = useState("");
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"past" | "future">("past");

  const sorted = useMemo(
    () => [...lifeEvents].sort((a, b) => a.age - b.age),
    [lifeEvents],
  );

  function add() {
    const n = parseInt(age, 10);
    if (Number.isNaN(n) || !text.trim()) return;
    addLifeEvent(Math.max(0, Math.min(120, n)), text, kind);
    setText("");
  }

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10">
      {/* Header */}
      <section className="pt-20 pb-10 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; LIFE&nbsp;HISTORY
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          100年史
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          人生を時間軸で見渡す。過去の出来事と、これから叶えたいことを、
          年齢の順に並べていく。自分の物語が見えてくる。
        </p>
      </section>

      {/* Add form */}
      <section className="py-8 hairline-bottom">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-1">
              年齢
            </div>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="0"
              className="w-20 border border-[var(--color-line)] px-3 py-2 serif text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-1">
              出来事 ・ 願い
            </div>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              placeholder="その歳に、何があった？／何を叶えたい？"
              className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
            />
          </div>
          <div className="flex border border-[var(--color-line)]">
            {(["past", "future"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`text-[11px] tracking-[0.2em] px-3 py-2 transition ${
                  kind === k
                    ? "bg-[var(--color-ink)] text-white"
                    : "text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
                }`}
              >
                {k === "past" ? "過去" : "未来"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={add}
            className="bg-[var(--color-ink)] text-white px-5 py-2 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
          >
            ＋ 追加
          </button>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-8">
        {sorted.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-fg-faint)]">
            まだ何も書かれていません。
            <br />
            生まれた年（0歳）から、思い出せる出来事を置いてみましょう。
          </div>
        ) : (
          <ol className="relative border-l border-[var(--color-line)] ml-6">
            {sorted.map((e) => (
              <li key={e.id} className="relative pl-8 pb-8 group">
                <span
                  className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 ${
                    e.kind === "future"
                      ? "bg-white border-[var(--color-gold)]"
                      : "bg-[var(--color-ink)] border-[var(--color-ink)]"
                  }`}
                />
                <div className="flex items-baseline gap-3">
                  <span className="serif text-2xl text-[var(--color-ink)] leading-none">
                    {e.age}
                    <span className="text-xs text-[var(--color-fg-faint)] ml-0.5">
                      歳
                    </span>
                  </span>
                  <span
                    className={`text-[9px] tracking-[0.3em] px-1.5 py-0.5 ${
                      e.kind === "future"
                        ? "text-[var(--color-gold)] border border-[var(--color-gold)]"
                        : "text-[var(--color-fg-faint)] border border-[var(--color-line)]"
                    }`}
                  >
                    {e.kind === "future" ? "未来" : "過去"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLifeEvent(e.id)}
                    className="ml-auto text-[10px] text-[var(--color-fg-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-ink)] transition"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
                <div className="text-sm text-[var(--color-ink)] mt-1 leading-relaxed">
                  {e.text}
                </div>
              </li>
            ))}
          </ol>
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
