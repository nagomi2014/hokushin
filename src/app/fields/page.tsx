"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FIELDS, FIELD_MAP } from "@/lib/constants";
import { todayString, useAppState } from "@/lib/storage";
import { FieldHorizonGuide } from "@/components/FieldHorizonGuide";
import TaskScheduler from "@/components/TaskScheduler";
import { clearGuide, readGuide, writeGuide } from "@/lib/tools/guideProgress";
import { useTools } from "@/lib/tools/useTools";
import { activeFieldIds, fieldHasState } from "@/lib/fields";
import type { AppState, DailyTask, FieldId } from "@/lib/types";

const SEQ_KEY = "fields-seq";

export default function FieldsPage() {
  const { state, loaded, setField } = useAppState();
  const {
    horizonSpan,
    setHorizonSpan,
    selectedFields,
    setSelectedFields,
    toggleSelectedField,
    northStar,
    setNorthStar,
    recurringTasks,
    addRecurringTask,
    removeRecurringTask,
    loaded: toolsLoaded,
  } = useTools();
  const [coachFieldId, setCoachFieldId] = useState<FieldId | null>(null);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  // 一分野ずつ質問していく順番モード（null=通常表示、0〜=活性分野の番号）
  const [seqIndex, setSeqIndex] = useState<number | null>(null);
  const [seqDone, setSeqDone] = useState(false);
  const today = todayString();

  // 実際に画面へ出す分野（選択があればそれ、無ければ中身のある分野）
  const activeIds = useMemo(
    () => activeFieldIds(selectedFields, state.fields),
    [selectedFields, state.fields],
  );
  // 目標（状態）が一つでも書けているか＝「次の一歩」を出す条件
  const hasAnyGoal = useMemo(
    () => activeIds.some((id) => fieldHasState(state.fields[id])),
    [activeIds, state.fields],
  );

  function startSeq() {
    if (activeIds.length === 0) {
      setChooserOpen(true);
      return;
    }
    setSeqDone(false);
    const saved = Math.min(readGuide(SEQ_KEY, 0), activeIds.length - 1);
    setSeqIndex(saved);
  }

  // 順番モードの現在分野を、変わるたびに保存（閉じても続きから）。
  useEffect(() => {
    if (seqIndex !== null) writeGuide(SEQ_KEY, seqIndex);
  }, [seqIndex]);
  function advanceSeq() {
    if (seqIndex === null) return;
    if (seqIndex >= activeIds.length - 1) {
      clearGuide(SEQ_KEY);
      setSeqIndex(null);
      setSeqDone(true);
    } else {
      const n = seqIndex + 1;
      setSeqIndex(n);
      writeGuide(SEQ_KEY, n);
    }
  }

  if (!loaded || !toolsLoaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  // ===== 完了画面（順に立てる、を最後まで終えた直後）=====
  if (seqDone && seqIndex === null) {
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <section className="pt-24 pb-8 text-center">
          <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
            ★ &nbsp; DONE
          </div>
          <h1 className="serif text-4xl md:text-5xl text-[var(--color-ink)] leading-[1.15] mb-4">
            お疲れさまでした。
            <br />
            目標が書けました。
          </h1>
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed max-w-xl mx-auto">
            ここで書いたのは「どんな状態でいたいか」。
            <br />
            この目標は、書き直すたびに過去の版も残ります。
          </p>
        </section>
        <NextSteps />
        <div className="hairline-top mt-10 pt-8 pb-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSeqDone(false)}
            className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
          >
            ← 目標一覧を見る
          </button>
          <Link
            href="/"
            className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)]"
          >
            DASHBOARD →
          </Link>
        </div>
      </div>
    );
  }

  // ===== 順番モード（一分野ずつ質問）=====
  if (seqIndex !== null && activeIds[seqIndex]) {
    const field = FIELD_MAP[activeIds[seqIndex]];
    return (
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <section className="pt-20 pb-8 hairline-bottom">
          <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-5">
            <span>
              分野 {seqIndex + 1} / {activeIds.length}
            </span>
            <div className="flex-1 h-px bg-[var(--color-line)] relative">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
                style={{
                  width: `${((seqIndex + 1) / activeIds.length) * 100}%`,
                  top: -1,
                  height: 3,
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => setSeqIndex(null)}
              className="text-[var(--color-fg-faint)] hover:text-[var(--color-ink)]"
            >
              閉じる
            </button>
          </div>
          <div className="text-[10px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
            {field.nameEn}
          </div>
          <h1 className="serif text-4xl md:text-5xl text-[var(--color-ink)] leading-[1.1] mb-3">
            {field.nameJa}
          </h1>
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
            この分野の「1年後の目標」を、質問に答えて立てます。
          </p>
        </section>

        <section className="py-8">
          <FieldHorizonGuide
            key={field.id}
            fieldId={field.id}
            fieldName={field.nameJa}
            current={{
              longTerm: state.fields[field.id]?.longTerm ?? "",
              midTerm: state.fields[field.id]?.midTerm ?? "",
              shortTerm: state.fields[field.id]?.shortTerm ?? "",
            }}
            midYears={horizonSpan.mid}
            longYears={horizonSpan.long}
            onSet={(k, v) => setField(field.id, { [k]: v })}
            onDone={advanceSeq}
            onCancel={() => setSeqIndex(null)}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10">

      <section className="pt-12 pb-6 hairline-bottom">
        <div className="text-[10px] tracking-[0.45em] text-[var(--color-gold)] mb-2">
          ★ &nbsp; GOAL&nbsp;SETTING
        </div>
        <h1 className="serif text-2xl md:text-3xl text-[var(--color-ink)] leading-tight font-medium tracking-tight mb-2">
          目標設定
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm md:text-base tracking-wider max-w-2xl">
          <span className="text-[var(--color-ink)]">長期</span>
          <span className="text-[var(--color-gold)] mx-2">→</span>
          <span className="text-[var(--color-ink)]">中期</span>
          <span className="text-[var(--color-gold)] mx-2">→</span>
          <span className="text-[var(--color-ink)]">短期（今年末）</span>
          <span className="text-[var(--color-gold)] mx-2">→</span>
          <span className="text-[var(--color-ink)]">今日のタスク</span>
          へ、年ごとに降ろしていく。
        </p>
      </section>

      {/* 取り組む分野を選ぶ */}
      <FieldChooser
        open={chooserOpen || activeIds.length === 0}
        activeIds={activeIds}
        selectedFields={selectedFields}
        onToggle={toggleSelectedField}
        onPreset={(ids) => setSelectedFields(ids)}
        onToggleOpen={() => setChooserOpen((v) => !v)}
      />

      <section className="py-8 hairline-bottom">
        <button
          type="button"
          onClick={startSeq}
          className="block w-full text-left bg-[var(--color-ink)] text-white px-6 py-4 hover:bg-[var(--color-ink-soft)] transition"
        >
          <span className="text-[var(--color-gold)] mr-2">★</span>
          <span className="text-sm tracking-[0.15em]">
            {activeIds.length > 0
              ? `質問に沿って、${activeIds.length}つの分野を順に立てる`
              : "まず、取り組む分野を選ぶ"}
          </span>
          <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
            一つの分野ずつ、質問に答えるだけ。途中で閉じても続きから
          </span>
        </button>
      </section>

      {/* 目標の区切り設定（毎年 12/31 〆） */}
      <section className="py-6 hairline-bottom">
        <div className="text-[10px] tracking-[0.35em] text-[var(--color-fg-faint)] mb-3">
          目標の区切り（毎年 12 / 31 〆）
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-[var(--color-ink)]">
          <span>
            短期 ＝ 今年末
            <span className="text-[var(--color-fg-faint)] ml-1">
              （{new Date().getFullYear()}）
            </span>
          </span>
          <span className="text-[var(--color-line)]">/</span>
          <span className="flex items-center gap-2">
            中期 ＝
            <Stepper
              value={horizonSpan.mid}
              onChange={(n) => setHorizonSpan({ mid: n })}
            />
            年後
            <span className="text-[var(--color-fg-faint)]">
              （{new Date().getFullYear() + horizonSpan.mid}）
            </span>
          </span>
          <span className="text-[var(--color-line)]">/</span>
          <span className="flex items-center gap-2">
            長期 ＝
            <Stepper
              value={horizonSpan.long}
              onChange={(n) => setHorizonSpan({ long: n })}
            />
            年後
            <span className="text-[var(--color-fg-faint)]">
              （{new Date().getFullYear() + horizonSpan.long}）
            </span>
          </span>
        </div>
      </section>

      <ExplorationMaterial
        state={state}
        open={materialOpen}
        onToggle={() => setMaterialOpen((v) => !v)}
      />

      <section className="py-8 space-y-16">
        {activeIds.length === 0 && (
          <div className="py-16 text-center text-sm text-[var(--color-fg-faint)]">
            まだ取り組む分野が選ばれていません。
            <br />
            上の「取り組む分野を選ぶ」から、まずは1つでも選んでみてください。
          </div>
        )}
        {activeIds.map((fid) => {
          const field = FIELD_MAP[fid];
          const goal = state.fields[field.id];
          const todayTasks = state.dailyTasks.filter(
            (t) => t.date === today && t.fieldId === field.id,
          );
          return (
            <div
              key={field.id}
              id={`field-${field.id}`}
              className="scroll-mt-24"
            >
              {/* Field header */}
              <div className="flex items-baseline justify-between hairline-bottom pb-3 mb-6 gap-3 flex-wrap">
                <div className="flex items-baseline gap-5">
                  <span className="serif text-3xl text-[var(--color-fg-faint)]">
                    {field.number}
                  </span>
                  <h2 className="serif text-2xl text-[var(--color-ink)]">
                    {field.nameJa}
                  </h2>
                  <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                    {field.nameEn}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => setCoachFieldId(field.id)}
                    className="text-[10px] tracking-[0.3em] text-[var(--color-gold)] hover:text-[var(--color-ink)] transition"
                  >
                    ★ 質問で目標を作る
                  </button>
                  <span className="w-px h-4 bg-[var(--color-line)]" />
                  <span className="text-[var(--color-fg-mute)] tracking-widest">
                    PROGRESS
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={goal?.progress ?? 0}
                    onChange={(e) =>
                      setField(field.id, {
                        progress: Math.max(
                          0,
                          Math.min(100, Number(e.target.value) || 0),
                        ),
                      })
                    }
                    className="w-16 text-right border border-[var(--color-line)] px-2 py-1 serif text-base text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
                  />
                  <span className="serif text-[var(--color-fg-faint)] text-xs">
                    %
                  </span>
                </div>
              </div>

              {/* 4-column flow: 長期 → 中期 → 短期 → 今日のタスク */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <FieldTermInput
                  label="長期目標"
                  caption="5 年 以上"
                  arrow
                  value={goal?.longTerm ?? ""}
                  onChange={(v) => setField(field.id, { longTerm: v })}
                  dashboardActive={northStar.long.fieldId === field.id}
                  onToggleDashboard={() =>
                    setNorthStar("long", {
                      fieldId:
                        northStar.long.fieldId === field.id ? undefined : field.id,
                    })
                  }
                />
                <FieldTermInput
                  label="中期目標"
                  caption="1 〜 5 年"
                  arrow
                  value={goal?.midTerm ?? ""}
                  onChange={(v) => setField(field.id, { midTerm: v })}
                  dashboardActive={northStar.mid.fieldId === field.id}
                  onToggleDashboard={() =>
                    setNorthStar("mid", {
                      fieldId:
                        northStar.mid.fieldId === field.id ? undefined : field.id,
                    })
                  }
                />
                <FieldTermInput
                  label="短期目標"
                  caption="1 年以内"
                  arrow
                  value={goal?.shortTerm ?? ""}
                  onChange={(v) => setField(field.id, { shortTerm: v })}
                  dashboardActive={northStar.short.fieldId === field.id}
                  onToggleDashboard={() =>
                    setNorthStar("short", {
                      fieldId:
                        northStar.short.fieldId === field.id ? undefined : field.id,
                    })
                  }
                />
                <TodayTasksColumn tasks={todayTasks} />
              </div>

              {/* Progress bar visual */}
              <div className="mt-6 flex items-center gap-3 text-xs">
                <div className="flex-1 h-px bg-[var(--color-line)] relative">
                  <div
                    className="absolute h-px bg-[var(--color-ink)] top-0"
                    style={{ width: `${goal?.progress ?? 0}%` }}
                  />
                </div>
                <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
                  {goal?.updatedAt
                    ? `UPDATED · ${goal.updatedAt.slice(0, 10)}`
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* タスクを作る（曜日・毎月N日・特定日付 → 本日のタスクに自動反映） */}
      <TaskScheduler
        recurringTasks={recurringTasks}
        onAdd={addRecurringTask}
        onRemove={removeRecurringTask}
      />

      {hasAnyGoal && <NextSteps />}

      <div className="hairline-top mt-8 pt-8 pb-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          AUTO-SAVED · LOCAL
        </span>
      </div>

      {coachFieldId !== null && (
        <>
          <div
            className="fixed inset-0 bg-[var(--color-ink)]/30 z-50"
            onClick={() => setCoachFieldId(null)}
            aria-hidden
          />
          <aside className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-50 shadow-2xl flex flex-col">
            <div className="hairline-bottom px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[9px] tracking-[0.4em] text-[var(--color-gold)] mb-1">
                  ★ &nbsp; 質問で目標を作る
                </div>
                <div className="serif text-base text-[var(--color-ink)]">
                  {FIELDS.find((f) => f.id === coachFieldId)?.nameJa} の目標
                </div>
              </div>
              <button
                onClick={() => setCoachFieldId(null)}
                className="text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] text-xl leading-none px-2"
                aria-label="close"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <FieldHorizonGuide
                key={coachFieldId}
                fieldId={coachFieldId}
                fieldName={
                  FIELDS.find((f) => f.id === coachFieldId)?.nameJa ?? ""
                }
                current={{
                  longTerm: state.fields[coachFieldId]?.longTerm ?? "",
                  midTerm: state.fields[coachFieldId]?.midTerm ?? "",
                  shortTerm: state.fields[coachFieldId]?.shortTerm ?? "",
                }}
                midYears={horizonSpan.mid}
                longYears={horizonSpan.long}
                onSet={(k, v) => setField(coachFieldId, { [k]: v })}
                onDone={() => setCoachFieldId(null)}
                onCancel={() => setCoachFieldId(null)}
              />
            </div>
          </aside>
        </>
      )}

    </div>
  );
}

// 目標（状態）を書き終えた人への「次の一歩」案内。
function NextSteps() {
  const steps: { no: string; title: string; en: string; href: string; desc: string }[] = [
    {
      no: "01",
      title: "近づく一手を決める",
      en: "QUADRANT II",
      href: "/prime",
      desc: "その“ありたい状態”に近づくために、重要だけど後回しにしていることを書き出す。",
    },
    {
      no: "02",
      title: "今月の一手にする",
      en: "MONTHLY",
      href: "/monthly",
      desc: "そのうち一つを「今月いちばん進める分野」に選び、今月の最重要目標にする。",
    },
    {
      no: "03",
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
      <h2 className="serif text-3xl text-[var(--color-ink)] mb-2">
        目標が書けたら、次は“やること”へ
      </h2>
      <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-8 max-w-2xl">
        ここで書いたのは「どんな状態でいたいか（目標）」。
        次は、その状態に近づくための“やること（行動）”を決めていきます。
        上から順にどうぞ。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-line)]">
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

// 取り組む分野を選ぶパネル。1つだけでも、全部でもOK。
function FieldChooser({
  open,
  activeIds,
  selectedFields,
  onToggle,
  onPreset,
  onToggleOpen,
}: {
  open: boolean;
  activeIds: FieldId[];
  selectedFields: number[];
  onToggle: (id: number) => void;
  onPreset: (ids: number[]) => void;
  onToggleOpen: () => void;
}) {
  const presets: { label: string; ids: number[] }[] = [
    { label: "シンプル3つ（仕事・家庭・健康）", ids: [4, 3, 1] },
    { label: "バランス5つ（＋学び・お金）", ids: [1, 3, 4, 5, 6] },
    { label: "7つすべて", ids: [1, 2, 3, 4, 5, 6, 7] },
  ];
  return (
    <section className="py-6 hairline-bottom">
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between group"
        aria-expanded={open}
      >
        <span className="flex items-baseline gap-3">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            FOCUS
          </span>
          <span className="serif text-lg text-[var(--color-ink)]">
            取り組む分野を選ぶ
          </span>
          <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
            {activeIds.length > 0 ? `${activeIds.length}つ` : "未選択"}
          </span>
        </span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-mute)] group-hover:text-[var(--color-ink)]">
          {open ? "閉じる −" : "選び直す ＋"}
        </span>
      </button>

      {open && (
        <div className="mt-5">
          <p className="text-xs text-[var(--color-fg-mute)] leading-relaxed mb-4">
            7つ全部やる必要はありません。今の自分に大事なものだけを選んでください。
            1つだけでも、3つでも、全部でもOK。あとから増やせます。
          </p>

          {/* 7つのチップ */}
          <div className="flex flex-wrap gap-2 mb-5">
            {FIELDS.map((f) => {
              const on = selectedFields.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onToggle(f.id)}
                  className={`text-xs border px-3 py-1.5 transition ${
                    on
                      ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                      : "border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-paper-soft)]"
                  }`}
                >
                  {on && <span className="text-[var(--color-gold)] mr-1">✓</span>}
                  {f.nameJa}
                </button>
              );
            })}
          </div>

          {/* おまかせプリセット */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] mr-1">
              おまかせ：
            </span>
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onPreset(p.ids)}
                className="text-[11px] border border-[var(--color-line)] text-[var(--color-fg-mute)] px-2.5 py-1 hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ① 知る（探索）の中身を、② 導き出す（七つの分野）の場に並べる蝶番パネル。
function ExplorationMaterial({
  state,
  open,
  onToggle,
}: {
  state: AppState;
  open: boolean;
  onToggle: () => void;
}) {
  const creed = state.pyramid[1]?.content?.trim() ?? "";
  const vision = state.pyramid[2]?.content?.trim() ?? "";
  const mandalaCenter = state.mandala.center.trim();
  const mandalaCells = state.mandala.cells.filter((c) => c.trim());
  const wishes = state.wishlist.filter((w) => w.text.trim());

  const hasAny =
    !!creed ||
    !!vision ||
    !!mandalaCenter ||
    mandalaCells.length > 0 ||
    wishes.length > 0;

  return (
    <section className="py-6 hairline-bottom">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between group"
        aria-expanded={open}
      >
        <span className="flex items-baseline gap-3">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            ① 知る → ② 導き出す
          </span>
          <span className="serif text-lg text-[var(--color-ink)]">
            探索の材料
          </span>
        </span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-mute)] group-hover:text-[var(--color-ink)]">
          {open ? "閉じる −" : "開く ＋"}
        </span>
      </button>

      {open && (
        <div className="mt-5">
          <p className="text-xs text-[var(--color-fg-mute)] leading-relaxed mb-5">
            あなたの深掘りを材料に、七つの分野の目標を導き出します。
          </p>

          {!hasAny ? (
            <div className="hairline-top hairline-bottom py-8 text-center text-sm text-[var(--color-fg-faint)]">
              まだ探索の材料がありません。
              <span className="block mt-3 flex items-center justify-center gap-4 text-[10px] tracking-[0.25em]">
                <Link href="/pyramid" className="text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5">
                  ピラミッド →
                </Link>
                <Link href="/mandala" className="text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5">
                  マンダラ →
                </Link>
                <Link href="/list-100" className="text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5">
                  100のリスト →
                </Link>
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-line)]">
              <MaterialCard title="人生理念" href="/pyramid" en="CREED">
                {creed ? (
                  <p className="serif text-sm text-[var(--color-ink)] leading-relaxed">
                    {creed}
                  </p>
                ) : (
                  <EmptyHint href="/pyramid" label="ピラミッドで書く" />
                )}
              </MaterialCard>

              <MaterialCard title="人生のビジョン" href="/pyramid" en="VISION">
                {vision ? (
                  <p className="serif text-sm text-[var(--color-ink)] leading-relaxed">
                    {vision}
                  </p>
                ) : (
                  <EmptyHint href="/pyramid" label="ピラミッドで書く" />
                )}
              </MaterialCard>

              <MaterialCard title="マンダラ" href="/mandala" en="MANDALA">
                {mandalaCenter || mandalaCells.length > 0 ? (
                  <div className="text-sm text-[var(--color-ink)]">
                    {mandalaCenter && (
                      <div className="serif mb-2 text-[var(--color-gold)]">
                        {mandalaCenter}
                      </div>
                    )}
                    {mandalaCells.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mandalaCells.slice(0, 8).map((c, i) => (
                          <span
                            key={i}
                            className="text-[11px] px-2 py-0.5 border border-[var(--color-line)] text-[var(--color-fg-mute)]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <EmptyHint href="/mandala" label="マンダラを書く" />
                )}
              </MaterialCard>

              <MaterialCard title="100のリスト" href="/list-100" en="LIST 100">
                {wishes.length > 0 ? (
                  <ul className="text-sm text-[var(--color-ink)] space-y-1">
                    {wishes.slice(0, 5).map((w) => (
                      <li key={w.id} className="flex items-baseline gap-2">
                        <span className="text-[var(--color-gold)] text-[10px]">
                          ・
                        </span>
                        <span className="truncate">{w.text}</span>
                      </li>
                    ))}
                    {wishes.length > 5 && (
                      <li className="text-[10px] text-[var(--color-fg-faint)] pl-4">
                        …他 {wishes.length - 5} 件
                      </li>
                    )}
                  </ul>
                ) : (
                  <EmptyHint href="/list-100" label="やりたいことを書く" />
                )}
              </MaterialCard>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function MaterialCard({
  title,
  en,
  href,
  children,
}: {
  title: string;
  en: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-baseline justify-between mb-3">
        <span className="serif text-sm text-[var(--color-ink)]">{title}</span>
        <Link
          href={href}
          className="text-[9px] tracking-[0.3em] text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
        >
          {en} →
        </Link>
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-[11px] text-[var(--color-fg-faint)] italic hover:text-[var(--color-ink)] transition"
    >
      {label} →
    </Link>
  );
}

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <span className="inline-flex items-center border border-[var(--color-line)]">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        className="px-2 py-0.5 text-[var(--color-fg-mute)] hover:bg-[var(--color-paper-soft)] hover:text-[var(--color-ink)] transition"
        aria-label="減らす"
      >
        −
      </button>
      <span className="px-2 serif text-sm text-[var(--color-ink)] min-w-[1.5rem] text-center">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="px-2 py-0.5 text-[var(--color-fg-mute)] hover:bg-[var(--color-paper-soft)] hover:text-[var(--color-ink)] transition"
        aria-label="増やす"
      >
        ＋
      </button>
    </span>
  );
}

function FieldTermInput({
  label,
  caption,
  value,
  onChange,
  arrow = false,
  dashboardActive = false,
  onToggleDashboard,
}: {
  label: string;
  caption: string;
  value: string;
  onChange: (v: string) => void;
  arrow?: boolean;
  dashboardActive?: boolean;
  onToggleDashboard?: () => void;
}) {
  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-2">
        <span className="serif text-sm text-[var(--color-ink)]">{label}</span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          {caption}
        </span>
      </div>
      {onToggleDashboard && (
        <button
          type="button"
          onClick={onToggleDashboard}
          className={`mb-2 inline-flex items-center gap-1 text-[10px] tracking-[0.15em] px-2 py-1 border transition ${
            dashboardActive
              ? "border-[var(--color-gold)] text-[var(--color-gold)]"
              : "border-[var(--color-line)] text-[var(--color-fg-faint)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]"
          }`}
          title="ダッシュボードの「私の北極星」に表示する"
        >
          {dashboardActive ? "★ 北極星に表示中" : "☆ 北極星に入れる"}
        </button>
      )}
      <textarea
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="目標を書く…"
        className="w-full border border-[var(--color-line)] bg-white px-3 py-2 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
      />
      {arrow && (
        <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 text-[var(--color-gold)] text-lg z-10 pointer-events-none">
          →
        </div>
      )}
    </div>
  );
}

function TodayTasksColumn({ tasks }: { tasks: DailyTask[] }) {
  const done = tasks.filter((t) => t.completed).length;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="serif text-sm text-[var(--color-gold)]">今日のタスク</span>
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          NOW
        </span>
      </div>
      <div className="border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2 min-h-[7.5rem] text-sm">
        {tasks.length === 0 ? (
          <div className="text-[11px] text-[var(--color-fg-faint)] italic">
            この分野のタスクはまだありません。
            <Link
              href="/daily"
              className="block mt-2 text-[10px] tracking-[0.25em] text-[var(--color-ink)] not-italic border-b border-[var(--color-ink)] pb-0.5 inline-block"
            >
              ＋ 追加する
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-1.5 mb-2">
              {tasks.slice(0, 4).map((t) => (
                <li
                  key={t.id}
                  className={`text-[12px] flex items-center gap-2 ${
                    t.completed
                      ? "line-through text-[var(--color-fg-faint)]"
                      : "text-[var(--color-ink)]"
                  }`}
                >
                  <span className="text-[var(--color-gold)] text-[10px]">
                    {t.completed ? "✓" : "□"}
                  </span>
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
              {tasks.length > 4 && (
                <li className="text-[10px] text-[var(--color-fg-faint)] pl-4">
                  …他 {tasks.length - 4} 件
                </li>
              )}
            </ul>
            <div className="flex items-center justify-between text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] hairline-top pt-1.5">
              <span>
                {done} / {tasks.length}
              </span>
              <Link
                href="/daily"
                className="text-[var(--color-ink)] hover:text-[var(--color-gold)] transition"
              >
                → 本日の行
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
