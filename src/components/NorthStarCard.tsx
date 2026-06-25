"use client";

import { useState } from "react";
import Link from "next/link";
import { FIELDS, FIELD_MAP } from "@/lib/constants";
import type { Horizon, NorthStar, NorthStarGoal } from "@/lib/tools/useTools";
import type { FieldId } from "@/lib/types";

// 長期・中期・短期それぞれの「最重要目標」を、開いた瞬間に一望できるカード。
// 自由記入（text）＋任意で分野（fieldId）に紐づけ。クリックでその場編集。

const ROWS: { horizon: Horizon; label: string; span: string }[] = [
  { horizon: "long", label: "長期", span: "5年〜" },
  { horizon: "mid", label: "中期", span: "1〜5年" },
  { horizon: "short", label: "短期", span: "1年以内" },
];

export default function NorthStarCard({
  northStar,
  setNorthStar,
}: {
  northStar: NorthStar;
  setNorthStar: (horizon: Horizon, patch: Partial<NorthStarGoal>) => void;
}) {
  const hasAny = ROWS.some((r) => northStar[r.horizon].text.trim());

  return (
    <section className="py-8 hairline-bottom">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
            ★ NORTH STAR
          </span>
          <h2 className="serif text-xl md:text-2xl text-[var(--color-ink)]">
            私の北極星
          </h2>
        </div>
        <span className="text-[10px] tracking-[0.25em] text-[var(--color-fg-faint)]">
          最重要目標
        </span>
      </div>

      {!hasAny && (
        <p className="text-[11px] text-[var(--color-fg-faint)] leading-relaxed mb-3">
          長期・中期・短期それぞれの「これだけは」を一行で。クリックして書き込めます。
        </p>
      )}

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
  // 非編集時の表示は goal.text を直接使う。draft は編集中のみ使う。
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
      className={`grid grid-cols-12 items-center gap-3 px-4 py-3 ${
        top ? "" : "hairline-top"
      }`}
    >
      {/* horizon label */}
      <div className="col-span-2 md:col-span-2">
        <div className="serif text-base text-[var(--color-gold)] leading-none">
          {label}
        </div>
        <div className="text-[9px] tracking-[0.2em] text-[var(--color-fg-faint)] mt-1">
          {span}
        </div>
      </div>

      {/* goal text (click to edit) */}
      <div className="col-span-10 md:col-span-7">
        {editing ? (
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setDraft(goal.text);
                setEditing(false);
              }
            }}
            rows={1}
            placeholder="ここに最重要目標を書く…"
            className="w-full resize-none border border-[var(--color-ink)] px-2 py-1 text-sm text-[var(--color-ink)] focus:outline-none leading-relaxed"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(goal.text);
              setEditing(true);
            }}
            className="w-full text-left text-sm leading-relaxed transition"
          >
            {goal.text.trim() ? (
              <span className="text-[var(--color-ink)]">{goal.text}</span>
            ) : (
              <span className="text-[var(--color-fg-faint)] italic">
                ＋ 書く
              </span>
            )}
          </button>
        )}
      </div>

      {/* optional field link */}
      <div className="col-span-12 md:col-span-3 flex md:justify-end">
        <select
          value={goal.fieldId ?? ""}
          onChange={(e) =>
            onChangeField(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className="text-[11px] text-[var(--color-fg-mute)] bg-transparent border-b border-[var(--color-line)] py-0.5 focus:outline-none focus:border-[var(--color-ink)] max-w-full"
          title="分野に紐づける（任意）"
        >
          <option value="">— 分野なし —</option>
          {FIELDS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.number} {f.nameJaShort}
            </option>
          ))}
        </select>
      </div>

      {/* linked field goal hint */}
      {linkedField && (
        <div className="col-span-12 mt-1 flex items-start gap-2 text-[11px] text-[var(--color-fg-faint)] md:col-start-3">
          <Link
            href={`/fields#field-${linkedField.id}`}
            className="text-[var(--color-gold)] hover:underline"
          >
            ↳ {linkedField.nameJa} の目標へ
          </Link>
        </div>
      )}
    </div>
  );
}
