"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/storage";

export default function List100Page() {
  const {
    state,
    loaded,
    addWishlistItem,
    updateWishlistItem,
    toggleWishlistItem,
    removeWishlistItem,
  } = useAppState();

  const [newText, setNewText] = useState("");

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  const items = state.wishlist;
  const done = items.filter((i) => i.done).length;
  const remaining = Math.max(0, 100 - items.length);
  const fillPct = Math.min(100, items.length);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    addWishlistItem(newText);
    setNewText("");
  }

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10">

      <section className="pt-20 pb-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; LIST&nbsp;OF&nbsp;100
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          人生でやりたいこと 100
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl leading-relaxed">
          頭に浮かんだ「やりたいこと」を、思いつくまま 100 個書き出します。
          <br />
          書いた一つ一つが、目標を立てる時の <span className="text-[var(--color-ink)]">材料</span> になります。
        </p>
      </section>

      {/* Progress */}
      <section className="py-6 hairline-bottom">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)]">
            PROGRESS
          </div>
          <div className="text-xs">
            <span className="serif text-2xl text-[var(--color-ink)]">
              {items.length}
            </span>
            <span className="text-[var(--color-fg-faint)] mx-1">/</span>
            <span className="text-[var(--color-fg-mute)]">100</span>
            <span className="text-[var(--color-fg-faint)] mx-3">·</span>
            <span className="text-[var(--color-gold)]">{done} 達成</span>
          </div>
        </div>
        <div className="h-px bg-[var(--color-line)] relative">
          <div
            className="absolute h-px bg-[var(--color-ink)] top-0"
            style={{ width: `${fillPct}%` }}
          />
        </div>
        {remaining > 0 ? (
          <div className="mt-2 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            あと {remaining} 個 まで書き出せます
          </div>
        ) : (
          <div className="mt-2 text-[10px] tracking-[0.3em] text-[var(--color-gold)]">
            ★ 100 個達成！
          </div>
        )}
      </section>

      {/* Add form */}
      <section className="py-6 hairline-bottom">
        <form onSubmit={handleAdd} className="flex gap-3">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="思いついた「やりたいこと」を書く…"
            className="flex-1 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <button
            type="submit"
            disabled={!newText.trim()}
            className="border border-[var(--color-ink)] text-[var(--color-ink)] px-6 py-2 text-xs tracking-[0.3em] hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ＋ ADD
          </button>
        </form>
        <div className="mt-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          一行ずつ、短く書く。完璧でなくてOK。
        </div>
      </section>

      {/* Items */}
      <section className="py-8">
        {items.length === 0 ? (
          <div className="py-20 text-center text-sm text-[var(--color-fg-faint)]">
            まだ何も書かれていません。
            <br />
            一つ目を書いてみましょう。
          </div>
        ) : (
          <div className="hairline-top">
            {items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-3 hairline-bottom group"
              >
                <span className="serif text-sm text-[var(--color-fg-faint)] w-8 text-right">
                  {String(i + 1).padStart(3, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWishlistItem(item.id)}
                  className={`check-box ${item.done ? "checked" : ""}`}
                  aria-label="toggle"
                >
                  {item.done && <span className="text-[10px]">✓</span>}
                </button>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateWishlistItem(item.id, e.target.value)}
                  className={`flex-1 bg-transparent text-sm focus:outline-none ${
                    item.done
                      ? "line-through text-[var(--color-fg-faint)]"
                      : "text-[var(--color-ink)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => removeWishlistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition text-xs"
                  aria-label="remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="hairline-top mt-8 pt-8 pb-16 flex items-center justify-between">
        <Link
          href="/mandala"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← マンダラチャートへ
        </Link>
        <Link
          href="/fields"
          className="text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition"
        >
          → 七つの分野で目標を立てる
        </Link>
      </div>
    </div>
  );
}
