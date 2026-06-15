// ============================================================
// Next.js 16 Proxy（旧 middleware）— Supabase セッションの自動リフレッシュ
// ============================================================
// 毎リクエストで Cookie のセッションを更新する。Supabase 未設定なら何もしない。
// ルート保護（未ログインの締め出し）はしない：北辰は未ログインでも
// ローカルモードで使えるため、認証ゲートは UI 側で行う。

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // セッションのリフレッシュ（getUser を呼ぶと必要に応じてトークン更新）
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 静的ファイル・画像・manifest を除く全ルート
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|svg|ico|webmanifest)$).*)",
  ],
};
