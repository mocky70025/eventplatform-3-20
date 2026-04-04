"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCheck } from "lucide-react";

export default function NotificationActions({
    notificationId,
    markAll,
}: {
    notificationId?: string;
    markAll?: boolean;
}) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleMarkRead = async () => {
        setIsLoading(true);
        try {
            await fetch("/api/notifications/read", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    markAll ? { mark_all: true } : { notification_id: notificationId }
                ),
            });
            router.refresh();
        } catch {
            // ignore
        } finally {
            setIsLoading(false);
        }
    };

    if (markAll) {
        return (
            <button
                onClick={handleMarkRead}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-colors"
            >
                <CheckCheck className="w-4 h-4" />
                すべて既読にする
            </button>
        );
    }

    return (
        <button
            onClick={handleMarkRead}
            disabled={isLoading}
            className="text-xs text-slate-400 hover:text-orange-600 disabled:opacity-50 transition-colors"
        >
            既読にする
        </button>
    );
}
