import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

// Run Server Components / functions in Tokyo, close to users and the
// Supabase region (ap-southeast-1) — avoids the ~1s TTFB seen from US (iad1).
export const preferredRegion = "hnd1";

export const metadata: Metadata = {
  title: "Wacca | 出店者",
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
        className={`${notoSansJP.variable} antialiased bg-[#f0fdf4] text-slate-900 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
