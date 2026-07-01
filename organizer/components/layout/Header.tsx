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
        <header className="bg-white px-8 h-16 grid grid-cols-[1fr_auto_1fr] items-center border-b border-slate-100 sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2.5 justify-self-start">
                <LogoMark />
                <span className="text-lg font-bold text-slate-900">Wacca</span>
            </Link>

            <nav className="flex items-center gap-6 h-full justify-self-center">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "relative h-full flex items-center text-sm font-medium transition-colors",
                            isActive(item)
                                ? "text-orange-700 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-600"
                                : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="flex items-center gap-1 justify-self-end">
                <Link
                    href="/notifications"
                    className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors"
                    aria-label="通知"
                >
                    <Bell className="w-5 h-5" />
                    <NotificationBadge />
                </Link>
                <UserNav />
            </div>
        </header>
    );
}
