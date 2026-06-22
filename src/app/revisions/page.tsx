"use client";

import Link from "next/link";
import { useState } from "react";
import { useRevisions, type Revision } from "@/lib/tools/useRevisions";

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function RevisionsPage() {
  const { loaded, docSummaries, revisionsFor, clearDoc } = useRevisions();
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  const docs = docSummaries();

  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10">
      <section className="pt-20 pb-10 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; REVISIONS
        </div>
        <h1 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] font-medium tracking-tight mb-4">
          書き直しの記録
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          理念・ビジョン・七つの分野・月次目標を書き直すたび、過去の版が自動で残ります。
          「あのとき自分は何を書いていたか」を、いつでも振り返れる。
        </p>
      </section>

      {docs.length === 0 ? (
        <section className="py-20 text-center text-sm text-[var(--color-fg-faint)]">
          まだ記録はありません。
          <br />
          理念やビジョン、分野の目標を書いて、何度か書き直してみてください。
          <br />
          変えるたびに、ここに過去の版が積み重なっていきます。
        </section>
      ) : (
        <section className="py-8">
          {docs.map((doc) => {
            const isOpen = openKey === doc.docKey;
            const history = isOpen ? revisionsFor(doc.docKey) : [];
            return (
              <div key={doc.docKey} className="hairline-bottom">
                <button
                  type="button"
                  onClick={() => setOpenKey(isOpen ? null : doc.docKey)}
                  className="w-full text-left py-5 flex items-baseline gap-4 group"
                >
                  <span className="serif text-lg text-[var(--color-ink)] group-hover:text-[var(--color-gold)] transition">
                    {doc.label}
                  </span>
                  <span className="text-[10px] tracking-[0.25em] text-[var(--color-gold)]">
                    {doc.count}版
                  </span>
                  <span className="text-[11px] text-[var(--color-fg-faint)] ml-auto">
                    最終 {fmt(doc.lastSavedAt)}
                  </span>
                  <span className="text-[var(--color-fg-faint)] text-xs">
                    {isOpen ? "−" : "＋"}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-8">
                    <ul className="space-y-0">
                      {history.map((r, i) => (
                        <Version
                          key={r.id}
                          rev={r}
                          isLatest={i === 0}
                          ordinal={history.length - i}
                        />
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `「${doc.label}」の履歴をすべて削除しますか？（今の内容は消えません）`,
                          )
                        ) {
                          clearDoc(doc.docKey);
                          setOpenKey(null);
                        }
                      }}
                      className="mt-4 text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
                    >
                      この履歴を削除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

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

function Version({
  rev,
  isLatest,
  ordinal,
}: {
  rev: Revision;
  isLatest: boolean;
  ordinal: number;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <li className="relative pl-6 pb-6">
      {/* timeline dot + line */}
      <span
        className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${
          isLatest ? "bg-[var(--color-gold)]" : "bg-[var(--color-line)]"
        }`}
      />
      <span className="absolute left-[4.5px] top-4 bottom-0 w-px bg-[var(--color-line)]" />
      <div className="flex items-baseline gap-3 mb-1.5">
        <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
          v{ordinal}
        </span>
        {isLatest && (
          <span className="text-[9px] tracking-[0.2em] text-[var(--color-gold)] border border-[var(--color-gold)]/40 px-1.5 py-0.5">
            最新
          </span>
        )}
        <span className="text-[11px] text-[var(--color-fg-mute)]">
          {fmt(rev.savedAt)}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(rev.value).then(
              () => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              },
              () => {},
            );
          }}
          className="ml-auto text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
        >
          {copied ? "コピーしました" : "コピー"}
        </button>
      </div>
      <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap border-l-2 border-[var(--color-line)] pl-3">
        {rev.value}
      </div>
    </li>
  );
}
