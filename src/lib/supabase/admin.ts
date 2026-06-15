// ============================================================
// Supabase · service_role クライアント（サーバ専用・RLSを越える）
// ============================================================
// 日報インポートAPIで、トークンの横断検索と日報書込に使う。
// SUPABASE_SERVICE_ROLE_KEY は NEXT_PUBLIC を付けない（ブラウザに出さない）。

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isAdminConfigured(): boolean {
  return Boolean(url && serviceKey);
}

export function createAdminClient() {
  return createClient(url!, serviceKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
