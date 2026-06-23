"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  FIELDS,
  FIELD_MAP,
  PYRAMID_TIERS,
  PYRAMID_WIDTHS,
} from "@/lib/constants";
import { activeFieldIds } from "@/lib/fields";
import {
  currentYearMonth,
  daysInMonth,
  monthMoment,
  todayString,
  useAppState,
} from "@/lib/storage";
import { useTools } from "@/lib/tools/useTools";
import { useRevisions } from "@/lib/tools/useRevisions";
import type { AppState, MonthlyPlan } from "@/lib/types";

// ------------------------------------------------------------
// Next-step suggester
// ------------------------------------------------------------
interface NextStep {
  kind: "onboarding" | "field" | "monthly" | "daily" | "done";
  label: string;
  caption: string;
  href: string;
}

function getNextStep(state: AppState, year: number, month: number): NextStep {
  // 1. Onboarding: 人生理念 or 人生のビジョンが未入力なら、対話で書く
  const p1 = state.pyramid[1]?.content?.trim();
  const p2 = state.pyramid[2]?.content?.trim();
  if (!p1) {
    return {
      kind: "onboarding",
      label: "はじめに ・ あなたの北極星を見つける",
      caption:
        "コーチと対話しながら、ピラミッドの土台『人生理念』と『人生のビジョン』を書き上げます。所要 5〜10 分。",
      href: "/onboarding",
    };
  }
  if (!p2) {
    return {
      kind: "onboarding",
      label: "次へ ・ 人生のビジョンを描く",
      caption:
        "人生理念が整いました。続けて、5 年後に望んでいる景色をコーチと言葉にしていきます。",
      href: "/onboarding",
    };
  }
  // 2. Fields: short-term unset
  for (const f of FIELDS) {
    if (!state.fields[f.id]?.shortTerm?.trim()) {
      return {
        kind: "field",
        label: `${f.nameJa} の短期目標を立てる`,
        caption:
          "土台と方角が整いました。ビジョンを 7 分野に落とし込みます（長期 → 中期 → 短期）。",
        href: `/fields#field-${f.id}`,
      };
    }
  }
  // 3. Monthly plan
  const monthly = state.monthlyPlans.find(
    (p) => p.year === year && p.month === month,
  );
  if (!monthly?.primaryGoal?.trim()) {
    return {
      kind: "monthly",
      label: `${month} 月の最重要目標を立てる`,
      caption:
        "目標を月単位に砕いて、今月の一手を決めます。コーチに相談しながらでも OK。",
      href: "/monthly",
    };
  }
  // 4. Today's task
  const todayStr = todayString();
  if (!state.dailyTasks.some((t) => t.date === todayStr)) {
    return {
      kind: "daily",
      label: "今日のタスクを 1 つ書く",
      caption: "月の計画を今日この瞬間のアクションに落とします。",
      href: "/daily",
    };
  }
  return {
    kind: "done",
    label: "今日の一手を実行する",
    caption: "土台から実践まで整いました。あとは動くだけ。",
    href: "/daily",
  };
}

