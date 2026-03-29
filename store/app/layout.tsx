import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/NavigationProgress";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Eventra | 出店者",
  description: "イベント出店マッチングプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} antialiased bg-slate-50 text-slate-900 font-sans`}
      >
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
