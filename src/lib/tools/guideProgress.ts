// ============================================================
// ガイドの「途中保存」— 各ガイドの進行位置（と必要なら回答）を
// localStorage に保存し、再度開いたときに続きから再開できるようにする。
// 完了したら clear する。
// ============================================================

const PREFIX = "hokushin:guide:";

export function readGuide<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeGuide<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export function clearGuide(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* noop */
  }
}
