import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import {
    FileText,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    Bell,
} from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

type NotificationType = "application" | "approved" | "rejected";

interface DerivedNotification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    highlightName?: string;
    timestamp: string;
    actionLabel: string;
    actionHref: string;
    isRecent: boolean;
}

const ITEMS_PER_PAGE = 10;

interface PageProps {
    searchParams: Promise<{
        filter?: string;
        page?: string;
    }>;
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now.getTime() - then.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}時間前`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "昨日";
    if (diffD < 7) return `${diffD}日前`;
    return new Date(dateStr).toLocaleDateString("ja-JP");
}

function NotificationIcon({ type }: { type: NotificationType }) {
    switch (type) {
        case "application":
            return (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-orange-600" />
                </div>
            );
        case "approved":
            return (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
            );
        case "rejected":
            return (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-400" />
                </div>
            );
    }
}

function NotificationItem({ notification }: { notification: DerivedNotification }) {
    const { isRecent, title, description, highlightName, timestamp, actionLabel, actionHref, type } =
        notification;

    return (
        <div className={cn("flex gap-4 p-5", isRecent && "bg-orange-50/50")}>
            <NotificationIcon type={type} />
            <div className="flex-1 min-w-0">
                {isRecent ? (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
                    </div>
                ) : (
                    <h4 className="text-sm font-medium text-slate-700 mb-1">{title}</h4>
                )}
                <p
                    className={cn(
                        "text-sm leading-relaxed",
                        isRecent ? "text-slate-600" : "text-slate-500"
                    )}
                >
                    {highlightName && (
                        <span
                            className={cn(
                                isRecent
                                    ? "font-semibold text-slate-700"
                                    : "font-medium text-slate-600"
                            )}
                        >
                            {highlightName}
                        </span>
                    )}
                    {description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-400">{timestamp}</span>
                    <Link
                        href={actionHref}
                        className={cn(
                            "text-xs font-medium hover:underline",
                            isRecent ? "text-orange-600" : "text-slate-500"
                        )}
                    >
                        {actionLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}

const filterTabs = [
    { label: "すべて", value: "all" },
    { label: "新規応募", value: "application" },
    { label: "承認済み", value: "approved" },
    { label: "却下済み", value: "rejected" },
];

export default async function NotificationsPage({ searchParams }: PageProps) {
    const { filter, page } = await searchParams;
    const activeFilter = filter || "all";
    const currentPage = Math.max(1, parseInt(page || "1", 10));

    const supabase = await createClient();
    let user = null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
            user = data.user;
        }
    } catch (error: any) {
        if (
            error?.name !== "AuthSessionMissingError" &&
            error?.message !== "Auth session missing!"
        ) {
            console.error("Auth error:", error);
        }
    }

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        redirect("/onboarding");
    }

    // Fetch recent applications for this organizer's events as notifications
    const { data: recentApps } = await supabase
        .from("event_applications")
        .select(`
            id,
            status,
            created_at,
            updated_at,
            events!inner(id, event_name, organizer_id),
            exhibitors(shop_name, name)
        `)
        .eq("events.organizer_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(100);

    // Derive notifications from real application data
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const allNotifications: DerivedNotification[] = (recentApps || []).map((app: any) => {
        const shopName = app.exhibitors?.shop_name || app.exhibitors?.name || "出店者";
        const eventName = app.events?.event_name || "イベント";
        const createdAt = new Date(app.created_at);
        const isRecent = createdAt > oneDayAgo;

        if (app.status === "approved") {
            return {
                id: `approved-${app.id}`,
                type: "approved" as NotificationType,
                title: "出店申請を承認しました",
                description: `の「${eventName}」への出店を承認しました。`,
                highlightName: shopName,
                timestamp: timeAgo(app.updated_at || app.created_at),
                actionLabel: "詳細を見る",
                actionHref: `/applications/${app.id}`,
                isRecent,
            };
        }

        if (app.status === "rejected") {
            return {
                id: `rejected-${app.id}`,
                type: "rejected" as NotificationType,
                title: "出店申請を却下しました",
                description: `の応募を却下しました。`,
                highlightName: shopName,
                timestamp: timeAgo(app.updated_at || app.created_at),
                actionLabel: "詳細を見る",
                actionHref: `/applications/${app.id}`,
                isRecent,
            };
        }

        // pending
        return {
            id: `app-${app.id}`,
            type: "application" as NotificationType,
            title: "新しい出店申請が届きました",
            description: `が「${eventName}」に応募しました。`,
            highlightName: shopName,
            timestamp: timeAgo(app.created_at),
            actionLabel: "審査する",
            actionHref: `/applications/${app.id}`,
            isRecent,
        };
    });

    // Apply filter
    const filtered = activeFilter === "all"
        ? allNotifications
        : allNotifications.filter(n => n.type === activeFilter);

    // Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const notifications = filtered.slice(from, from + ITEMS_PER_PAGE);

    function buildParams(overrides: Record<string, string | undefined>): string {
        const params = new URLSearchParams();
        const f = overrides.filter !== undefined ? overrides.filter : filter;
        const p = overrides.page !== undefined ? overrides.page : String(currentPage);
        if (f && f !== "all") params.set("filter", f);
        if (p && p !== "1") params.set("page", p);
        const str = params.toString();
        return str ? `?${str}` : "";
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-4xl mx-auto py-8 px-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">通知</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            出店申請やイベントに関するお知らせを確認できます。
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {filterTabs.map((tab) => (
                        <Link
                            key={tab.value}
                            href={`/notifications${buildParams({ filter: tab.value, page: "1" })}`}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm transition-colors",
                                activeFilter === tab.value
                                    ? "bg-orange-500 text-white font-semibold"
                                    : "bg-white border border-slate-200 text-slate-600 font-medium hover:border-slate-300"
                            )}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Notifications List */}
                {notifications.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                        {notifications.map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">通知はありません</h3>
                        <p className="text-sm text-slate-500">
                            新しい出店申請が届くとここに表示されます。
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {currentPage > 1 ? (
                            <Link
                                href={`/notifications${buildParams({ page: String(currentPage - 1) })}`}
                                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center text-sm hover:bg-slate-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-sm">
                                <ChevronLeft className="w-4 h-4" />
                            </span>
                        )}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce<(number | "dots")[]>((acc, p, i, arr) => {
                                if (i > 0 && p - arr[i - 1] > 1) acc.push("dots");
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, i) =>
                                item === "dots" ? (
                                    <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400">...</span>
                                ) : (
                                    <Link
                                        key={item}
                                        href={`/notifications${buildParams({ page: String(item) })}`}
                                        className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold",
                                            item === currentPage
                                                ? "bg-orange-500 text-white"
                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        {item}
                                    </Link>
                                )
                            )}
                        {currentPage < totalPages ? (
                            <Link
                                href={`/notifications${buildParams({ page: String(currentPage + 1) })}`}
                                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center text-sm hover:bg-slate-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center text-sm">
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
