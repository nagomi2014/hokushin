"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { APP_MEANING_JA, APP_NAME, APP_NAME_JA } from "@/lib/constants";
import { useAppState } from "@/lib/storage";

type NavGroup = "home" | "know" | "derive" | "act" | "tools";

interface NavItem {
  href: string;
  label: string;
  labelJa: string;
  group: NavGroup;
  primary?: boolean; // 上部バーに常時出す主要ページ
}

// 流れ順：ダッシュボード → ①知る → ②導き出す → ③動く → ととのえる。
// primary の3つだけ上部バーに出し、残りは ☰ メニューに全部入れる。
const NAV: NavItem[] = [
  { href: "/", label: "DASHBOARD", labelJa: "ダッシュボード", group: "home", primary: true },
  { href: "/pyramid", label: "PYRAMID", labelJa: "ピラミッド", group: "know" },
  { href: "/mandala", label: "MANDALA", labelJa: "曼荼羅", group: "know" },
  { href: "/list-100", label: "LIST 100", labelJa: "百のリスト", group: "know" },
  { href: "/history", label: "LIFE 100Y", labelJa: "100年史", group: "know" },
  { href: "/fields", label: "GOALS", labelJa: "目標設定", group: "derive", primary: true },
  { href: "/monthly", label: "MONTHLY", labelJa: "月次", group: "act", primary: true },
  { href: "/journal", label: "JOURNAL", labelJa: "日誌", group: "act" },
  { href: "/money", label: "MONEY", labelJa: "金の記録", group: "tools" },
  { href: "/prime", label: "QUADRANT II", labelJa: "第II領域", group: "tools" },
  { href: "/revisions", label: "REVISIONS", labelJa: "書き直しの記録", group: "tools" },
];

const PRIMARY_NAV = NAV.filter((n) => n.primary);

const GROUP_LABEL: Record<NavGroup, string> = {
  home: "",
  know: "① 知る",
  derive: "② 導き出す",
  act: "③ 動く",
  tools: "ととのえる",
};

export function SiteHeader() {
  const pathname = usePathname();
  const { supabaseEnabled, userEmail, mode } = useAppState();
  const [menuOpen, setMenuOpen] = useState(false);

  // ルート遷移したらメニューを閉じる
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // メニュー展開中は背面スクロールを止める
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <header className="hairline-bottom sticky top-0 bg-white z-40">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="serif text-2xl text-[var(--color-ink)] leading-none">
            {APP_NAME_JA}
          </span>
          <span className="w-px h-5 bg-[var(--color-line)]" />
          <div className="flex flex-col leading-tight">
            <span className="text-[12px] tracking-[0.35em] text-[var(--color-fg-mute)] font-medium">
              {APP_NAME.toUpperCase()}
            </span>
            <span className="text-[12px] tracking-[0.25em] text-[var(--color-fg-faint)]">
              ＝ {APP_MEANING_JA}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-xs tracking-[0.2em] text-[var(--color-fg-mute)]">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${
                isActive(item.href)
                  ? "active text-[var(--color-ink)] font-medium"
                  : "hover:text-[var(--color-ink)]"
              }`}
            >
              {item.labelJa}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {supabaseEnabled && !userEmail && (
            <Link
              href="/login"
              className="hidden sm:inline-block text-[12px] tracking-[0.3em] px-2.5 py-1 border border-[var(--color-line)] text-[var(--color-fg-mute)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] transition"
              title="ログイン"
            >
              LOGIN
            </Link>
          )}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-full bg-[var(--color-paper-soft)] hairline-top hairline-bottom border-x border-[var(--color-line)] flex items-center justify-center text-xs serif text-[var(--color-fg-faint)] hover:text-[var(--color-ink)] transition relative"
            title={userEmail ? `${userEmail}（クラウド同期中）` : "設定"}
          >
            {mode === "cloud" && userEmail ? userEmail[0].toUpperCase() : "☆"}
            {mode === "cloud" && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--color-gold)]" />
            )}
          </Link>

          {/* ☰ メニュー（全サイズ表示・全ページをここに集約） */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 -mr-1.5 flex flex-col items-center justify-center gap-[5px]"
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
          >
            <span
              className={`block w-5 h-px bg-[var(--color-ink)] transition-transform duration-200 ${
                menuOpen ? "translate-y-[6px] rotate-45" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[var(--color-ink)] transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[var(--color-ink)] transition-transform duration-200 ${
                menuOpen ? "-translate-y-[6px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* フルメニュー（全ページ・全サイズ） */}
      {menuOpen && (
        <div>
          <div
            className="fixed inset-0 top-16 bg-[var(--color-ink)]/20 backdrop-blur-[1px]"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <nav
            id="mobile-nav"
            className="relative bg-white hairline-bottom max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <ul className="max-w-7xl mx-auto px-6 py-2">
              {NAV.map((item, i) => {
                const prev = NAV[i - 1];
                const showHeader =
                  item.group !== "home" &&
                  (!prev || prev.group !== item.group);
                const active = isActive(item.href);
                return (
                  <Fragment key={item.href}>
                    {showHeader && (
                      <li className="pt-4 pb-1 text-[12px] tracking-[0.35em] text-[var(--color-gold-ink)]">
                        {GROUP_LABEL[item.group]}
                      </li>
                    )}
                    <li className="hairline-bottom">
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-baseline justify-between gap-4 py-3.5"
                      >
                        <span
                          className={`serif text-lg ${
                            active
                              ? "text-[var(--color-gold-ink)]"
                              : "text-[var(--color-ink)]"
                          }`}
                        >
                          {item.labelJa}
                        </span>
                        <span
                          className={`text-[12px] tracking-[0.3em] ${
                            active
                              ? "text-[var(--color-gold-ink)]"
                              : "text-[var(--color-fg-faint)]"
                          }`}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
