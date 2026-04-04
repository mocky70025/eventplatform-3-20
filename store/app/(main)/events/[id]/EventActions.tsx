"use client";

import { useState } from "react";
import { Bookmark, Share2, Check } from "lucide-react";

export function ShareButton() {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({ title: document.title, url });
            } catch {
                // User cancelled or share failed, fall through to clipboard
                await copyToClipboard(url);
            }
        } else {
            await copyToClipboard(url);
        }
    };

    const copyToClipboard = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback: prompt user to copy manually
            window.prompt("URLをコピーしてください:", url);
        }
    };

    return (
        <button
            onClick={handleShare}
            className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
        >
            {copied ? <Check className="w-4 h-4 text-store-600" /> : <Share2 className="w-4 h-4" />}
            {copied ? "コピーしました" : "共有"}
        </button>
    );
}

export function BookmarkButton({ eventId }: { eventId: string }) {
    const [saved, setSaved] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            const bookmarks = JSON.parse(localStorage.getItem("wacca_bookmarks") || "[]");
            return bookmarks.includes(eventId);
        } catch {
            return false;
        }
    });

    const toggleBookmark = () => {
        try {
            const bookmarks: string[] = JSON.parse(localStorage.getItem("wacca_bookmarks") || "[]");
            let updated: string[];
            if (bookmarks.includes(eventId)) {
                updated = bookmarks.filter((id) => id !== eventId);
            } else {
                updated = [...bookmarks, eventId];
            }
            localStorage.setItem("wacca_bookmarks", JSON.stringify(updated));
            setSaved(!saved);
        } catch {
            // Ignore storage errors
        }
    };

    return (
        <button
            onClick={toggleBookmark}
            className="flex-1 h-10 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-2"
        >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-store-500 text-store-500" : ""}`} />
            {saved ? "保存済み" : "保存"}
        </button>
    );
}

export function HeroBookmarkButton({ eventId }: { eventId: string }) {
    const [saved, setSaved] = useState(() => {
        if (typeof window === "undefined") return false;
        try {
            const bookmarks = JSON.parse(localStorage.getItem("wacca_bookmarks") || "[]");
            return bookmarks.includes(eventId);
        } catch {
            return false;
        }
    });

    const toggleBookmark = () => {
        try {
            const bookmarks: string[] = JSON.parse(localStorage.getItem("wacca_bookmarks") || "[]");
            let updated: string[];
            if (bookmarks.includes(eventId)) {
                updated = bookmarks.filter((id) => id !== eventId);
            } else {
                updated = [...bookmarks, eventId];
            }
            localStorage.setItem("wacca_bookmarks", JSON.stringify(updated));
            setSaved(!saved);
        } catch {
            // Ignore storage errors
        }
    };

    return (
        <button
            onClick={toggleBookmark}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        >
            <Bookmark className={`w-5 h-5 ${saved ? "fill-store-500 text-store-500" : "text-slate-600"}`} />
        </button>
    );
}
