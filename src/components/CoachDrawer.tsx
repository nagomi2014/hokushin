"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCoachLabel,
  getCoachPrompt,
  type CoachContext,
} from "@/lib/coach/prompts";
import { useAppState } from "@/lib/storage";
import { PremiumGate } from "./PremiumGate";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CoachDrawerProps {
  open: boolean;
  onClose: () => void;
  context: CoachContext;
  onApply: (draftText: string) => void;
}

export function CoachDrawer({ open, onClose, context, onApply }: CoachDrawerProps) {
  const { state, loaded } = useAppState();
  const isPremium = loaded && state.userPlan === "premium";

  // If the user is on Free plan, show the premium gate instead of the coach.
  if (open && loaded && !isPremium) {
    return <PremiumGate open={open} onClose={onClose} feature="AI コーチ" />;
  }

  return (
    <CoachDrawerInner
      open={open}
      onClose={onClose}
      context={context}
      onApply={onApply}
    />
  );
}

function CoachDrawerInner({
  open,
  onClose,
  context,
  onApply,
}: CoachDrawerProps) {
  const prompt = getCoachPrompt(context);
  const label = getCoachLabel(context);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Reset when context changes or opens
  useEffect(() => {
    if (open) {
      setMessages([{ role: "assistant", content: prompt.opening }]);
      setDraft("");
      setStreaming("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(context)]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    bodyRef.current?.scrollTo({
      top: bodyRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  async function sendMessage(content: string, finalize = false) {
    if (busy) return;
    setError(null);
    setBusy(true);

    const nextMessages: Message[] = finalize
      ? messages
      : [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setStreaming("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          messages: nextMessages,
          finalize,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        acc += chunk;
        setStreaming(acc);
      }

      setMessages([...nextMessages, { role: "assistant", content: acc }]);
      setStreaming("");

      // Extract <draft>...</draft> if present
      const match = acc.match(/<draft>([\s\S]*?)<\/draft>/);
      if (match) setDraft(match[1].trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "通信に失敗しました");
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputRef.current?.value.trim();
    if (!text) return;
    if (inputRef.current) inputRef.current.value = "";
    sendMessage(text);
  }

  function handleFinalize() {
    sendMessage("", true);
  }

  function handleApply() {
    if (!draft) return;
    onApply(draft);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[var(--color-ink)]/30 z-50 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full w-full md:w-[480px] bg-white z-50 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="hairline-bottom px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[9px] tracking-[0.4em] text-[var(--color-gold)] mb-1">
              ★ &nbsp; AI&nbsp;COACH
            </div>
            <div className="serif text-base text-[var(--color-ink)]">{label}</div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-fg-mute)] hover:text-[var(--color-ink)] text-xl leading-none px-2"
            aria-label="close"
          >
            ×
          </button>
        </div>

        {/* Hint */}
        {prompt.hint && (
          <div className="px-6 py-3 bg-[var(--color-paper-soft)] hairline-bottom text-[11px] text-[var(--color-fg-mute)] leading-relaxed">
            {prompt.hint}
          </div>
        )}

        {/* Messages */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          {streaming && <MessageBubble role="assistant" content={streaming} streaming />}
          {error && error.includes("ANTHROPIC_API_KEY") ? (
            <ApiKeyMissingNotice onClose={onClose} />
          ) : error ? (
            <div className="text-xs text-red-600 border-l-2 border-red-600 pl-3 py-1">
              {error}
            </div>
          ) : null}
        </div>

        {/* Draft preview */}
        {draft && (
          <div className="hairline-top bg-[var(--color-paper-soft)] px-6 py-4">
            <div className="text-[9px] tracking-[0.4em] text-[var(--color-gold)] mb-2">
              DRAFT
            </div>
            <div className="serif text-sm text-[var(--color-ink)] leading-relaxed mb-3 whitespace-pre-wrap">
              {draft}
            </div>
            <button
              onClick={handleApply}
              className="w-full py-2 bg-[var(--color-ink)] text-white text-xs tracking-[0.3em] hover:bg-[var(--color-ink-soft)] transition"
            >
              ✓ &nbsp; このドラフトを採用する
            </button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="hairline-top px-6 py-4">
          <textarea
            ref={inputRef}
            rows={2}
            placeholder={busy ? "考え中…" : "返事を書く…"}
            disabled={busy}
            className="w-full border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition resize-none disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handleFinalize}
              disabled={busy || messages.length < 2}
              className="text-[10px] tracking-[0.25em] text-[var(--color-gold)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              ✎ ドラフトを書いてもらう
            </button>
            <button
              type="submit"
              disabled={busy}
              className="text-xs tracking-[0.3em] border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-1.5 hover:bg-[var(--color-ink)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              SEND
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

function ApiKeyMissingNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="bg-[var(--color-paper-soft)] border border-[var(--color-line)] p-5 space-y-4">
      <div className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
        ☆ &nbsp; AI コーチを使うには
      </div>
      <div className="serif text-sm text-[var(--color-ink)] leading-relaxed">
        コーチ機能は Anthropic（Claude）の API を使います。
        <br />
        まだキーが設定されていません。
      </div>
      <div className="text-xs text-[var(--color-fg-mute)] leading-relaxed space-y-2">
        <p>1. <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline text-[var(--color-ink)]">console.anthropic.com</a> でキーを発行</p>
        <p>2. プロジェクトルートの <code className="bg-[var(--color-line-soft)] px-1 rounded text-[10px]">hokushin/web/.env.local</code> に貼り付け</p>
        <p>3. 開発サーバーを再起動</p>
      </div>
      <div className="text-[10px] text-[var(--color-fg-faint)] leading-relaxed border-t border-[var(--color-line)] pt-3">
        料金目安：1 対話あたり 0.1〜0.5 円（Claude Haiku 4.5 使用）。
        <br />
        コーチ機能なしでも、各ページで直接書くことができます。
      </div>
      <button
        onClick={onClose}
        className="w-full text-xs tracking-[0.3em] border border-[var(--color-ink)] text-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-white transition"
      >
        閉じて、自分で書いてみる
      </button>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  streaming = false,
}: {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}) {
  // strip <draft>...</draft> from displayed text
  const cleanContent = content.replace(/<draft>[\s\S]*?<\/draft>/g, "").trim();

  if (role === "assistant") {
    return (
      <div>
        <div className="text-[9px] tracking-[0.35em] text-[var(--color-gold)] mb-2">
          {streaming ? "COACH · …" : "COACH"}
        </div>
        <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
          {cleanContent}
          {streaming && <span className="inline-block w-2 h-3 bg-[var(--color-ink)] ml-1 animate-pulse" />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] bg-[var(--color-paper-soft)] border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}
