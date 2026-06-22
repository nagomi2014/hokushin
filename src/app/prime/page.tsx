"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTools } from "@/lib/tools/useTools";
import { useAppState } from "@/lib/storage";
import { GuidedPrompts, type PromptStep } from "@/components/GuidedPrompts";
import { FIELD_MAP } from "@/lib/constants";
import { activeFieldIds, fieldHasState } from "@/lib/fields";
import type { FieldId } from "@/lib/types";

// 分野が未設定のときのフォールバック（汎用の問い）
const GENERIC_PROMPTS: PromptStep[] = [
  { prompt: "健康・体のために、後回しにしがちだけど大事なことは？", placeholder: "例：運動を習慣にする／定期健診を受ける", hint: "いくつでも。" },
  { prompt: "家族・大切な人との関係で、時間をかけたいことは？", placeholder: "例：週に一度ゆっくり話す／一緒に出かける" },
  { prompt: "学び・成長で、いつかやりたいことは？", placeholder: "例：資格の勉強／読書を習慣にする" },
  { prompt: "仕事の“準備・仕組み化”で、緊急じゃないけど効くことは？", placeholder: "例：マニュアルを作る／自動化を進める" },
  { prompt: "心・休息のために、整えたいことは？", placeholder: "例：睡眠を整える／趣味の時間をとる" },
];

