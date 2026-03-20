"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "./UserNav";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ホーム" },
  { href: "/events", label: "イベント検索" },
  { href: "/applications", label: "申込管理" },
  { href: "/history", label: "出店履歴" },
  { href: "/notifications", label: "通知" },
  { href: "/profile", label: "プロフィール" },
];

export function Header() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-white px-8 h-16 flex items-center justify-between border-b border-slate-100 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-store-500 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">Eventra</span>
        </Link>
        <span className="text-[10px] bg-store-100 text-store-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>
          出店者
        </span>
      </div>
      <nav className="flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
              isActive(item.href)
                ? "text-store-700 bg-store-50"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {item.label}
          </Link>
        ))}
        <UserNav />
      </nav>
    </header>
  );
}
