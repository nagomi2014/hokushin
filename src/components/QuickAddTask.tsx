"use client";

import { useState } from "react";
import { FIELDS } from "@/lib/constants";
import type { FieldId } from "@/lib/types";

// ダッシュボード上で「本日のタスク」をその場で追加するコンパクトな入力欄。
// 詳細（時刻など）は /daily ページで編集できる。

export default function QuickAddTask({
  onAdd,
}: {
  onAdd: (title: string, fieldId: FieldId | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [fieldId, setFieldId] = useState<FieldId | "">("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    onAdd(t, fieldId === "" ? null : fieldId);
    setTitle("");
    setFieldId("");
  }

  return (
    <form onSubmit={submit} className="mt-3 flex items-stretch gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="＋ 本日のタスクを追加…"
        className="flex-1 border border-[var(--color-line)] px-3 py-2 text-sm text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-ink)] transition"
      />
      <select
        value={fieldId}
        onChange={(e) =>
          setFieldId(e.target.value === "" ? "" : (Number(e.target.value) as FieldId))
        }
        className="border border-[var(--color-line)] px-2 py-2 text-xs text-[var(--color-fg-mute)] bg-white focus:outline-none focus:border-[var(--color-ink)] transition"
        title="分野（任意）"
      >
        <option value="">分野</option>
        {FIELDS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.number} {f.nameJaShort}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!title.trim()}
        className="border border-[var(--color-ink)] text-[var(--color-ink)] px-4 text-xs tracking-[0.3em] hover:bg-[var(--color-ink)] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        追加
      </button>
    </form>
  );
}
