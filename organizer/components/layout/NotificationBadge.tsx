"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBadge() {
    const [count, setCount] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        const fetchCount = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { count: unreadCount } = await supabase
                .from("notifications")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id)
                .eq("is_read", false);

            setCount(unreadCount ?? 0);
        };

        fetchCount();

        // Refresh every 30 seconds
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1" style={{ lineHeight: 1 }}>
            {count > 99 ? "99+" : count}
        </span>
    );
}