const WEEKDAYS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatDateDot(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { state, loaded, toggleDailyTask } = useAppState();

  // First visit: redirect to onboarding if 壱 (人生理念) is empty.
  // Skip if the user has explicitly chosen "あとで設定する" once.
  useEffect(() => {
    if (!loaded) return;
    if (state.pyramid[1]?.content?.trim()) return;
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem("hokushin:onboardingSkipped") === "1"
    ) {
      return;
    }
    router.replace("/onboarding");
  }, [loaded, state.pyramid, router]);

  const today = useMemo(() => new Date(), []);
  const todayStr = todayString();
  const ym = currentYearMonth();
  const totalDays = daysInMonth(ym.year, ym.month);
  const dayOfMonth = today.getDate();
  const monthlyPct = Math.round((dayOfMonth / totalDays) * 100);

  const todayTasks = state.dailyTasks.filter((t) => t.date === todayStr);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const monthlyPlan: MonthlyPlan | undefined = state.monthlyPlans.find(
    (p) => p.year === ym.year && p.month === ym.month,
  );
  const nextStep = useMemo(
    () => getNextStep(state, ym.year, ym.month),
    [state, ym.year, ym.month],
  );

  // 「そのほかの記録」用の充足数（実在ページのみ実値を出す）
  const mandalaFilled =
    (state.mandala.center.trim() ? 1 : 0) +
    state.mandala.cells.filter((c) => c.trim()).length;
  const wishlistCount = state.wishlist.length;
  const tools = useTools();
  const revisions = useRevisions();
  const dashboardFieldIds = useMemo(
    () => activeFieldIds(tools.selectedFields, state.fields),
    [tools.selectedFields, state.fields],
  );
  const moment = useMemo(() => monthMoment(), []);

  // 現在地（フェーズ）判定：探索（知る→導き出す）か、実践（動く）か。
  // onboarding/field を埋めている段階＝探索、monthly/daily/done＝実践。
  const phase: "explore" | "act" =
    nextStep.kind === "onboarding" || nextStep.kind === "field"
      ? "explore"
      : "act";

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10">

      {/* ===== Hero ===== */}
      <section className="pt-20 pb-16 hairline-bottom">
        <div className="grid grid-cols-12 gap-6 items-end">
          <div className="col-span-12 md:col-span-8">
            <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
              ★ &nbsp; YOUR&nbsp;NORTH&nbsp;STAR
            </div>
            <h1 className="serif text-5xl md:text-7xl text-[var(--color-ink)] leading-[1.05] font-medium tracking-tight">
              澄み切る、
              <br />
              一日を。
            </h1>
            <p className="text-[var(--color-fg-mute)] mt-6 text-sm tracking-wider">
              迷わぬ者は、北辰（北極星）を仰ぐ。
            </p>
          </div>
          <div className="col-span-12 md:col-span-4 md:text-right">
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-2">
              TODAY
            </div>
            <div className="serif text-3xl text-[var(--color-ink)]">
              {formatDateDot(today)}
            </div>
            <div className="text-xs text-[var(--color-fg-mute)] mt-1 tracking-widest">
              {WEEKDAYS_EN[today.getDay()]} · DAY {dayOfMonth} / {totalDays}
            </div>
            <div className="mt-6 inline-flex items-center gap-3 text-xs">
              <span className="text-[var(--color-fg-mute)] tracking-widest">
                MONTHLY
              </span>
              <div className="w-24 h-px bg-[var(--color-line)] relative">
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
                  style={{ width: `${monthlyPct}%`, top: -1, height: 3 }}
                />
              </div>
              <span className="serif text-[var(--color-ink)]">
                {monthlyPct}
                <span className="text-[var(--color-fg-faint)] text-xs">%</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 現在地 ＋ フローマップ（知る → 導き出す → 動く） ===== */}
      <section className="py-8 hairline-bottom">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)]">
              いま
            </span>
            <span
              className={`text-[11px] tracking-[0.25em] px-3 py-1 border ${
                phase === "explore"
                  ? "border-[var(--color-gold)] text-[var(--color-gold)]"
                  : "border-[var(--color-ink)] text-[var(--color-ink)]"
              }`}
            >
              {phase === "explore" ? "① 探索フェーズ" : "② 実践フェーズ"}
            </span>
            <span className="text-xs text-[var(--color-fg-mute)] hidden sm:inline">
              {phase === "explore"
                ? "自分を深掘りして、やるべきことを導き出す段階です。"
                : "導き出した目標を、日々の行動で見失わない段階です。"}
            </span>
          </div>

          <FlowMap phase={phase} />
        </div>
      </section>

      {/* ===== 月初/月末の合図 ===== */}
      {moment && (
        <section className="pt-8">
          <Link
            href="/monthly"
            className="group flex items-center justify-between gap-4 border-2 border-[var(--color-gold)] bg-[var(--color-paper-soft)] px-6 py-4 hover:bg-white transition"
          >
            <div>
              <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-1">
                ★ {moment === "start" ? "月のはじめ" : "月の終わり"}
              </div>
              <div className="serif text-lg text-[var(--color-ink)]">
                {moment === "start"
                  ? "今月の目標を立てましょう"
                  : "今月のふり返りを書きましょう"}
              </div>
            </div>
            <span className="text-[var(--color-gold)] text-2xl group-hover:translate-x-1 transition">
              →
            </span>
          </Link>
        </section>
      )}

      {/* ===== Next Step ===== */}
      <section className="py-10 hairline-bottom">
        <Link
          href={nextStep.href}
          className="group block bg-[var(--color-ink)] text-white p-6 md:p-8 hover:bg-[var(--color-ink-soft)] transition"
        >
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1">
              <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-3">
                ★&nbsp;&nbsp;{nextStep.kind === "done" ? "整いました" : "次の一手"}
              </div>
              <div className="serif text-2xl md:text-3xl text-white mb-2">
                {nextStep.label}
              </div>
              <div className="text-sm text-white/60 max-w-xl leading-relaxed">
                {nextStep.caption}
              </div>
            </div>
            <div className="text-[var(--color-gold)] text-3xl group-hover:translate-x-1 transition flex-shrink-0">
              →
            </div>
          </div>
        </Link>
      </section>

      {/* ===== 本日のタスク（動き出している人向けに上部へ） ===== */}
      {phase === "act" && (
        <section className="py-10 hairline-bottom">
          <div className="flex items-baseline justify-between mb-5">
            <div className="flex items-baseline gap-4">
              <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
                ★ TODAY
              </span>
              <h2 className="serif text-2xl text-[var(--color-ink)]">
                本日のタスク
              </h2>
            </div>
            <Link
              href="/daily"
              className="text-[10px] tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
            >
              日々へ →
            </Link>
          </div>
          {todayTasks.length === 0 ? (
            <Link
              href="/daily"
              className="block py-6 text-center text-sm text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] border border-[var(--color-line)] transition"
            >
              今日のタスクはまだありません。＋ 追加する →
            </Link>
          ) : (
            <div className="hairline-top">
              {todayTasks.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 py-3 hairline-bottom"
                >
                  <button
                    type="button"
                    onClick={() => toggleDailyTask(t.id)}
                    className={`check-box ${t.completed ? "checked" : ""}`}
                    aria-label="toggle"
                  >
                    {t.completed && <span className="text-[10px]">✓</span>}
                  </button>
                  <span
                    className={`text-sm flex-1 ${
                      t.completed
                        ? "line-through text-[var(--color-fg-faint)]"
                        : "text-[var(--color-ink)]"
                    }`}
                  >
                    {t.title}
                  </span>
                </div>
              ))}
              <div className="mt-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                {completedToday} / {todayTasks.length} 完了
              </div>
            </div>
          )}
        </section>
      )}

      {/* ===== Pyramid ===== */}
      <section className="py-16 hairline-bottom">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-3">
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
              全体像 ・ MAP
            </div>
            <h2 className="serif text-3xl text-[var(--color-ink)] mb-3">
              成功のピラミッド
            </h2>
            <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
              上3層が「知る・導き出す」、下2層が「動く」。
              <br />
              5つの階層が整うほど、毎日のやるべきことは澄み切ってゆく。
            </p>
            <Link
              href="/pyramid"
              className="inline-block mt-6 text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
            >
              編集する →
            </Link>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="flex flex-col items-center max-w-2xl mx-auto">
              {PYRAMID_TIERS.map((tier) => {
                const entry = state.pyramid[tier.level];
                const isFoundation = tier.level === 1;
                return (
                  <Link
                    key={tier.level}
                    href="/pyramid"
                    className="pyramid-tier"
                    style={{
                      width: PYRAMID_WIDTHS[tier.level],
                      background: tier.gradient,
                    }}
                    title={entry?.content || tier.description}
                  >
                    <span
                      className="tier-num"
                      style={
                        isFoundation
                          ? { color: "var(--color-gold)" }
                          : undefined
                      }
                    >
                      {tier.kanji}
                    </span>
                    <span className="tier-name">{tier.nameJa}</span>
                    <span
                      className="tier-en"
                      style={
                        isFoundation
                          ? { color: "var(--color-gold)" }
                          : undefined
                      }
                    >
                      {tier.nameEn}
                      {isFoundation && " ★"}
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-5 max-w-2xl mx-auto flex items-center justify-between text-[9px] tracking-[0.35em] text-[var(--color-fg-faint)] px-1">
              <span>BROADER &amp; DEEPER</span>
              <span className="text-[var(--color-gold)]">
                ↑ NARROWER &amp; HIGHER
              </span>
            </div>

            <div className="mt-8 max-w-2xl mx-auto hairline-top pt-5 text-center">
              <div className="text-[10px] tracking-[0.35em] text-[var(--color-fg-faint)] mb-2">
                ピラミッドの頂点「日々の実践」は、ここで現れる
              </div>
              <Link
                href="/daily"
                className="inline-flex items-center gap-2 text-xs tracking-[0.3em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
              >
                <span className="text-[var(--color-gold)]">↳</span>
                本日の行 へ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ① 知る（探索の道具） ===== */}
      <section className="py-16 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          ① 知る ・ EXPLORE
        </div>
        <h2 className="serif text-3xl text-[var(--color-ink)] mb-2">
          探索の道具
        </h2>
        <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-10">
          自分を深掘りするほど、やるべきことが見えてくる。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--color-line)]">
          <QuickItem
            label="マンダラ"
            value={mandalaFilled > 0 ? String(mandalaFilled) : "—"}
            caption="MANDALA"
            href="/mandala"
          />
          <QuickItem
            label="100のリスト"
            value={wishlistCount > 0 ? String(wishlistCount) : "—"}
            caption={`/ 100 ・ LIST`}
            href="/list-100"
          />
          <QuickItem
            label="100年史"
            value={tools.lifeEvents.length > 0 ? String(tools.lifeEvents.length) : "—"}
            caption="LIFE HISTORY"
            href="/history"
          />
        </div>
      </section>

      {/* ===== そのほかのツール（ととのえる） ===== */}
      <section className="py-16 hairline-bottom">
        <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
          ととのえる ・ TOOLS
        </div>
        <h2 className="serif text-3xl text-[var(--color-ink)] mb-2">
          お金と時間を整える
        </h2>
        <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-10">
          経済の足場と、重要だが緊急でない時間を、見える化する。書き直すたび過去の版も残る。
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--color-line)]">
          <QuickItem
            label="金の記録"
            value={tools.moneyEntries.length > 0 ? String(tools.moneyEntries.length) : "—"}
            caption="MONEY"
            href="/money"
          />
          <QuickItem
            label="第II領域"
            value={tools.primeItems.length > 0 ? String(tools.primeItems.length) : "—"}
            caption="QUADRANT II"
            href="/prime"
          />
          <QuickItem
            label="書き直しの記録"
            value={revisions.revisions.length > 0 ? String(revisions.revisions.length) : "—"}
            caption="REVISIONS"
            href="/revisions"
          />
        </div>
      </section>

      {/* ===== ② 導き出す（7 Fields） ===== */}
      <section className="py-16 hairline-bottom">
        <div className="grid grid-cols-12 gap-8 mb-4">
          <div className="col-span-12 md:col-span-3">
            <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
              ② 導き出す ・ DERIVE
            </div>
            <h2 className="serif text-3xl text-[var(--color-ink)] mb-3">
              目標設定
            </h2>
            <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed">
              探索から導き出された目標。
              <br />
              大事な分野ごとに、ありたい状態を描く。偏れば澱み、整えば澄む。
            </p>
            <Link
              href="/fields"
              className="inline-block mt-6 text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
            >
              編集する →
            </Link>
          </div>

          <div className="col-span-12 md:col-span-9">
            <div className="hairline-top">
              {dashboardFieldIds.length === 0 && (
                <Link
                  href="/fields"
                  className="block py-8 text-center text-sm text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition"
                >
                  取り組む分野を選ぶ →
                </Link>
              )}
              {dashboardFieldIds.map((fid) => {
                const field = FIELD_MAP[fid];
                const goal = state.fields[field.id];
                const placeholder = "目標を設定する →";
                const display = goal?.shortTerm || placeholder;
                return (
                  <Link
                    key={field.id}
                    href={`/fields#field-${field.id}`}
                    className="field-row grid grid-cols-12 items-center gap-4 py-5 hairline-bottom cursor-pointer"
                  >
                    <div className="col-span-1 field-num serif text-2xl text-[var(--color-fg-faint)]">
                      {field.number}
                    </div>
                    <div className="col-span-3 text-sm text-[var(--color-ink)] font-medium">
                      {field.nameJa}
                    </div>
                    <div
                      className={`col-span-5 text-sm ${
                        goal?.shortTerm
                          ? "text-[var(--color-fg-mute)]"
                          : "text-[var(--color-fg-faint)] italic"
                      }`}
                    >
                      {display}
                    </div>
                    <div className="col-span-2">
                      <div className="h-px bg-[var(--color-line)] relative">
                        <div
                          className="absolute h-px bg-[var(--color-ink)] top-0"
                          style={{ width: `${goal?.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right text-sm serif text-[var(--color-ink)]">
                      {goal?.progress ?? 0}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===== ③ 動く（Today + Monthly） ===== */}
      <section className="py-16 hairline-bottom">
        <div className="mb-10">
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-2">
            ③ 動く ・ ACT
          </div>
          <p className="text-sm text-[var(--color-fg-mute)]">
            導き出した目標を、今日この瞬間の行動へ。見失わない。
          </p>
        </div>
        <div className="grid grid-cols-12 gap-12">

          {/* Today */}
          <div className="col-span-12 lg:col-span-7">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="serif text-3xl text-[var(--color-ink)]">
                  本日の行
                </h2>
              </div>
              <Link
                href="/daily"
                className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
              >
                ＋ ADD
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              <div className="hairline-top hairline-bottom py-12 text-center text-sm text-[var(--color-fg-faint)]">
                今日のタスクはまだありません。
                <br />
                <Link
                  href="/daily"
                  className="inline-block mt-3 text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
                >
                  追加する →
                </Link>
              </div>
            ) : (
              <>
                <div className="hairline-top">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 py-4 hairline-bottom"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDailyTask(task.id)}
                        className={`check-box ${task.completed ? "checked" : ""}`}
                        aria-label="toggle"
                      >
                        {task.completed && <span className="text-[10px]">✓</span>}
                      </button>
                      <span
                        className={`text-sm flex-1 ${
                          task.completed
                            ? "line-through text-[var(--color-fg-faint)]"
                            : "text-[var(--color-ink)]"
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.fieldId != null && (
                        <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-mute)]">
                          {String(task.fieldId).padStart(2, "0")}{" "}
                          {FIELDS.find((f) => f.id === task.fieldId)?.nameJaShort}
                        </span>
                      )}
                      {task.startTime && (
                        <span className="text-[10px] tracking-[0.2em] text-[var(--color-fg-faint)]">
                          {task.startTime}
                          {task.endTime ? ` — ${task.endTime}` : " —"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-xs">
                  <span className="text-[var(--color-fg-mute)] tracking-widest">
                    COMPLETED &nbsp; {completedToday} / {todayTasks.length}
                  </span>
                  <span className="serif text-lg text-[var(--color-ink)]">
                    {todayTasks.length === 0
                      ? 0
                      : Math.round((completedToday / todayTasks.length) * 100)}
                    <span className="text-[var(--color-fg-faint)] text-xs ml-1">
                      %
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Monthly */}
          <div className="col-span-12 lg:col-span-5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="serif text-3xl text-[var(--color-ink)]">
                  {ym.month}月の計画
                </h2>
              </div>
              <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
                DAY {dayOfMonth} / {totalDays}
              </span>
            </div>

            {!monthlyPlan ? (
              <div className="hairline-top hairline-bottom py-12 text-center text-sm text-[var(--color-fg-faint)]">
                今月の計画はまだ設定されていません。
                <br />
                <Link
                  href="/monthly"
                  className="inline-block mt-3 text-xs tracking-[0.25em] text-[var(--color-ink)] border-b border-[var(--color-ink)] pb-0.5"
                >
                  設定する →
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="hairline-bottom pb-5">
                  <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
                    最重要目標
                  </div>
                  <div className="serif text-xl text-[var(--color-ink)] leading-snug">
                    {monthlyPlan.primaryGoal || "—"}
                  </div>
                </div>
                <div className="hairline-bottom pb-5">
                  <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
                    行動テーマ
                  </div>
                  <div className="text-sm text-[var(--color-ink)]">
                    {monthlyPlan.actionTheme || "—"}
                  </div>
                </div>
                {monthlyPlan.successPoints.length > 0 && (
                  <div className="hairline-bottom pb-5">
                    <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
                      達成のポイント
                    </div>
                    <ul className="text-sm text-[var(--color-ink)] space-y-1.5">
                      {monthlyPlan.successPoints.map((p, i) => (
                        <li key={i}>— {p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ===== Quote ===== */}
      <section className="py-24 text-center">
        <div className="serif text-2xl md:text-3xl text-[var(--color-ink)] leading-loose tracking-wider">
          己の<span className="text-[var(--color-gold)]">北辰</span>を仰ぐ者は、
          <br />
          道に迷うことなし。
        </div>
        <div className="mt-6 text-[10px] tracking-[0.35em] text-[var(--color-fg-faint)]">
          ※ 北辰（ほくしん）＝ 北極星。古来、夜空で動かない目印として航海・人生の道標とされてきた。
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="hairline-top py-10 flex items-center justify-between text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
        <span>
          <span className="text-[var(--color-gold)]">★</span> &nbsp; HOKUSHIN
        </span>
        <span>FIND YOUR NORTH STAR</span>
        <span>© 2026 HOKUSHIN</span>
      </footer>

    </div>
  );
}

function FlowMap({ phase }: { phase: "explore" | "act" }) {
  // 探索フェーズでは「知る」「導き出す」を強調、実践フェーズでは「動く」を強調
  const steps: { no: string; ja: string; en: string; active: boolean }[] = [
    { no: "①", ja: "知る", en: "EXPLORE", active: phase === "explore" },
    { no: "②", ja: "導き出す", en: "DERIVE", active: phase === "explore" },
    { no: "③", ja: "動く", en: "ACT", active: phase === "act" },
  ];
  return (
    <div className="flex items-stretch gap-2 sm:gap-3">
      {steps.map((s, i) => (
        <div key={s.no} className="flex items-stretch gap-2 sm:gap-3 flex-1">
          <div
            className={`flex-1 px-3 py-3 border text-center transition ${
              s.active
                ? "border-[var(--color-ink)] bg-[var(--color-paper-soft)]"
                : "border-[var(--color-line)] opacity-60"
            }`}
          >
            <div
              className={`serif text-base ${
                s.active
                  ? "text-[var(--color-ink)]"
                  : "text-[var(--color-fg-mute)]"
              }`}
            >
              <span className="text-[var(--color-gold)]">{s.no}</span> {s.ja}
            </div>
            <div className="text-[9px] tracking-[0.3em] text-[var(--color-fg-faint)] mt-1">
              {s.en}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex items-center text-[var(--color-fg-faint)] text-sm">
              →
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuickItem({
  label,
  value,
  caption,
  href,
  disabled = false,
}: {
  label: string;
  value: string;
  caption: string;
  href?: string;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <div className="serif text-[var(--color-fg-faint)] text-sm mb-12">
        {label}
      </div>
      <div className="num-display text-4xl text-[var(--color-ink)] group-hover:text-[var(--color-gold)] transition">
        {value}
      </div>
      <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mt-2">
        {caption}
      </div>
    </>
  );

  if (href && !disabled) {
    return (
      <Link
        href={href}
        className="block bg-white p-8 transition group hover:bg-[var(--color-paper-soft)] cursor-pointer"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`bg-white p-8 transition group ${
        disabled ? "opacity-60" : ""
      }`}
    >
      {inner}
    </div>
  );
}
