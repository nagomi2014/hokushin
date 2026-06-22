"use client";

// ガイド共通：前回の続きがあるとき「途中から/最初から」を選ぶ画面。
export function ResumeChoice({
  count,
  onResume,
  onRestart,
}: {
  count?: number;
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
        ★ &nbsp; 前回の続きがあります
      </div>
      <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
        {count
          ? `${count}個目まで進めた状態が保存されています。`
          : "前回の途中まで保存されています。"}
        <br />
        どうしますか？
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onResume}
          className="bg-[var(--color-ink)] text-white px-6 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
        >
          途中から再開する →
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
        >
          最初からやり直す
        </button>
      </div>
    </div>
  );
}
