import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Cloudflare Workers 向け OpenNext 設定。
// 既定のまま（増分キャッシュ等は使わない）。必要になれば R2/KV を足せる。
export default defineCloudflareConfig({});
