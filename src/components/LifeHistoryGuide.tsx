"use client";

import { useState } from "react";

// 人生を時系列でたどるインタビュー台本（$0・LLM不要）。
// 各ステージで「年齢＋出来事」を1つずつ記録し、年表が埋まっていく。
interface Stage {
  id: string;
  era: string; // 時期ラベル
  defaultAge: number;
  prompt: string;
  placeholder: string; // 入力欄の例文（質問に合わせる）
  hint?: string;
  kind: "past" | "future";
}

const STAGES: Stage[] = [
  {
    id: "birth",
    era: "誕生",
    defaultAge: 0,
    prompt: "あなたは、いつ・どこで生まれましたか？",
    placeholder: "例：1985年、千葉県館山市で生まれた",
    hint: "生まれた年と場所を。聞いている家族の話でもOK。",
    kind: "past",
  },
  {
    id: "early",
    era: "幼少期（〜6歳）",
    defaultAge: 4,
    prompt: "小さい頃の思い出はありますか？保育園や幼稚園、住んでいた場所など。",
    placeholder: "例：◯◯保育園に通っていた／祖父母の家によく行った",
    hint: "覚えている出来事をひとつ。年齢は分かる範囲で。",
    kind: "past",
  },
  {
    id: "elem_low",
    era: "小学校 低学年（6〜9歳）",
    defaultAge: 7,
    prompt: "小学校に入学した頃のこと。どこの小学校で、1〜3年生の思い出は？",
    placeholder: "例：◯◯小学校に入学／スイミングを習い始めた",
    hint: "習い事・友達・引越し・転校など。学年ごとに思い出せたら、それぞれ追加を。",
    kind: "past",
  },
  {
    id: "elem_high",
    era: "小学校 高学年（9〜12歳）",
    defaultAge: 11,
    prompt: "小学校の4〜6年生の頃。夢中だったこと、印象に残っている出来事は？",
    placeholder: "例：少年野球のキャプテンだった／◯◯へ引越した",
    hint: "クラブ・行事・引越し・転校など。複数あれば追加してください。",
    kind: "past",
  },
  {
    id: "junior",
    era: "中学校（12〜15歳）",
    defaultAge: 13,
    prompt: "中学生の頃。部活・受験・友人関係など、覚えていることは？",
    placeholder: "例：◯◯部に入った／高校受験をがんばった",
    kind: "past",
  },
  {
    id: "high",
    era: "高校（15〜18歳）",
    defaultAge: 16,
    prompt: "高校生の頃。進路・出会い・夢中になったことは？",
    placeholder: "例：◯◯高校に進学／アルバイトを始めた",
    kind: "past",
  },
  {
    id: "after_high",
    era: "卒業後（18〜22歳）",
    defaultAge: 20,
    prompt: "高校卒業後はどんな道に？大学・専門学校・就職など。",
    placeholder: "例：◯◯専門学校へ／上京して就職した",
    kind: "past",
  },
  {
    id: "twenties",
    era: "20代",
    defaultAge: 25,
    prompt: "20代の頃。仕事・恋愛・引越し・転機になった出来事は？",
    placeholder: "例：転職した／結婚した／独立した",
    kind: "past",
  },
  {
    id: "thirties",
    era: "30代",
    defaultAge: 35,
    prompt: "30代の頃。結婚・子ども・キャリア・大きな決断などは？",
    placeholder: "例：子どもが生まれた／家を建てた",
    hint: "なければスキップでOK。",
    kind: "past",
  },
  {
    id: "forties",
    era: "40代",
    defaultAge: 45,
    prompt: "40代の頃。今につながる出来事や、価値観が変わった経験は？",
    placeholder: "例：新しい挑戦を始めた／健康を見直した",
    hint: "なければスキップでOK。",
    kind: "past",
  },
  {
    id: "fifties_plus",
    era: "50代〜現在",
    defaultAge: 55,
    prompt: "50代から今まで。最近の節目や、印象に残っていることは？",
    placeholder: "例：子どもが独立した／趣味を再開した",
    hint: "まだなら、スキップしてください。",
    kind: "past",
  },
  {
    id: "future",
    era: "これから（未来）",
    defaultAge: 60,
    prompt: "これから——何歳のときに、何を叶えたいですか？未来の願いを置きましょう。",
    placeholder: "例：60歳までに◯◯を実現する",
    hint: "いくつでも。年齢は「叶えたい歳」を入れてください。",
    kind: "future",
  },
];

interface LifeHistoryGuideProps {
  onAdd: (age: number, text: string, kind: "past" | "future") => void;
  onDone: () => void;
  onCancel: () => void;
}

export function LifeHistoryGuide({
  onAdd,
  onDone,
  onCancel,
}: LifeHistoryGuideProps) {
  const [index, setIndex] = useState(0);
  const [age, setAge] = useState(String(STAGES[0].defaultAge));
  const [text, setText] = useState("");
  const [addedHere, setAddedHere] = useState(0);

  const stage = STAGES[index];
  const isLast = index >= STAGES.length - 1;

  function goToStage(i: number) {
    setIndex(i);
    setAge(String(STAGES[i].defaultAge));
    setText("");
    setAddedHere(0);
  }

  function record(advance: boolean) {
    const n = parseInt(age, 10);
    if (!Number.isNaN(n) && text.trim()) {
      onAdd(Math.max(0, Math.min(120, n)), text.trim(), stage.kind);
      setAddedHere((c) => c + 1);
      setText("");
    }
    if (advance) {
      if (isLast) onDone();
      else goToStage(index + 1);
    }
  }

  function skip() {
    if (isLast) onDone();
    else goToStage(index + 1);
  }

  return (
    <div className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          {index + 1} / {STAGES.length}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)] relative">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
            style={{
              width: `${((index + 1) / STAGES.length) * 100}%`,
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

      {/* era + prompt */}
      <div>
        <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
          {stage.era}
        </div>
        <div className="serif text-lg text-[var(--color-ink)] leading-relaxed">
          {stage.prompt}
        </div>
        {stage.hint && (
          <div className="text-[11px] text-[var(--color-fg-faint)] mt-2">
            {stage.hint}
          </div>
        )}
        {addedHere > 0 && (
          <div className="text-[11px] text-[var(--color-gold)] mt-2">
            ✓ この時期に {addedHere} 件 記録しました
          </div>
        )}
      </div>

      {/* input */}
      <div className="flex items-end gap-3">
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
            className="w-20 border border-[var(--color-line)] px-3 py-2 serif text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
          />
        </div>
        <div className="flex-1">
          <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-1">
            出来事・思い出
          </div>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={stage.placeholder}
            className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-none"
          />
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => record(true)}
          className="bg-[var(--color-ink)] text-white px-5 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
        >
          {isLast ? "記録して完了 →" : "記録して次へ →"}
        </button>
        <button
          type="button"
          onClick={() => record(false)}
          disabled={!text.trim()}
          className="text-xs tracking-[0.25em] border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ＋ この時期にもう一つ
        </button>
        <button
          type="button"
          onClick={skip}
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition ml-auto"
        >
          {isLast ? "完了する" : "この時期はスキップ →"}
        </button>
      </div>

      {/* jump back */}
      {index > 0 && (
        <button
          type="button"
          onClick={() => goToStage(index - 1)}
          className="text-[11px] tracking-[0.25em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
        >
          ← ひとつ前の時期へ
        </button>
      )}
    </div>
  );
}
