"use client";

import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { usePathname } from "next/navigation";
import { UserNav } from "./UserNav";
import { NotificationBadge } from "./NotificationBadge";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", label: "ホーム", match: [] as string[] },
        { href: "/events", label: "イベント管理", match: ["/events"] },
        { href: "/applications", label: "応募管理", match: ["/applications", "/exhibitors"] },
        { href: "/profile", label: "設定", match: ["/profile"] },
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
                        <LogoMark />
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
                        </Link>
                    ))}
                    <Link
                        href="/notifications"
                        className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
                        aria-label="通知"
                    >
                        <Bell className="w-5 h-5" />
                        <NotificationBadge />
                    </Link>
                    <div className="w-px h-6 bg-slate-200 mx-2" />
                    <UserNav />
                </nav>
            </div>
        </header>
    );
}
