"use client";

import { useState } from "react";
import { FIELDS, FIELD_MAP } from "@/lib/constants";
import type { Horizon, NorthStar, NorthStarGoal } from "@/lib/tools/useTools";
import type { FieldId } from "@/lib/types";

// 長期・中期・短期それぞれの「最重要目標」を、開いた瞬間に一望できるコンパクトなカード。
// 自由記入（text）＋任意で分野（fieldId）に紐づけ。クリックでその場編集。

const ROWS: { horizon: Horizon; label: string; span: string }[] = [
  { horizon: "long", label: "長期", span: "5年〜" },
  { horizon: "mid", label: "中期", span: "1〜5年" },
  { horizon: "short", label: "短期", span: "1年" },
];

export default function NorthStarCard({
  northStar,
  setNorthStar,
}: {
  northStar: NorthStar;
  setNorthStar: (horizon: Horizon, patch: Partial<NorthStarGoal>) => void;
}) {
  return (
    <section className="pt-4 pb-3 hairline-bottom">
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[9px] tracking-[0.35em] text-[var(--color-gold)]">
            ★ NORTH STAR
          </span>
          <h2 className="serif text-base text-[var(--color-ink)]">私の北極星</h2>
        </div>
        <span className="text-[9px] tracking-[0.2em] text-[var(--color-fg-faint)]">
          最重要目標
        </span>
      </div>

      <div className="border border-[var(--color-line)]">
        {ROWS.map((r, i) => (
          <NorthRow
            key={r.horizon}
            label={r.label}
            span={r.span}
            goal={northStar[r.horizon]}
            top={i === 0}
            onChangeText={(text) => setNorthStar(r.horizon, { text })}
            onChangeField={(fieldId) => setNorthStar(r.horizon, { fieldId })}
          />
        ))}
      </div>
    </section>
  );
}

function NorthRow({
  label,
  span,
  goal,
  top,
  onChangeText,
  onChangeField,
}: {
  label: string;
  span: string;
  goal: NorthStarGoal;
  top: boolean;
  onChangeText: (text: string) => void;
  onChangeField: (fieldId: number | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goal.text);

  const linkedField =
    goal.fieldId != null ? FIELD_MAP[goal.fieldId as FieldId] : undefined;

  function commit() {
    setEditing(false);
    const next = draft.trim();
    if (next !== goal.text) onChangeText(next);
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 ${top ? "" : "hairline-top"}`}
    >
      {/* horizon label */}
      <div className="w-11 shrink-0 leading-none">
        <span className="serif text-sm text-[var(--color-gold)]">{label}</span>
        <span className="text-[8px] tracking-[0.1em] text-[var(--color-fg-faint)] ml-1">
          {span}
        </span>
      </div>

      {/* goal text (click to edit) — 1行で省略表示 */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setDraft(goal.text);
                setEditing(false);
              }
            }}
            placeholder="最重要目標を書く…"
            className="w-full border-b border-[var(--color-ink)] px-1 py-0.5 text-sm text-[var(--color-ink)] focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(goal.text);
              setEditing(true);
            }}
            className="w-full text-left text-sm truncate"
            title={goal.text.trim() || undefined}
          >
            {goal.text.trim() ? (
              <span className="text-[var(--color-ink)]">{goal.text}</span>
            ) : (
              <span className="text-[var(--color-fg-faint)] italic">＋ 書く</span>
            )}
          </button>
        )}
      </div>

      {/* optional field link（任意） */}
      <select
        value={goal.fieldId ?? ""}
        onChange={(e) =>
          onChangeField(e.target.value === "" ? undefined : Number(e.target.value))
        }
        className="shrink-0 max-w-[5.5rem] text-[10px] text-[var(--color-fg-mute)] bg-transparent border-b border-[var(--color-line)] py-0.5 focus:outline-none focus:border-[var(--color-ink)]"
        title={linkedField ? `${linkedField.nameJa} に紐づけ中` : "分野に紐づける（任意）"}
      >
        <option value="">分野</option>
        {FIELDS.map((f) => (
          <option key={f.id} value={f.id}>
            {f.number} {f.nameJaShort}
          </option>
        ))}
      </select>
    </div>
  );
}
