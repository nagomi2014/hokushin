"use client";

import Link from "next/link";
import { useState } from "react";
import { useTools, type MoneyEntry } from "@/lib/tools/useTools";

const KINDS: { id: MoneyEntry["kind"]; label: string }[] = [
  { id: "income", label: "収入" },
  { id: "expense", label: "支出" },
  { id: "asset", label: "資産" },
  { id: "goal", label: "目標" },
];

function ym(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MoneyPage() {
  const { loaded, moneyEntries, addMoneyEntry, removeMoneyEntry } = useTools();

  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<MoneyEntry["kind"]>("asset");
  const [note, setNote] = useState("");

  function add() {
    if (!label.trim()) return;
    const n = amount.trim() === "" ? null : Number(amount.replace(/[^0-9.-]/g, ""));
    addMoneyEntry({
      label: label.trim(),
      amount: n != null && !Number.isNaN(n) ? n : null,
      kind,
      note: note.trim(),
      date: ym(),
    });
    setLabel("");
    setAmount("");
    setNote("");
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
      <section className="pt-20 pb-10 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; MONEY&nbsp;RECORD
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          金の記録
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          お金の現在地を、一覧で見渡す。収入・支出・資産・目標を書き留めて、
          経済の足場を整える。
        </p>
      </section>

      {/* Add form */}
      <section className="py-8 hairline-bottom space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex border border-[var(--color-line)]">
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`text-[11px] tracking-[0.15em] px-3 py-2 transition ${
                  kind === k.id
                    ? "bg-[var(--color-ink)] text-white"
                    : "text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-w-[160px]">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="項目名（例：貯蓄／固定費／投資 など）"
              className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
            />
          </div>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="金額（任意）"
            inputMode="numeric"
            className="w-32 border border-[var(--color-line)] px-3 py-2 text-right serif text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
        </div>
        <div className="flex items-end gap-3">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="メモ（任意）"
            className="flex-1 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
          <button
            type="button"
            onClick={add}
            className="bg-[var(--color-ink)] text-white px-5 py-2 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition whitespace-nowrap"
          >
            ＋ 記録
          </button>
        </div>
      </section>

      {/* List */}
      <section className="py-8">
        {moneyEntries.length === 0 ? (
          <div className="py-16 text-center text-sm text-[var(--color-fg-faint)]">
            まだ記録がありません。
            <br />
            気になるお金のことを、ひとつ書いてみましょう。
          </div>
        ) : (
          <div className="hairline-top">
            {moneyEntries.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-4 py-4 hairline-bottom group"
              >
                <span className="text-[9px] tracking-[0.25em] text-[var(--color-fg-faint)] border border-[var(--color-line)] px-1.5 py-0.5 w-10 text-center">
                  {KINDS.find((k) => k.id === m.kind)?.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--color-ink)]">{m.label}</div>
                  {m.note && (
                    <div className="text-[11px] text-[var(--color-fg-mute)] truncate">
                      {m.note}
                    </div>
                  )}
                </div>
                {m.amount != null && (
                  <span className="serif text-base text-[var(--color-ink)] whitespace-nowrap">
                    {m.amount.toLocaleString()}
                    <span className="text-[10px] text-[var(--color-fg-faint)] ml-0.5">
                      円
                    </span>
                  </span>
                )}
                <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)]">
                  {m.date}
                </span>
                <button
                  type="button"
                  onClick={() => removeMoneyEntry(m.id)}
                  className="text-[10px] text-[var(--color-fg-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-ink)] transition"
                  aria-label="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
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
