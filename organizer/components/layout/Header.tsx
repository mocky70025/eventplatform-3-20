"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "./UserNav";
import { NotificationBadge } from "./NotificationBadge";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "ホーム", match: [] as string[] },
        { href: "/events", label: "イベント管理", match: ["/events"] },
        { href: "/applications", label: "出店者管理", match: ["/applications", "/exhibitors"] },
        { href: "/notifications", label: "通知", match: ["/notifications"] },
        { href: "/profile", label: "プロフィール", match: ["/profile"] },
    ];

    const isActive = (item: typeof navItems[0]) => {
        if (item.href === "/" && pathname === "/") return true;
        if (item.match.length > 0) return item.match.some(m => pathname.startsWith(m));
        return pathname === item.href;
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
                        </div>
                        <span className="text-lg font-bold text-slate-900">Wacca</span>
                    </Link>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>主催者</span>
                </div>

                <nav className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "text-sm font-medium px-4 py-2 rounded-lg transition-colors relative",
                                isActive(item)
                                    ? "text-orange-700 bg-orange-50"
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {item.label}
                            {item.href === "/notifications" && <NotificationBadge />}
                        </Link>
                    ))}
                    <div className="w-px h-6 bg-slate-200 mx-2" />
                    <UserNav />
                </nav>
            </div>
        </header>
    );
}
