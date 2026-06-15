// ============================================================
// Hokushin - Constants
// ============================================================

import type { FieldId, PyramidLevel } from "./types";

// ------------------------------------------------------------
// Pyramid (壱〜伍)
// ------------------------------------------------------------

export interface PyramidTierMeta {
  level: PyramidLevel;
  kanji: string;        // 壱・弐・参・肆・伍
  nameJa: string;
  nameEn: string;
  gradient: string;     // CSS linear-gradient
  description: string;  // 説明（プレースホルダ用）
}

// 表示順: 上から頂点 → 土台
export const PYRAMID_TIERS: PyramidTierMeta[] = [
  {
    level: 5,
    kanji: "⑤",
    nameJa: "日々の実践",
    nameEn: "DAILY",
    gradient: "linear-gradient(180deg, #8B97BC 0%, #7785AC 100%)",
    description: "今日この瞬間に行う、具体的なアクション。",
  },
  {
    level: 4,
    kanji: "④",
    nameJa: "計画",
    nameEn: "PLAN",
    gradient: "linear-gradient(180deg, #5A6790 0%, #4A5783 100%)",
    description: "目標を達成するための具体的な計画。",
  },
  {
    level: 3,
    kanji: "③",
    nameJa: "目標の設定",
    nameEn: "GOAL",
    gradient: "linear-gradient(180deg, #3A4870 0%, #2E3C64 100%)",
    description: "ビジョンを実現するための、具体的な目標。",
  },
  {
    level: 2,
    kanji: "②",
    nameJa: "人生のビジョン",
    nameEn: "VISION",
    gradient: "linear-gradient(180deg, #1F2C50 0%, #18243F 100%)",
    description: "理念に基づき描く、望んでいる未来の姿。",
  },
  {
    level: 1,
    kanji: "①",
    nameJa: "人生理念  ──  土台",
    nameEn: "PHILOSOPHY",
    gradient: "linear-gradient(180deg, #0A1228 0%, #050A1A 100%)",
    description: "動かぬ核となる、人生で大切にする価値観。",
  },
];

export const PYRAMID_WIDTHS: Record<PyramidLevel, string> = {
  5: "36%",
  4: "52%",
  3: "68%",
  2: "84%",
  1: "100%",
};

// ------------------------------------------------------------
// 7 Fields
// ------------------------------------------------------------

export interface FieldMeta {
  id: FieldId;
  number: string; // 01〜07
  nameJa: string;
  nameJaShort: string; // 健康・人間関係 など
  nameEn: string;
}

export const FIELDS: FieldMeta[] = [
  { id: 1, number: "01", nameJa: "健康 / 体力",     nameJaShort: "健康",     nameEn: "HEALTH" },
  { id: 2, number: "02", nameJa: "人間関係",        nameJaShort: "人間関係", nameEn: "RELATIONSHIPS" },
  { id: 3, number: "03", nameJa: "家族 / 家庭",     nameJaShort: "家族",     nameEn: "FAMILY" },
  { id: 4, number: "04", nameJa: "仕事 / 職業",     nameJaShort: "仕事",     nameEn: "WORK" },
  { id: 5, number: "05", nameJa: "能力開発",        nameJaShort: "能力",     nameEn: "GROWTH" },
  { id: 6, number: "06", nameJa: "経済 / 蓄財",     nameJaShort: "経済",     nameEn: "FINANCE" },
  { id: 7, number: "07", nameJa: "趣味 / 教養",     nameJaShort: "趣味",     nameEn: "HOBBY" },
];

export const FIELD_MAP: Record<FieldId, FieldMeta> = FIELDS.reduce((acc, f) => {
  acc[f.id] = f;
  return acc;
}, {} as Record<FieldId, FieldMeta>);

// ------------------------------------------------------------
// App
// ------------------------------------------------------------

export const APP_NAME = "Hokushin";
export const APP_NAME_JA = "北辰";
export const APP_MEANING_JA = "北極星";
export const APP_MEANING_EN = "North Star";
export const APP_TAGLINE_JA = "迷わぬ者は、北辰を仰ぐ。";
export const APP_TAGLINE_EN = "Find your North Star.";
export const APP_DESCRIPTION =
  "Hokushin（北辰）とは、北極星のこと。動かない目印を見つけて、人生の方角を定め、毎日を澄み切らせるためのアプリ。";

export const SCHEMA_VERSION = 3;
export const STORAGE_KEY = "hokushin:v3:state";

// ------------------------------------------------------------
// Pricing plans
// ------------------------------------------------------------

export interface PlanFeature {
  label: string;
  free: boolean;
  premium: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "成功のピラミッド（5層の入力）",             free: true,  premium: true },
  { label: "七つの分野の目標（長期/中期/短期）",         free: true,  premium: true },
  { label: "毎日のタスク管理",                          free: true,  premium: true },
  { label: "月次プラン（最重要目標・振り返り）",         free: true,  premium: true },
  { label: "マンダラチャート",                          free: true,  premium: true },
  { label: "人生でやりたいこと 100 のリスト",            free: true,  premium: true },
  { label: "AI コーチ：対話で目標を引き出す",            free: false, premium: true },
  { label: "AI コーチ：ドラフト自動生成",                free: false, premium: true },
];

export const PREMIUM_PRICE_MONTHLY_JPY = 980;
export const PREMIUM_PRICE_YEARLY_JPY = 9800;
