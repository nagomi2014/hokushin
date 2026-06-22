"use client";

import { useEffect, useRef } from "react";
import { useAppState } from "@/lib/storage";
import { useRevisions } from "@/lib/tools/useRevisions";
import { FIELDS, PYRAMID_TIERS } from "@/lib/constants";

// 「書き直しの記録」を自動で残す目立たない監視役。
// AppState が落ち着いたタイミング（最後の変更から数秒後）で、
// 理念・ビジョン・七つの分野・月次目標のスナップショットを撮る。
// 内容が前回と変わっていなければ何もしない（リビジョンは増えない）。

function cleanLabel(s: string): string {
  // 「人生理念  ──  土台」→「人生理念」
  return s.split("──")[0].trim();
}

export function RevisionsRecorder() {
  const { state, loaded } = useAppState();
  const { record, loaded: revLoaded } = useRevisions();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loaded || !revLoaded) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // ピラミッド（理念・ビジョン・目標・計画・日々の実践）
      for (const tier of PYRAMID_TIERS) {
        const entry = state.pyramid[tier.level];
        record(`pyramid:${tier.level}`, cleanLabel(tier.nameJa), entry?.content ?? "");
      }
      // 七つの分野（長期/中期/短期をまとめた一文）
      for (const f of FIELDS) {
        const g = state.fields[f.id];
        const text = [
          g.longTerm.trim() && `長期：${g.longTerm.trim()}`,
          g.midTerm.trim() && `中期：${g.midTerm.trim()}`,
          g.shortTerm.trim() && `短期：${g.shortTerm.trim()}`,
        ]
          .filter(Boolean)
          .join("\n");
        record(`field:${f.id}`, f.nameJa, text);
      }
      // 月次の最重要目標
      for (const p of state.monthlyPlans) {
        const mm = String(p.month).padStart(2, "0");
        record(`monthly:${p.year}-${mm}`, `${p.year}.${mm} 最重要目標`, p.primaryGoal);
      }
    }, 2500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, loaded, revLoaded, record]);

  return null;
}
