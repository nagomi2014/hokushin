import Anthropic from "@anthropic-ai/sdk";
import {
  SYSTEM_PROMPT,
  getCoachPrompt,
  type CoachContext,
} from "@/lib/coach/prompts";

export const runtime = "nodejs";

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
}

interface CoachRequest {
  context: CoachContext;
  messages: CoachMessage[];
  finalize?: boolean; // true なら最終ドラフトを書かせる指示
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY が未設定です。`.env.local` に追加してから再起動してください。",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: CoachRequest;
  try {
    body = (await req.json()) as CoachRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const coachPrompt = getCoachPrompt(body.context);
  const anthropic = new Anthropic({ apiKey });

  // System prompt with cache control on the static portion (large, reusable across turns)
  const systemBlocks: Anthropic.TextBlockParam[] = [
    {
      type: "text",
      text: SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    },
    {
      type: "text",
      text: `【今回の対話のテーマ】\n${coachPrompt.context}`,
    },
  ];

  // If the client asked for finalization, inject a directive as the last user turn
  const messages: CoachMessage[] = [...body.messages];
  if (body.finalize) {
    messages.push({
      role: "user",
      content:
        "ここまでの対話を踏まえて、最終ドラフトを書いてください。1段落、80〜200字程度、私の一人称で。<draft>...</draft> で囲んでください。",
    });
  }

  try {
    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemBlocks,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "stream error";
          controller.enqueue(encoder.encode(`\n\n[ERROR] ${msg}`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Anthropic API error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
