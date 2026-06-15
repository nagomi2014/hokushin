import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_JP } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE_EN } from "@/lib/constants";
import { SiteHeader } from "@/components/SiteHeader";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { AppStateProvider } from "@/lib/store/AppStateProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${APP_NAME}（北辰）— ${APP_TAGLINE_EN}`,
  description:
    "Hokushin（北辰）＝北極星。動かない目印を見つけ、人生のピラミッドを土台から整え、七つの分野で目標を設計し、毎日を澄み切らせる。",
  applicationName: "北辰",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "北辰",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1228",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSerifJp.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppStateProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </AppStateProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
