"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GuidedDerivation } from "@/components/GuidedDerivation";
import {
  CREED_QUESTIONS,
  VISION_QUESTIONS,
  mirroredValues,
  synthesizeCreed,
  synthesizeVision,
  type GuidedAnswer,
  type GuidedQuestion,
} from "@/lib/coach/guided";
import { useAppState } from "@/lib/storage";
import { APP_NAME_JA } from "@/lib/constants";

type Step =
  | "welcome"
  | "philosophy"
  | "philosophy_done"
  | "vision"
  | "vision_done"
  | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const { state, loaded, setPyramid } = useAppState();
  const [step, setStep] = useState<Step>("welcome");

  // 再訪時：理念が済んでいればビジョンから、両方済みなら完了から再開する。
  const resumed = useRef(false);
  useEffect(() => {
    if (!loaded || resumed.current) return;
    resumed.current = true;
    const p1 = state.pyramid[1]?.content?.trim();
    const p2 = state.pyramid[2]?.content?.trim();
    if (p1 && p2) setStep("complete");
    else if (p1) setStep("vision");
    // どちらも未入力なら welcome のまま
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  if (!loaded) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-32 text-center text-[var(--color-fg-faint)] text-sm tracking-widest">
        LOADING…
      </div>
    );
  }

  // ----------------------------------------------------------
  // Step navigation helpers
  // ----------------------------------------------------------
  function start() {
    setStep("philosophy");
  }

  function handlePhilosophyApply(draft: string) {
    setPyramid(1, draft);
    setStep("philosophy_done");
  }

  function moveToVision() {
    setStep("vision");
  }

  function handleVisionApply(draft: string) {
    setPyramid(2, draft);
    setStep("vision_done");
  }

  function finish() {
    setStep("complete");
  }

  function skipOnboarding() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("hokushin:onboardingSkipped", "1");
    }
    router.push("/");
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10 min-h-[calc(100vh-4rem)] flex items-center justify-center">

      {/* Welcome */}
      {step === "welcome" && (
        <div className="text-center py-16">
          <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
            ★ &nbsp; WELCOME&nbsp;TO
          </div>
          <h1 className="serif text-6xl md:text-7xl text-[var(--color-ink)] leading-[1.1] mb-3">
            {APP_NAME_JA}
          </h1>
          <div className="text-[10px] tracking-[0.4em] text-[var(--color-fg-faint)] mb-2">
            HOKUSHIN
          </div>
          <div className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)] mb-10">
            ＝ 北極星
          </div>
          <p className="serif text-lg md:text-xl text-[var(--color-ink)] leading-relaxed mb-3 max-w-xl mx-auto">
            あなたの北辰（人生の北極星）を、ここから一緒に見つけていきます。
          </p>
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed max-w-md mx-auto mb-12">
            むずかしいことは聞きません。
            <br />
            やさしい質問に答えていくと、人生理念とビジョンが見えてきます。
          </p>
          <button
            onClick={start}
            className="inline-flex items-center gap-3 bg-[var(--color-ink)] text-white px-10 py-4 text-sm tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
          >
            <span className="text-[var(--color-gold)]">★</span>
            はじめる
          </button>
          <div className="mt-10 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
            所要時間：約 5 分
          </div>
          <button
            onClick={skipOnboarding}
            className="block mx-auto mt-6 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] hover:text-[var(--color-fg-mute)] transition"
          >
            あとで設定する →
          </button>
        </div>
      )}

      {/* Philosophy in progress / done */}
      {(step === "philosophy" || step === "philosophy_done") && (
        <div className="w-full py-16">
          <StepProgress current={1} total={2} />
          <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mt-12 mb-4">
            ★ &nbsp; FOUNDATION
          </div>
          <h2 className="serif text-4xl md:text-5xl text-[var(--color-ink)] leading-[1.15] mb-3">
            人生理念
          </h2>
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-8 max-w-xl">
            ピラミッドのいちばん底にある、動かぬ核となる価値観です。
            易しい質問に答えていくうちに、自分でも気づかなかった「大事にしていること」が見えてきます。
          </p>

          {step === "philosophy_done" && state.pyramid[1]?.content && (
            <div className="bg-[var(--color-paper-soft)] border border-[var(--color-line)] p-6 mb-8">
              <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
                ✓ &nbsp; あなたの人生理念は、こんな形になりました
              </div>
              <div className="serif text-lg text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap mb-5">
                {state.pyramid[1].content}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={moveToVision}
                  className="bg-[var(--color-ink)] text-white px-6 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
                >
                  次へ ・ ビジョンを描く →
                </button>
                <button
                  onClick={() => setStep("philosophy")}
                  className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
                >
                  ↻ もう一度やり直す
                </button>
              </div>
            </div>
          )}

          {step === "philosophy" && (
            <PhilosophyOrVisionInput
              guidedConfig={{
                questions: CREED_QUESTIONS,
                synthesize: synthesizeCreed,
                mirror: mirroredValues,
                doneLabel: "これを人生理念にする",
                draftHeader: "あなたの答えから、こんな理念が見えてきました",
                ctaSub: "7つの易しい質問に答えるだけ",
                progressKey: "creed",
              }}
              onApply={handlePhilosophyApply}
              placeholder="あなたが人生で大切にしている価値観を、一段落で書く…"
            />
          )}
        </div>
      )}

      {/* Vision in progress / done */}
      {(step === "vision" || step === "vision_done") && (
        <div className="w-full py-16">
          <StepProgress current={2} total={2} />
          <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mt-12 mb-4">
            ★ &nbsp; VISION
          </div>
          <h2 className="serif text-4xl md:text-5xl text-[var(--color-ink)] leading-[1.15] mb-3">
            人生のビジョン
          </h2>
          <p className="text-sm text-[var(--color-fg-mute)] leading-relaxed mb-8 max-w-xl">
            理念を踏まえて、5 年後の自分が望んでいる景色を描きます。
            さきほど書いた人生理念を見つめながら、言葉にしていきましょう。
          </p>

          {state.pyramid[1]?.content && (
            <div className="border-l-2 border-[var(--color-gold)] pl-4 mb-8">
              <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-1">
                あなたの人生理念
              </div>
              <div className="text-sm text-[var(--color-fg-mute)] leading-relaxed whitespace-pre-wrap">
                {state.pyramid[1].content}
              </div>
            </div>
          )}

          {step === "vision_done" && state.pyramid[2]?.content && (
            <div className="bg-[var(--color-paper-soft)] border border-[var(--color-line)] p-6 mb-8">
              <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)] mb-3">
                ✓ &nbsp; あなたの人生のビジョンは、こんな形になりました
              </div>
              <div className="serif text-lg text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap mb-5">
                {state.pyramid[2].content}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={finish}
                  className="bg-[var(--color-ink)] text-white px-6 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
                >
                  次へ ・ 完了 →
                </button>
                <button
                  onClick={() => setStep("vision")}
                  className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition"
                >
                  ↻ もう一度書き直す
                </button>
              </div>
            </div>
          )}

          {step === "vision" && (
            <PhilosophyOrVisionInput
              guidedConfig={{
                questions: VISION_QUESTIONS,
                synthesize: synthesizeVision,
                doneLabel: "これを人生のビジョンにする",
                draftHeader: "あなたの答えから、こんなビジョンが見えてきました",
                ctaSub: "5つの質問で5年後を描く",
                progressKey: "vision",
              }}
              onApply={handleVisionApply}
              placeholder="5 年後に望んでいる景色を、一段落で書く…"
            />
          )}
        </div>
      )}

      {/* Complete */}
      {step === "complete" && (
        <div className="text-center py-16">
          <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
            ★ &nbsp; FOUNDATION&nbsp;SET
          </div>
          <h2 className="serif text-5xl md:text-6xl text-[var(--color-ink)] leading-[1.1] mb-6">
            土台と方角が
            <br />
            決まりました。
          </h2>
          <p className="serif text-base text-[var(--color-fg-mute)] leading-loose mb-12 max-w-md mx-auto">
            ここからは、ビジョンを<span className="text-[var(--color-ink)]">七つの分野</span>に
            落とし込みます。
            <br />
            <span className="text-[var(--color-ink)]">長期 → 中期 → 短期 → 今日のタスク</span>
            の順に降ろしていきましょう。
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => router.push("/fields")}
              className="inline-flex items-center gap-3 bg-[var(--color-ink)] text-white px-8 py-3.5 text-sm tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
            >
              <span className="text-[var(--color-gold)]">→</span>
              七つの分野へ
            </button>
            <Link
              href="/"
              className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] transition px-4 py-3"
            >
              ダッシュボードへ
            </Link>
          </div>

          <div className="mt-14 pt-8 hairline-top max-w-md mx-auto">
            <div className="text-[10px] tracking-[0.35em] text-[var(--color-fg-faint)] mb-4">
              もっと自分を深掘りするなら（あとでもOK）
            </div>
            <div className="flex items-center justify-center gap-5 text-xs tracking-[0.2em]">
              <Link href="/mandala" className="text-[var(--color-ink)] hover:text-[var(--color-gold)] transition">
                マンダラ
              </Link>
              <span className="text-[var(--color-line)]">/</span>
              <Link href="/list-100" className="text-[var(--color-ink)] hover:text-[var(--color-gold)] transition">
                100のリスト
              </Link>
              <span className="text-[var(--color-line)]">/</span>
              <Link href="/history" className="text-[var(--color-ink)] hover:text-[var(--color-gold)] transition">
                100年史
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

