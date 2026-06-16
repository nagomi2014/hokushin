"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/storage";
import { MandalaGuide } from "@/components/MandalaGuide";

const CELL_HINTS = [
  "派生1",
  "派生2",
  "派生3",
  "派生4",
  "派生5",
  "派生6",
  "派生7",
  "派生8",
];

export default function MandalaPage() {
  const { state, loaded, setMandalaCenter, setMandalaCell } = useAppState();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  const m = state.mandala;
  const filledCount =
    (m.center.trim() ? 1 : 0) + m.cells.filter((c) => c.trim()).length;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10">

      <section className="pt-20 pb-12 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; SELF&nbsp;DISCOVERY
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          マンダラチャート
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl leading-relaxed">
          中央に「自分が人生で大切にしたいこと」を、
          まわりの8マスにそこから派生するキーワードを書きます。
          <br />
          ここで集めた言葉が、目標を立てる時の <span className="text-[var(--color-ink)]">材料</span> になります。
        </p>
      </section>

      {/* Guide（質問に沿って書く） */}
      {guideOpen ? (
        <section className="py-8 hairline-bottom max-w-2xl mx-auto">
          <MandalaGuide
            currentCenter={m.center}
            onSetCenter={setMandalaCenter}
            onSetCell={setMandalaCell}
            onDone={() => setGuideOpen(false)}
            onCancel={() => setGuideOpen(false)}
          />
        </section>
      ) : (
        <section className="py-8 hairline-bottom max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="block w-full text-left bg-[var(--color-ink)] text-white px-6 py-4 hover:bg-[var(--color-ink-soft)] transition"
          >
            <span className="text-[var(--color-gold)] mr-2">★</span>
            <span className="text-sm tracking-[0.15em]">質問に沿って書く</span>
            <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
              中央のテーマ → 8つの観点、を質問に答えて埋める
            </span>
          </button>
        </section>
      )}

      {/* Mandala grid */}
      <section className="py-12 hairline-bottom">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-px bg-[var(--color-line)]">
            {/* Row 1 */}
            <MandalaCell value={m.cells[0]} onChange={(v) => setMandalaCell(0, v)} hint={CELL_HINTS[0]} />
            <MandalaCell value={m.cells[1]} onChange={(v) => setMandalaCell(1, v)} hint={CELL_HINTS[1]} />
            <MandalaCell value={m.cells[2]} onChange={(v) => setMandalaCell(2, v)} hint={CELL_HINTS[2]} />
            {/* Row 2 */}
            <MandalaCell value={m.cells[3]} onChange={(v) => setMandalaCell(3, v)} hint={CELL_HINTS[3]} />
            <MandalaCenter value={m.center} onChange={setMandalaCenter} />
            <MandalaCell value={m.cells[4]} onChange={(v) => setMandalaCell(4, v)} hint={CELL_HINTS[4]} />
            {/* Row 3 */}
            <MandalaCell value={m.cells[5]} onChange={(v) => setMandalaCell(5, v)} hint={CELL_HINTS[5]} />
            <MandalaCell value={m.cells[6]} onChange={(v) => setMandalaCell(6, v)} hint={CELL_HINTS[6]} />
            <MandalaCell value={m.cells[7]} onChange={(v) => setMandalaCell(7, v)} hint={CELL_HINTS[7]} />
          </div>

          <div className="mt-5 flex items-center justify-between text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            <span>FILLED &nbsp; {filledCount} / 9</span>
            <span>AUTO-SAVED · LOCAL</span>
          </div>
        </div>
      </section>

      {/* Hints */}
      <section className="py-8 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          書き方のヒント
        </div>
        <ul className="text-sm text-[var(--color-fg-mute)] leading-relaxed space-y-2 max-w-2xl">
          <li>― 完璧を目指さなくてOK。思いついた言葉から書き始める。</li>
          <li>― 中央には「あなたが人生で大切にしたいこと」を一つ。例：自由、健康、家族、創造、貢献。</li>
          <li>― まわりの 8 マスは、中央から連想されるキーワード。動詞でも名詞でも、抽象でも具体でも。</li>
          <li>― 書いた言葉は、次に <Link href="/fields" className="text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5">七つの分野</Link> で目標を立てる時の材料になる。</li>
        </ul>
      </section>

      <div className="hairline-top mt-8 pt-8 pb-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
        <Link
          href="/list-100"
          className="text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition"
        >
          → 次は 100 のリストへ
        </Link>
      </div>
    </div>
  );
}

function MandalaCenter({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-[var(--color-ink)] aspect-square flex flex-col">
      <div className="px-3 pt-3 pb-1 text-[9px] tracking-[0.3em] text-[var(--color-gold)]">
        ★ &nbsp; 中心
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="自分が人生で大切にしたいこと"
        className="flex-1 bg-transparent text-white serif text-base md:text-lg leading-snug p-3 pt-1 focus:outline-none resize-none placeholder:text-white/30"
      />
    </div>
  );
}

function MandalaCell({
  value,
  onChange,
  hint,
}: {
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div className="bg-white aspect-square flex flex-col group hover:bg-[var(--color-paper-soft)] transition">
      <div className="px-2.5 pt-2 pb-0.5 text-[9px] tracking-[0.25em] text-[var(--color-fg-faint)]">
        {hint}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className="flex-1 bg-transparent text-[var(--color-ink)] text-sm leading-snug px-2.5 pb-2.5 focus:outline-none resize-none placeholder:text-[var(--color-fg-faint)]"
      />
    </div>
  );
}
