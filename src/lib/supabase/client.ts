"use client";

// ============================================================
// Supabase · ブラウザ用クライアント
// ============================================================
// 環境変数（NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY）が未設定なら
// isSupabaseConfigured() が false を返し、アプリはローカル(localStorage)
// モードのまま動く。

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

export function createClient() {
  // implicit フロー：マジックリンクをどの端末/ブラウザで開いても成立する
  // （PKCEの code_verifier を必要としないため、スマホでメールを別ブラウザで
  // 開いても失敗しない）。トークンはURLハッシュ経由で受け取り、
  // detectSessionInUrl（既定 true）が自動でセッション化する。
  return createBrowserClient(url!, anonKey!, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
