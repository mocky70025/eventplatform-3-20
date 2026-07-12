import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

// Run functions in Tokyo, close to users and the Supabase region.
export const preferredRegion = "hnd1";

export const metadata: Metadata = {
  title: "Wacca | 主催者",
  description: "イベント主催者とキッチンカーのマッチングプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} antialiased bg-[#fdf8f1] text-slate-900 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
