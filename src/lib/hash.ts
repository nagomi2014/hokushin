// SHA-256 → hex（ブラウザ・Node 双方の Web Crypto を使用）
// インポートトークンは平文を保存せず、このハッシュだけを保存・照合する。

export async function sha256hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