export default function PrimePage() {
  const {
    loaded: toolsLoaded,
    primeItems,
    addPrimeItem,
    togglePrimeItem,
    removePrimeItem,
    selectedFields,
  } = useTools();
  const { state, loaded: stateLoaded } = useAppState();
  const [text, setText] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  // 取り組む分野のうち、状態が一つでも入っているもの
  const fieldsWithStates = useMemo(
    () =>
      activeFieldIds(selectedFields, state.fields)
        .map((id) => FIELD_MAP[id])
        .filter((f) => fieldHasState(state.fields[f.id])),
    [selectedFields, state.fields],
  );

  // 分野ごとに「その状態に近づくための一手」を引き出す質問を組み立てる
  const steps: PromptStep[] = useMemo(() => {
    if (fieldsWithStates.length === 0) return GENERIC_PROMPTS;
    return fieldsWithStates.map((f) => {
      const g = state.fields[f.id];
      const context: { label: string; text: string }[] = [];
      if (g.longTerm.trim()) context.push({ label: "長期", text: g.longTerm.trim() });
      if (g.midTerm.trim()) context.push({ label: "中期", text: g.midTerm.trim() });
      if (g.shortTerm.trim()) context.push({ label: "短期", text: g.shortTerm.trim() });
      return {
        prompt: `「${f.nameJa}」で目指す状態に近づくために——\n重要だけど、つい後回しにしていることは？`,
        placeholder: "例：週1回まとまった時間をとる／環境を先に整える",
        hint: "“緊急じゃないけど効く一手”を。いくつでもOK。",
        meta: String(f.id),
        context,
      };
    });
  }, [fieldsWithStates, state.fields]);

  function add() {
    if (!text.trim()) return;
    addPrimeItem(text);
    setText("");
  }

  const done = primeItems.filter((p) => p.done).length;
  const loaded = toolsLoaded && stateLoaded;

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
          目標設定で描いた“ありたい状態”に近づく一手を、ここに集めておく。
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

      {/* 分野の状態の参照（紐づけの土台） */}
      {fieldsWithStates.length > 0 && (
        <section className="py-8 hairline-bottom">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="serif text-lg text-[var(--color-ink)]">
              目標・目指す状態
            </h2>
            <Link
              href="/fields"
              className="text-[10px] tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
            >
              目標を編集 →
            </Link>
          </div>
          <div className="space-y-2">
            {fieldsWithStates.map((f) => {
              const g = state.fields[f.id];
              const goal = (g.shortTerm || g.midTerm || g.longTerm).trim();
              return (
                <div key={f.id} className="flex items-baseline gap-3 text-[12px]">
                  <span className="text-[var(--color-gold)] tracking-[0.2em] w-16 shrink-0">
                    {f.nameJaShort}
                  </span>
                  <span className="text-[var(--color-ink)]">{goal}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Guide */}
      {guideOpen ? (
        <section className="py-8 hairline-bottom">
          <GuidedPrompts
            steps={steps}
            onAdd={(t, step) =>
              addPrimeItem(t, step.meta ? Number(step.meta) : undefined)
            }
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
            <span className="text-sm tracking-[0.15em]">
              {fieldsWithStates.length > 0
                ? "分野の状態から、一手を引き出す"
                : "質問に沿って書く"}
            </span>
            <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
              {fieldsWithStates.length > 0
                ? "各分野の“ありたい状態”を見ながら、近づくための一手を集める"
                : "分野ごとの質問に答えて、大事だけど後回しになることを集める"}
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
              {primeItems.map((p) => {
                const fm =
                  p.fieldId && FIELD_MAP[p.fieldId as FieldId]
                    ? FIELD_MAP[p.fieldId as FieldId]
                    : null;
                return (
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
                    <div className="flex-1">
                      {fm && (
                        <span className="text-[9px] tracking-[0.2em] text-[var(--color-gold)] border border-[var(--color-gold)]/40 px-1.5 py-0.5 mr-2 align-middle">
                          {fm.nameJaShort}
                        </span>
                      )}
                      <span
                        className={`text-sm align-middle ${
                          p.done
                            ? "line-through text-[var(--color-fg-faint)]"
                            : "text-[var(--color-ink)]"
                        }`}
                      >
                        {p.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePrimeItem(p.id)}
                      className="text-[10px] text-[var(--color-fg-faint)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-ink)] transition"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 text-xs text-[var(--color-fg-mute)] tracking-widest">
              DONE &nbsp; {done} / {primeItems.length}
            </div>
          </>
        )}
      </section>

      {primeItems.length > 0 && <PrimeNextSteps />}

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

// 第II領域に一手を書いた人への「次の一歩」案内。
function PrimeNextSteps() {
  const steps: { no: string; title: string; en: string; href: string; desc: string }[] = [
    {
      no: "01",
      title: "今月の一手にする",
      en: "MONTHLY",
      href: "/monthly",
      desc: "ここで挙げた中から一つを「今月いちばん進めること」に選び、今月の最重要目標にする。",
    },
    {
      no: "02",
      title: "今日のタスクに落とす",
      en: "DAILY",
      href: "/daily",
      desc: "今月の一手を、今日できる小さな行動に分ける。ここで初めて“動き”が始まる。",
    },
  ];
  return (
    <section className="mt-12 pt-10 hairline-top">
      <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
        ③ 動く ・ NEXT
      </div>
      <h2 className="serif text-2xl md:text-3xl text-[var(--color-ink)] mb-2">
        一手を書けたら、計画と今日へ
      </h2>
      <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-8 max-w-2xl">
        第II領域に集めた“重要だけど後回しになりがちな一手”を、放っておかずに前へ進めます。
        まず一つを今月の的に絞り、今日の行動に落としましょう。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-line)]">
        {steps.map((s) => (
          <Link
            key={s.no}
            href={s.href}
            className="bg-white p-6 hover:bg-[var(--color-paper-soft)] transition group"
          >
            <div className="flex items-baseline justify-between mb-3">
              <span className="serif text-2xl text-[var(--color-fg-faint)] group-hover:text-[var(--color-gold)] transition">
                {s.no}
              </span>
              <span className="text-[9px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                {s.en}
              </span>
            </div>
            <div className="serif text-lg text-[var(--color-ink)] mb-2">
              {s.title}
              <span className="text-[var(--color-gold)] ml-2 text-sm">→</span>
            </div>
            <p className="text-[12px] text-[var(--color-fg-mute)] leading-relaxed">
              {s.desc}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
