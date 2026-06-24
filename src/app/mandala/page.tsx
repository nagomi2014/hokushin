"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppState } from "@/lib/storage";
import { useTools } from "@/lib/tools/useTools";
import { MandalaGuide } from "@/components/MandalaGuide";

// 3×3ブロック内の「中心以外の8マス」の位置（4＝中心は除外）
const SURROUND = [0, 1, 2, 3, 5, 6, 7, 8];
const sIdx = (pos: number) => SURROUND.indexOf(pos);

export default function MandalaPage() {
  const { state, loaded, setMandalaCenter, setMandalaCell } = useAppState();
  const { mandalaSub, setMandalaSub, addMandalaSub } = useTools();
  const [guideOpen, setGuideOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  const m = state.mandala;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10">

      <section className="pt-12 pb-6 hairline-bottom">
        <div className="text-[10px] tracking-[0.45em] text-[var(--color-gold)] mb-2">
          ★ &nbsp; SELF&nbsp;DISCOVERY
        </div>
        <h1 className="serif text-2xl md:text-3xl text-[var(--color-ink)] leading-tight font-medium tracking-tight">
          マンダラチャート
        </h1>
        <p className="text-[var(--color-fg-faint)] text-[11px] tracking-wider mt-1">
          中央テーマ → 8つの観点 → 64の派生。集めた言葉が目標の材料に。
        </p>
      </section>

      {/* Guide（質問に沿って書く） */}
      {guideOpen ? (
        <section className="py-8 hairline-bottom max-w-2xl mx-auto">
          <MandalaGuide
            currentCenter={m.center}
            currentCells={m.cells}
            onSetCenter={setMandalaCenter}
            onSetCell={setMandalaCell}
            onAddSub={addMandalaSub}
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

      {/* Mandalart 9×9 grid（ふだんは小さく、タップで拡大編集） */}
      <section className="py-8 hairline-bottom">
        {expanded ? (
        <>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            81マスを編集
          </span>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[10px] tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
          >
            小さく表示 −
          </button>
        </div>
        <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0">
          <div className="grid grid-cols-9 gap-px bg-[var(--color-line)] min-w-[680px]">
            {Array.from({ length: 81 }).map((_, idx) => {
              const r = Math.floor(idx / 9);
              const c = idx % 9;
              const block = Math.floor(r / 3) * 3 + (Math.floor(c / 3) % 3);
              const pos = (r % 3) * 3 + (c % 3);
              const blockBorder: React.CSSProperties = {
                borderRight:
                  c % 3 === 2 && c !== 8
                    ? "2px solid var(--color-ink)"
                    : undefined,
                borderBottom:
                  r % 3 === 2 && r !== 8
                    ? "2px solid var(--color-ink)"
                    : undefined,
              };

              if (block === 4) {
                // 中央ブロック：メインテーマ＋8観点
                if (pos === 4) {
                  return (
                    <Cell
                      key={idx}
                      variant="theme"
                      value={m.center}
                      onChange={setMandalaCenter}
                      style={blockBorder}
                    />
                  );
                }
                const a = sIdx(pos);
                return (
                  <Cell
                    key={idx}
                    variant="aspect"
                    value={m.cells[a] ?? ""}
                    onChange={(v) => setMandalaCell(a, v)}
                    style={blockBorder}
                  />
                );
              }

              // 外周ブロック：その観点の派生8項目（中心は観点のミラー）
              const a = sIdx(block);
              if (pos === 4) {
                return (
                  <Cell
                    key={idx}
                    variant="aspectMirror"
                    value={m.cells[a] ?? ""}
                    style={blockBorder}
                  />
                );
              }
              const s = sIdx(pos);
              return (
                <Cell
                  key={idx}
                  variant="sub"
                  value={mandalaSub[a]?.[s] ?? ""}
                  onChange={(v) => setMandalaSub(a, s, v)}
                  style={blockBorder}
                />
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          <span>中央テーマ＋8観点＋64派生 ＝ 81マス</span>
          <span>SAVED · THIS DEVICE</span>
        </div>
        </>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="block w-full group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                マンダラ全体
              </span>
              <span className="text-[10px] tracking-[0.25em] text-[var(--color-gold)] group-hover:text-[var(--color-ink)]">
                タップで拡大・編集 →
              </span>
            </div>
            <MiniMandala m={m} sub={mandalaSub} />
          </button>
        )}
      </section>

      {/* Hints */}
      <section className="py-8 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          書き方のヒント
        </div>
        <ul className="text-sm text-[var(--color-fg-mute)] leading-relaxed space-y-2 max-w-2xl">
          <li>― 真ん中の<span className="text-[var(--color-gold)]">紺のマス</span>に「人生で大切にしたいこと」を一つ。</li>
          <li>― そのまわりの<span className="text-[var(--color-gold)]">金のマス</span>が、中央から派生する8つの観点。</li>
          <li>― 外側の8ブロックは、それぞれの観点をさらに8つに展開する場所。</li>
          <li>― 「質問に沿って書く」を使えば、順番に質問されるので白紙で迷いません。</li>
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

// 小さな読み取り専用プレビュー（タップで拡大編集へ）
function MiniMandala({
  m,
  sub,
}: {
  m: { center: string; cells: string[] };
  sub: string[][];
}) {
  return (
    <div className="grid grid-cols-9 gap-px bg-[var(--color-line)] max-w-[300px] mx-auto border border-[var(--color-line)]">
      {Array.from({ length: 81 }).map((_, idx) => {
        const r = Math.floor(idx / 9);
        const c = idx % 9;
        const block = Math.floor(r / 3) * 3 + (Math.floor(c / 3) % 3);
        const pos = (r % 3) * 3 + (c % 3);
        const style: React.CSSProperties = {
          borderRight:
            c % 3 === 2 && c !== 8 ? "1.5px solid var(--color-ink)" : undefined,
          borderBottom:
            r % 3 === 2 && r !== 8 ? "1.5px solid var(--color-ink)" : undefined,
        };
        let filled = false;
        let cls = "bg-white";
        if (block === 4 && pos === 4) {
          filled = !!m.center.trim();
          cls = filled ? "bg-[var(--color-ink)]" : "bg-[var(--color-ink)]/15";
        } else if (block === 4) {
          filled = !!(m.cells[sIdx(pos)] ?? "").trim();
          cls = filled ? "bg-[var(--color-gold)]" : "bg-[var(--color-gold)]/15";
        } else if (pos === 4) {
          filled = !!(m.cells[sIdx(block)] ?? "").trim();
          cls = filled ? "bg-[var(--color-gold)]/70" : "bg-[var(--color-gold)]/10";
        } else {
          filled = !!(sub[sIdx(block)]?.[sIdx(pos)] ?? "").trim();
          cls = filled ? "bg-[var(--color-ink)]/55" : "bg-white";
        }
        return <div key={idx} className={`aspect-square ${cls}`} style={style} />;
      })}
    </div>
  );
}

type CellVariant = "theme" | "aspect" | "aspectMirror" | "sub";

function Cell({
  variant,
  value,
  onChange,
  style,
}: {
  variant: CellVariant;
  value: string;
  onChange?: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const base =
    "aspect-square flex items-center justify-center text-center leading-tight";

  if (variant === "theme") {
    return (
      <div className="bg-[var(--color-ink)]" style={style}>
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="中央テーマ"
          className={`${base} w-full h-full bg-transparent text-white serif text-[11px] md:text-xs px-1 focus:outline-none placeholder:text-white/40`}
        />
      </div>
    );
  }

  if (variant === "aspectMirror") {
    // 外周ブロックの中心＝観点のミラー（編集は中央ブロックで）
    return (
      <div
        className={`${base} bg-[var(--color-paper-soft)] text-[var(--color-gold)] serif text-[11px] md:text-xs px-1`}
        style={style}
        title="観点（中央で編集）"
      >
        {value || "—"}
      </div>
    );
  }

  const tint =
    variant === "aspect"
      ? "bg-[var(--color-paper-soft)] text-[var(--color-gold)] serif"
      : "bg-white text-[var(--color-ink)]";

  return (
    <div className={tint} style={style}>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="—"
        className={`${base} w-full h-full bg-transparent text-[11px] md:text-xs px-1 focus:outline-none placeholder:text-[var(--color-fg-faint)]`}
      />
    </div>
  );
}
