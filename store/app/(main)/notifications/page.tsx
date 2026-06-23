import { createClient } from "@/lib/supabase/server";
import {
    Bell,
    CheckCircle2,
    Star,
    ChevronLeft,
    ChevronRight,
    CalendarClock,
    XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NotificationActions from "./NotificationActions";

type NotificationType = "confirmed" | "remind" | "reviewRequest" | "application_approved" | "application_rejected" | "new_application";

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    timestamp: string;
    actionLabel: string;
    actionHref: string;
    isRecent: boolean;
    isRead: boolean;
    isDbNotification: boolean;
}

const ITEMS_PER_PAGE = 10;

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
    if (diffD < 30) return `${Math.floor(diffD / 7)}週間前`;
    return new Date(dateStr).toLocaleDateString("ja-JP");
}

function getNotificationIcon(type: NotificationType) {
    switch (type) {
        case "confirmed":
        case "application_approved":
            return (
                <div className="w-10 h-10 rounded-full bg-store-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-store-600" />
                </div>
            );
        case "application_rejected":
            return (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-500" />
                </div>
            );
        case "remind":
            return (
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <CalendarClock className="w-5 h-5 text-amber-600" />
                </div>
            );
        case "reviewRequest":
            return (
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-purple-500" />
                </div>
            );
        default:
            return (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5 text-slate-500" />
                </div>
            );
    }
}

