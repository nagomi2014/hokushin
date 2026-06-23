import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー — 北辰",
  description: "北辰（Hokushin）のプライバシーポリシー。",
};

const UPDATED = "2026年6月22日";
const CONTACT = "nagomi2014@gmail.com";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 lg:px-10">
      <section className="pt-20 pb-10 hairline-bottom">
        <div className="text-[10px] tracking-[0.5em] text-[var(--color-gold)] mb-6">
          ★ &nbsp; PRIVACY POLICY
        </div>
        <h1 className="serif text-4xl md:text-5xl text-[var(--color-ink)] leading-[1.15] font-medium tracking-tight mb-4">
          プライバシーポリシー
        </h1>
        <p className="text-[var(--color-fg-mute)] text-sm tracking-wider">
          北辰（Hokushin）── 最終更新日：{UPDATED}
        </p>
      </section>

      <div className="py-10 space-y-10 text-sm leading-relaxed text-[var(--color-ink)]">
        <p className="text-[var(--color-fg-mute)]">
          北辰（以下「本アプリ」）は、人生の目標設計と日々の実践を支援する
          アプリケーションです。本ポリシーは、本アプリが取り扱う情報と、その目的・
          保存方法について定めます。
        </p>

        <Block n="01" title="収集する情報">
          <ul className="list-disc pl-5 space-y-2 text-[var(--color-fg-mute)]">
            <li>
              <span className="text-[var(--color-ink)]">メールアドレス</span>
              ：ログイン（マジックリンク認証）のためにのみ使用します。パスワードは
              保存しません。
            </li>
            <li>
              <span className="text-[var(--color-ink)]">あなたが入力した内容</span>
              ：人生理念・ビジョン・目標・振り返り・タスクなど、本アプリに
              書き込んだ情報。
            </li>
            <li>
              ログインせずに利用する場合、これらの情報は
              <span className="text-[var(--color-ink)]">あなたの端末内（ブラウザ）にのみ</span>
              保存され、外部へ送信されません。
            </li>
          </ul>
        </Block>

        <Block n="02" title="情報の保存先">
          <p className="text-[var(--color-fg-mute)]">
            ログインしてご利用の場合、データは
            <span className="text-[var(--color-ink)]"> Supabase </span>
            （クラウドデータベース）に保存され、端末をまたいで同期されます。
            ログインしない場合は、データはお使いの端末内（ローカルストレージ）にのみ
            保存されます。
          </p>
        </Block>

        <Block n="03" title="利用目的">
          <p className="text-[var(--color-fg-mute)]">
            収集した情報は、本アプリの機能（目標の保存・同期・表示）を提供する目的に
            のみ使用します。それ以外の目的では利用しません。
          </p>
        </Block>

        <Block n="04" title="第三者への提供・広告・解析">
          <ul className="list-disc pl-5 space-y-2 text-[var(--color-fg-mute)]">
            <li>あなたの情報を第三者に販売・提供することはありません。</li>
            <li>本アプリは現在、広告を表示しません。</li>
            <li>
              第三者による行動追跡（トラッキング）型の広告・解析は使用していません。
            </li>
          </ul>
        </Block>

        <Block n="05" title="データの削除">
          <p className="text-[var(--color-fg-mute)]">
            アプリ内で各項目を削除できます。アカウントおよび保存データの完全な削除を
            ご希望の場合は、下記の連絡先までご連絡ください。すみやかに対応します。
          </p>
        </Block>

        <Block n="06" title="お子様の利用について">
          <p className="text-[var(--color-fg-mute)]">
            本アプリは13歳未満のお子様を主たる対象としていません。お子様が利用する
            場合は、保護者の同意のもとでご利用ください。
          </p>
        </Block>

        <Block n="07" title="本ポリシーの変更">
          <p className="text-[var(--color-fg-mute)]">
            本ポリシーは必要に応じて改定することがあります。変更した場合は、本ページ上で
            最終更新日とともに公開します。
          </p>
        </Block>

        <Block n="08" title="お問い合わせ">
          <p className="text-[var(--color-fg-mute)]">
            本ポリシーや個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。
          </p>
          <p className="mt-2">
            <a
              href={`mailto:${CONTACT}`}
              className="text-[var(--color-ink)] border-b border-[var(--color-line)] hover:border-[var(--color-ink)]"
            >
              {CONTACT}
            </a>
          </p>
        </Block>
      </div>

      <div className="hairline-top mt-4 pt-8 pb-16">
        <Link
          href="/"
          className="text-xs tracking-[0.25em] text-[var(--color-fg-mute)] hover:text-[var(--color-ink)]"
        >
          ← BACK&nbsp;TO&nbsp;DASHBOARD
        </Link>
      </div>
    </div>
  );
}

function Block({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-4 mb-3">
        <span className="text-[10px] tracking-[0.4em] text-[var(--color-gold)]">
          {n}
        </span>
        <h2 className="serif text-xl text-[var(--color-ink)]">{title}</h2>
      </div>
      <div className="pl-0 md:pl-10">{children}</div>
    </section>
  );
}
