"use client";

import { useEffect, useState, type MouseEvent } from "react";

const tabs = [
    {
        id: "basic",
        label: "基本情報",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
    },
    {
        id: "reviews",
        label: "評価",
        icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    },
    {
        id: "notifications",
        label: "通知設定",
        icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    },
];

export function ProfileSidebar() {
    const [active, setActive] = useState(tabs[0].id);

    // Scroll-spy: highlight the section currently in view.
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            // Top offset accounts for the sticky header; only count a section
            // as active once it reaches the upper portion of the viewport.
            { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
        );
        tabs.forEach((t) => {
            const el = document.getElementById(t.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    const handleClick = (id: string) => (e: MouseEvent) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <div className="w-56 shrink-0 sticky top-20 self-start">
            <nav className="bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
                {tabs.map((tab) => {
                    const isActive = tab.id === active;
                    return (
                        <a
                            key={tab.id}
                            href={`#${tab.id}`}
                            onClick={handleClick(tab.id)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                isActive
                                    ? "bg-orange-50 text-orange-700"
                                    : "text-slate-600 hover:bg-slate-50"
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                            </svg>
                            {tab.label}
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}