function NotificationItem({ n }: { n: Notification }) {
    return (
        <div className={cn("flex gap-4 p-5", !n.isRead && "bg-store-50/50")}>
            {getNotificationIcon(n.type)}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-store-500 shrink-0" />}
                    <h4 className={cn("text-sm", !n.isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>{n.title}</h4>
                </div>
                <p className={cn("text-sm leading-relaxed", !n.isRead ? "text-slate-600" : "text-slate-500")}>
                    {n.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-400">{n.timestamp}</span>
                    <Link
                        href={n.actionHref}
                        className={cn(
                            "text-xs font-medium hover:underline",
                            !n.isRead ? "text-store-600" : "text-slate-500"
                        )}
                    >
                        {n.actionLabel}
                    </Link>
                    {n.isDbNotification && !n.isRead && (
                        <NotificationActions notificationId={n.id} />
                    )}
                </div>
            </div>
        </div>
    );
}

const filterTabs = [
    { label: "すべて", value: "all" },
    { label: "出店関連", value: "application" },
    { label: "リマインド", value: "remind" },
    { label: "評価依頼", value: "reviewRequest" },
];

interface PageProps {
    searchParams: Promise<{ filter?: string; page?: string }>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
    const { filter, page } = await searchParams;
    const activeFilter = filter || "all";
    const currentPage = Math.max(1, parseInt(page || "1", 10));

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
    const exhibitor = exhibitors?.[0];
    if (!exhibitor) redirect("/onboarding");

    const now = new Date();

    // --- DBベースの通知を取得 ---
    const { data: dbNotifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

    const dbItems: Notification[] = (dbNotifications || []).map((n: any) => {
        const isRecent = (now.getTime() - new Date(n.created_at).getTime()) < 24 * 60 * 60 * 1000;
        let actionHref = "/notifications";
        if (n.related_application_id) actionHref = `/applications/${n.related_application_id}`;
        else if (n.related_event_id) actionHref = `/events/${n.related_event_id}`;

        return {
            id: n.id,
            type: n.type as NotificationType,
            title: n.title,
            description: n.message,
            timestamp: timeAgo(n.created_at),
            actionLabel: "詳細を見る",
            actionHref,
            isRecent,
            isRead: n.is_read,
            isDbNotification: true,
        };
    });

    // --- リマインド: 承認済みイベントで開催7日前 or 前日 (オンザフライ) ---
    const { data: upcomingApps } = await supabase
        .from("event_applications")
        .select("id, events(id, event_name, event_start_date, organizer_name)")
        .eq("exhibitor_id", exhibitor.id)
        .eq("status", "approved")
        .limit(100);

    const remindNotifications: Notification[] = [];
    for (const app of (upcomingApps || []) as any[]) {
        if (!app.events?.event_start_date) continue;
        const startDate = new Date(app.events.event_start_date);
        const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const eventName = app.events?.event_name || "イベント";
        const orgName = app.events?.organizer_name || "主催者";

        if (diffDays === 7 || diffDays === 1) {
            const label = diffDays === 1 ? "明日" : "7日後";
            remindNotifications.push({
                id: `remind-${app.id}-${diffDays}d`,
                type: "remind",
                title: `開催${label}のリマインド`,
                description: `「${eventName}」の開催が${label}に迫っています。主催者（${orgName}）と直接連絡を取り、当日の準備を確認してください。`,
                timestamp: "本日",
                actionLabel: "イベント詳細",
                actionHref: `/applications/${app.id}`,
                isRecent: true,
                isRead: false,
                isDbNotification: false,
            });
        }
    }

    // --- 評価依頼: 終了翌日のイベント (オンザフライ) ---
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: endedApps } = await supabase
        .from("event_applications")
        .select("id, events(id, event_name, event_end_date)")
        .eq("exhibitor_id", exhibitor.id)
        .eq("status", "approved")
        .limit(100);

    const reviewRequestNotifications: Notification[] = [];
    for (const app of (endedApps || []) as any[]) {
        const endDate = app.events?.event_end_date;
        if (!endDate) continue;
        if (endDate === yesterdayStr) {
            reviewRequestNotifications.push({
                id: `review-req-${app.id}`,
                type: "reviewRequest",
                title: "主催者の評価をお願いします",
                description: `「${app.events?.event_name || "イベント"}」が終了しました。主催者への評価を投稿してください。`,
                timestamp: "本日",
                actionLabel: "評価する",
                actionHref: `/applications/${app.id}`,
                isRecent: true,
                isRead: false,
                isDbNotification: false,
            });
        }
    }

    // マージ（未読→既読、新しい順）
    const allNotifications: Notification[] = [
        ...remindNotifications,
        ...reviewRequestNotifications,
        ...dbItems,
    ].sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return 0;
    });

    // フィルター適用
    const applicationTypes = ["application_approved", "application_rejected", "confirmed", "new_application"];
    const filtered =
        activeFilter === "all"
            ? allNotifications
            : activeFilter === "application"
                ? allNotifications.filter((n) => applicationTypes.includes(n.type))
                : allNotifications.filter((n) => n.type === activeFilter);

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const notifications = filtered.slice(from, from + ITEMS_PER_PAGE);

    const unreadCount = allNotifications.filter(n => !n.isRead).length;

    function buildParams(overrides: Record<string, string>): string {
        const params = new URLSearchParams();
        const f = overrides.filter ?? (filter || "all");
        const p = overrides.page ?? String(currentPage);
        if (f && f !== "all") params.set("filter", f);
        if (p && p !== "1") params.set("page", p);
        const str = params.toString();
        return str ? `?${str}` : "";
    }

    return (
        <div className="min-h-screen bg-[#f0fdf4]">
            <main className="max-w-4xl mx-auto py-8 px-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">通知</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            出店確定やリマインドなど、重要なお知らせを確認できます。
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <NotificationActions markAll />
                    )}
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
                                    ? "bg-store-500 text-white font-semibold"
                                    : "bg-white border border-slate-200 text-slate-600 font-medium hover:border-slate-300"
                            )}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Notification List */}
                {notifications.length > 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                        {notifications.map((n) => (
                            <NotificationItem key={n.id} n={n} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">通知はありません</h3>
                        <p className="text-sm text-slate-500">
                            出店確定やリマインドが届くとここに表示されます。
                        </p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {currentPage > 1 ? (
                            <Link
                                href={`/notifications${buildParams({ page: String(currentPage - 1) })}`}
                                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center">
                                <ChevronLeft className="w-4 h-4" />
                            </span>
                        )}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                            .reduce<(number | "dots")[]>((acc, p, i, arr) => {
                                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("dots");
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
                                            "w-9 h-9 rounded-lg text-sm font-bold flex items-center justify-center",
                                            item === currentPage
                                                ? "bg-store-500 text-white"
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
                                className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <span className="w-9 h-9 rounded-lg border border-slate-200 text-slate-300 flex items-center justify-center">
                                <ChevronRight className="w-4 h-4" />
                            </span>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
