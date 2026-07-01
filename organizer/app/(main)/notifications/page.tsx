import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import {
    FileText,
    CheckCircle2,
    Globe,
    Users,
    XCircle,
    CalendarClock,
    Star,
    ChevronLeft,
    ChevronRight,
    Bell,
} from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NotificationActions from "./NotificationActions";

type NotificationType =
    | "eventReview"
    | "eventPublished"
    | "newApplication"
    | "new_application"
    | "confirmed"
    | "application_approved"
    | "application_rejected"
    | "full"
    | "cancelled"
    | "remind"
    | "reviewRequest";

interface NotificationItem {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    highlightName?: string;
    timestamp: string;
    actionLabel: string;
    actionHref: string;
    isRecent: boolean;
    isRead: boolean;
    isDbNotification: boolean;
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
        case "eventReview":
            return (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                </div>
            );
        case "eventPublished":
            return (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-emerald-600" />
                </div>
            );
        case "newApplication":
        case "new_application":
            return (
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-orange-600" />
                </div>
            );
        case "confirmed":
        case "application_approved":
            return (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
            );
        case "application_rejected":
            return (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-400" />
                </div>
            );
        case "full":
            return (
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                </div>
            );
        case "cancelled":
            return (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-400" />
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
    }
}

function NotificationRow({ notification }: { notification: NotificationItem }) {
    const { isRead, title, description, highlightName, timestamp, actionLabel, actionHref, type, id, isDbNotification } =
        notification;

    return (
        <div className={cn("flex gap-4 p-5", !isRead && "bg-orange-50/50")}>
            <NotificationIcon type={type} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    {!isRead && <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />}
                    <h4 className={cn("text-sm", !isRead ? "font-bold text-slate-900" : "font-medium text-slate-700")}>{title}</h4>
                </div>
                <p className={cn("text-sm leading-relaxed", !isRead ? "text-slate-600" : "text-slate-500")}>
                    {highlightName && (
                        <span className={cn(!isRead ? "font-semibold text-slate-700" : "font-medium text-slate-600")}>
                            {highlightName}
                        </span>
                    )}
                    {description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-400">{timestamp}</span>
                    <Link
                        href={actionHref}
                        className={cn("text-xs font-medium hover:underline", !isRead ? "text-orange-600" : "text-slate-500")}
                    >
                        {actionLabel}
                    </Link>
                    {isDbNotification && !isRead && (
                        <NotificationActions notificationId={id} />
                    )}
                </div>
            </div>
        </div>
    );
}

const filterTabs = [
    { label: "すべて", value: "all" },
    { label: "申し込み", value: "application" },
    { label: "イベント", value: "event" },
    { label: "リマインド", value: "remind" },
];

export default async function NotificationsPage({ searchParams }: PageProps) {
    const { filter, page } = await searchParams;
    const activeFilter = filter || "all";
    const currentPage = Math.max(1, parseInt(page || "1", 10));

    const supabase = await createClient();
    let user = null;
    user = await getUserWithRefresh(supabase);

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

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // --- DBベースの通知を取得 ---
    const { data: dbNotifications } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

    const dbItems: NotificationItem[] = (dbNotifications || []).map((n: any) => {
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

    // --- オンザフライ通知（時間ベース） ---
    const derivedNotifications: NotificationItem[] = [];

    // 1. イベント審査中
    const { data: pendingEvents } = await supabase
        .from("events")
        .select("id, event_name, status, created_at, updated_at")
        .eq("organizer_id", profile.id)
        .eq("status", "pending")
        .order("updated_at", { ascending: false })
        .limit(50);

    for (const ev of (pendingEvents || []) as any[]) {
        const ts = ev.updated_at || ev.created_at;
        derivedNotifications.push({
            id: `review-${ev.id}`,
            type: "eventReview",
            title: "イベントが審査中です",
            description: `「${ev.event_name}」は現在管理者の審査中です。承認されると公開されます。`,
            timestamp: timeAgo(ts),
            actionLabel: "イベント詳細",
            actionHref: `/events/${ev.id}`,
            isRecent: new Date(ts) > oneDayAgo,
            isRead: false,
            isDbNotification: false,
        });
    }

    // 2. イベント公開完了
    const { data: publishedEvents } = await supabase
        .from("events")
        .select("id, event_name, status, updated_at")
        .eq("organizer_id", profile.id)
        .eq("status", "published")
        .order("updated_at", { ascending: false })
        .limit(50);

    for (const ev of (publishedEvents || []) as any[]) {
        const ts = ev.updated_at;
        derivedNotifications.push({
            id: `published-${ev.id}`,
            type: "eventPublished",
            title: "イベントが公開されました",
            description: `「${ev.event_name}」が公開されました。SNSでシェアして出店者を募集しましょう。`,
            timestamp: timeAgo(ts),
            actionLabel: "URLをコピー",
            actionHref: `/events/${ev.id}`,
            isRecent: new Date(ts) > oneDayAgo,
            isRead: false,
            isDbNotification: false,
        });
    }

    // 3. リマインド: 開催7日前 / 前日
    const { data: upcomingEvents } = await supabase
        .from("events")
        .select("id, event_name, event_start_date")
        .eq("organizer_id", profile.id)
        .eq("status", "published")
        .limit(100);

    for (const ev of (upcomingEvents || []) as any[]) {
        if (!ev.event_start_date) continue;
        const startDate = new Date(ev.event_start_date);
        const diffDays = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 7 || diffDays === 1) {
            const label = diffDays === 1 ? "明日" : "7日後";
            derivedNotifications.push({
                id: `remind-${ev.id}-${diffDays}d`,
                type: "remind",
                title: `開催${label}のリマインド`,
                description: `「${ev.event_name}」の開催が${label}に迫っています。出店者と直接連絡を取り、当日の準備を確認してください。`,
                timestamp: "本日",
                actionLabel: "イベント詳細",
                actionHref: `/events/${ev.id}`,
                isRecent: true,
                isRead: false,
                isDbNotification: false,
            });
        }
    }

    // 4. 評価依頼: 終了翌日
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: endedEvents } = await supabase
        .from("events")
        .select("id, event_name, event_end_date")
        .eq("organizer_id", profile.id)
        .limit(100);

    for (const ev of (endedEvents || []) as any[]) {
        if (ev.event_end_date === yesterdayStr) {
            derivedNotifications.push({
                id: `review-req-${ev.id}`,
                type: "reviewRequest",
                title: "出店者の評価をお願いします",
                description: `「${ev.event_name}」が終了しました。出店者への評価を投稿してください。`,
                timestamp: "本日",
                actionLabel: "評価する",
                actionHref: `/events/${ev.id}`,
                isRecent: true,
                isRead: false,
                isDbNotification: false,
            });
        }
    }

    // マージ（未読→既読、新しい順）
    const allNotifications: NotificationItem[] = [
        ...derivedNotifications,
        ...dbItems,
    ].sort((a, b) => {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return 0;
    });

    // Apply filter
    const applicationTypes: string[] = ["newApplication", "new_application", "confirmed", "application_approved", "application_rejected", "full", "cancelled"];
    const eventTypes: string[] = ["eventReview", "eventPublished"];
    const remindTypes: string[] = ["remind", "reviewRequest"];

    const filtered = activeFilter === "all"
        ? allNotifications
        : activeFilter === "application"
        ? allNotifications.filter(n => applicationTypes.includes(n.type))
        : activeFilter === "event"
        ? allNotifications.filter(n => eventTypes.includes(n.type))
        : allNotifications.filter(n => remindTypes.includes(n.type));

    // Paginate
    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const notifications = filtered.slice(from, from + ITEMS_PER_PAGE);

    const unreadCount = allNotifications.filter(n => !n.isRead).length;

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
        <div className="min-h-screen bg-[#fdf8f1]">
            <main className="max-w-4xl mx-auto py-8 px-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">通知</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            未読 {unreadCount}件
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
                            <NotificationRow key={notification.id} notification={notification} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">通知はありません</h3>
                        <p className="text-sm text-slate-500">
                            イベントや出店に関するお知らせが届くとここに表示されます。
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