interface GuidedConfig {
  questions: GuidedQuestion[];
  synthesize: (a: GuidedAnswer[]) => string;
  mirror?: (a: GuidedAnswer[]) => string[];
  doneLabel: string;
  draftHeader: string;
  ctaSub: string;
  progressKey: string;
}

function PhilosophyOrVisionInput({
  guidedConfig,
  onApply,
  placeholder,
}: {
  guidedConfig?: GuidedConfig;
  onApply: (text: string) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [showGuided, setShowGuided] = useState(false);

  // 台本式（無料）の導き出しを開いている間は、それだけを表示
  if (guidedConfig && showGuided) {
    return (
      <GuidedDerivation
        questions={guidedConfig.questions}
        synthesize={guidedConfig.synthesize}
        mirror={guidedConfig.mirror}
        onApply={onApply}
        onCancel={() => setShowGuided(false)}
        doneLabel={guidedConfig.doneLabel}
        draftHeader={guidedConfig.draftHeader}
        progressKey={guidedConfig.progressKey}
      />
    );
  }

  return (
    <div className="space-y-5">
      {guidedConfig && (
        <button
          onClick={() => setShowGuided(true)}
          className="block w-full text-left bg-[var(--color-ink)] text-white px-6 py-4 hover:bg-[var(--color-ink-soft)] transition"
        >
          <span className="text-[var(--color-gold)] mr-2">★</span>
          <span className="text-sm tracking-[0.15em]">質問に答えて見つける</span>
          <span className="block text-[10px] tracking-[0.25em] text-white/60 mt-1">
            {guidedConfig.ctaSub}
          </span>
        </button>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-[var(--color-line)]" />
        <span className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
          {guidedConfig ? "または" : ""}
        </span>
        <div className="flex-1 h-px bg-[var(--color-line)]" />
      </div>

      <div>
        <div className="text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)] mb-2">
          自分で直接書く
        </div>
        <textarea
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-[var(--color-line)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-y"
        />
        <div className="mt-3">
          <button
            onClick={() => text.trim() && onApply(text.trim())}
            disabled={!text.trim()}
            className="bg-[var(--color-ink)] text-white px-6 py-2.5 text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            これで決定 →
          </button>
        </div>
      </div>
    </div>
  );
}


function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3 text-[10px] tracking-[0.3em] text-[var(--color-fg-faint)]">
      <span>STEP &nbsp; {String(current).padStart(2, "0")} &nbsp;/&nbsp; {String(total).padStart(2, "0")}</span>
      <div className="flex-1 h-px bg-[var(--color-line)] relative">
        <div
          className="absolute inset-y-0 left-0 bg-[var(--color-ink)]"
          style={{ width: `${(current / total) * 100}%`, top: -1, height: 3 }}
        />
      </div>
    </div>
  );
}
