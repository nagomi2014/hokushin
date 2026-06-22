import { FIELDS } from "./constants";
import type { FieldGoal, FieldId, Fields } from "./types";

// 分野に「状態（短期/中期/長期）」が一つでも入っているか
export function fieldHasState(g?: Partial<FieldGoal>): boolean {
  if (!g) return false;
  return !!(
    (g.shortTerm ?? "").trim() ||
    (g.midTerm ?? "").trim() ||
    (g.longTerm ?? "").trim()
  );
}

// 実際に画面へ出す分野を決める。
//   選択がある → その分野（正規の並び順）
//   選択が無い → 中身が入っている分野（後方互換：既存ユーザー）
export function activeFieldIds(
  selectedFields: number[],
  fields: Fields,
): FieldId[] {
  const valid = new Set<number>(FIELDS.map((f) => f.id));
  const sel = selectedFields.filter((id) => valid.has(id));
  if (sel.length > 0) {
    return FIELDS.filter((f) => sel.includes(f.id)).map((f) => f.id);
  }
  return FIELDS.filter((f) => fieldHasState(fields[f.id])).map((f) => f.id);
}
