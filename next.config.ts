import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Cloudflare（OpenNext）: ローカル開発で Cloudflare のバインディングを使えるようにする。
// Vercel/next build には影響しない（dev 時のみ有効）。
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
