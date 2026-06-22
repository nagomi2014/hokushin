"use client";

// ============================================================
// Hokushin · 書き直しの記録（リビジョン履歴・$0・端末ローカル）
// ------------------------------------------------------------
// 理念・ビジョン・七つの分野・月次目標など「何度も問い直して
// 書き直す文章」のスナップショットを、変化したときだけ追記する。
// GitHubのコミット履歴のように「過去に何を書いたか」を残す。
// 端末ローカル保存（localStorage）。AppState とは独立。
// ============================================================

import { useEffect, useState } from "react";

const KEY = "hokushin:revisions:v1";

export interface Revision {
  id: string;
  docKey: string; // 文書の識別子（例：pyramid:1 / field:3 / monthly:2026-06）
  label: string; // 見出し（例：人生理念）
  value: string; // そのときの内容
  savedAt: string; // ISO 日時
}

export interface DocSummary {
  docKey: string;
  label: string;
  latest: string;
  count: number;
  lastSavedAt: string;
}

interface RevisionsData {
  revisions: Revision[];
}

function emptyData(): RevisionsData {
  return { revisions: [] };
}

function load(): RevisionsData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<RevisionsData>;
    return { revisions: Array.isArray(parsed.revisions) ? parsed.revisions : [] };
  } catch {
    return emptyData();
  }
}

function save(data: RevisionsData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // 端末ストレージが一杯などのときは黙ってスキップ
  }
}

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export interface UseRevisionsResult {
  loaded: boolean;
  revisions: Revision[];
  // 内容が前回と変わっていれば1件追記する（空文字は無視）
  record: (docKey: string, label: string, value: string) => void;
  // ある文書の履歴（新しい順）
  revisionsFor: (docKey: string) => Revision[];
  // 文書ごとの要約（最後に更新された順）
  docSummaries: () => DocSummary[];
  // ある文書の履歴をすべて消す
  clearDoc: (docKey: string) => void;
}

export function useRevisions(): UseRevisionsResult {
  const [data, setData] = useState<RevisionsData>(emptyData());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setData(load());
    setLoaded(true);
  }, []);

  function mutate(fn: (prev: RevisionsData) => RevisionsData) {
    setData((prev) => {
      const next = fn(prev);
      if (next === prev) return prev;
      save(next);
      return next;
    });
  }

  return {
    loaded,
    revisions: data.revisions,

    record: (docKey, label, value) => {
      const v = value.trim();
      if (!v) return;
      mutate((prev) => {
        // 同じ文書の最新リビジョンと同じ内容なら追記しない
        for (let i = prev.revisions.length - 1; i >= 0; i--) {
          if (prev.revisions[i].docKey === docKey) {
            if (prev.revisions[i].value === v) return prev;
            break;
          }
        }
        return {
          revisions: [
            ...prev.revisions,
            { id: uid(), docKey, label, value: v, savedAt: new Date().toISOString() },
          ],
        };
      });
    },

    revisionsFor: (docKey) =>
      data.revisions
        .filter((r) => r.docKey === docKey)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt)),

    docSummaries: () => {
      const byKey = new Map<string, Revision[]>();
      for (const r of data.revisions) {
        const arr = byKey.get(r.docKey) ?? [];
        arr.push(r);
        byKey.set(r.docKey, arr);
      }
      const out: DocSummary[] = [];
      for (const [docKey, arr] of byKey) {
        const sorted = [...arr].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
        out.push({
          docKey,
          label: sorted[0].label,
          latest: sorted[0].value,
          count: sorted.length,
          lastSavedAt: sorted[0].savedAt,
        });
      }
      return out.sort((a, b) => b.lastSavedAt.localeCompare(a.lastSavedAt));
    },

    clearDoc: (docKey) =>
      mutate((prev) => ({
        revisions: prev.revisions.filter((r) => r.docKey !== docKey),
      })),
  };
}
