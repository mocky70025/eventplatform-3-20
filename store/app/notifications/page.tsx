import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";
import {
    Bell,
    CheckCircle2,
    XCircle,
    Send,
    Star,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";

type NotificationType = "approved" | "rejected" | "submitted" | "review";

interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    description: string;
    timestamp: string;
    actionLabel: string;
    actionHref: string;
    isRecent: boolean;
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

function NotificationIcon({ type }: { type: NotificationType }) {
    switch (type) {
        case "approved":
            return (
                <div className="w-10 h-10 rounded-full bg-store-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-store-600" />
                </div>
            );
        case "rejected":
            return (
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-400" />
                </div>
            );
        case "submitted":
            return (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5 text-slate-400" />
                </div>
            );
        case "review":
            return (
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
            );
    }
}

function NotificationItem({ n }: { n: Notification }) {
    return (
        <div className={cn("flex gap-4 p-5", n.isRecent && "bg-store-50/50")}>
            <NotificationIcon type={n.type} />
            <div className="flex-1 min-w-0">
                {n.isRecent ? (
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 rounded-full bg-store-500 shrink-0" />
                        <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    </div>
                ) : (
                    <h4 className="text-sm font-medium text-slate-700 mb-1">{n.title}</h4>
                )}
                <p className={cn("text-sm leading-relaxed", n.isRecent ? "text-slate-600" : "text-slate-500")}>
                    {n.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-slate-400">{n.timestamp}</span>
                    <Link
                        href={n.actionHref}
                        className={cn(
                            "text-xs font-medium hover:underline",
                            n.isRecent ? "text-store-600" : "text-slate-500"
                        )}
                    >
                        {n.actionLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}

const filterTabs = [
    { label: "すべて", value: "all" },
    { label: "応募関連", value: "application" },
    { label: "評価・レビュー", value: "review" },
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

    // 応募データをnotificationとして派生
    const { data: apps } = await supabase
        .from("event_applications")
        .select(`
            id,
            status,
            created_at,
            updated_at,
            events(id, event_name)
        `)
        .eq("exhibitor_id", exhibitor.id)
        .order("updated_at", { ascending: false })
        .limit(100);

    // 受信したレビューデータ
    const { data: reviews } = await supabase
        .from("event_reviews")
        .select(`
            id,
            rating,
            created_at,
            events(id, event_name),
            organizers:reviewer_id(company_name, name)
        `)
        .eq("reviewee_id", user.id)
        .eq("reviewee_type", "exhibitor")
        .order("created_at", { ascending: false })
        .limit(50);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const appNotifications: Notification[] = (apps || []).map((app: any) => {
        const eventName = app.events?.event_name || "イベント";
        const updatedAt = app.updated_at || app.created_at;
        const isRecent = new Date(updatedAt) > oneDayAgo;

        if (app.status === "approved") {
            return {
                id: `approved-${app.id}`,
                type: "approved" as NotificationType,
                title: "出店が承認されました",
                description: `「${eventName}」への出店申請が承認されました。イベント詳細を確認し、出店準備を進めてください。`,
                timestamp: timeAgo(updatedAt),
                actionLabel: "詳細を見る",
                actionHref: `/applications/${app.id}`,
                isRecent,
            };
        }
        if (app.status === "rejected") {
            return {
                id: `rejected-${app.id}`,
                type: "rejected" as NotificationType,
                title: "出店が見送りになりました",
                description: `「${eventName}」の出店申請は今回見送りとなりました。`,
                timestamp: timeAgo(updatedAt),
                actionLabel: "詳細を見る",
                actionHref: `/applications/${app.id}`,
                isRecent,
            };
        }
        return {
            id: `submitted-${app.id}`,
            type: "submitted" as NotificationType,
            title: "応募を送信しました",
            description: `「${eventName}」への出店申請を送信しました。審査結果をお待ちください。`,
            timestamp: timeAgo(app.created_at),
            actionLabel: "詳細を見る",
            actionHref: `/applications/${app.id}`,
            isRecent: new Date(app.created_at) > oneDayAgo,
        };
    });

    const reviewNotifications: Notification[] = (reviews || []).map((r: any) => {
        const eventName = r.events?.event_name || "イベント";
        const organizerName = (r.organizers as any)?.company_name || (r.organizers as any)?.name || "主催者";
        const isRecent = new Date(r.created_at) > oneDayAgo;
        return {
            id: `review-${r.id}`,
            type: "review" as NotificationType,
            title: "新しい評価が届きました",
            description: `${organizerName}から「${eventName}」の評価を受け取りました。星${r.rating}つの評価が投稿されています。`,
            timestamp: timeAgo(r.created_at),
            actionLabel: "評価を見る",
            actionHref: `/profile?tab=reviews`,
            isRecent,
        };
    });

    // 時系列でマージ（isRecentを優先してソート）
    const allNotifications: Notification[] = [
        ...appNotifications,
        ...reviewNotifications,
    ].sort((a, b) => {
        if (a.isRecent !== b.isRecent) return a.isRecent ? -1 : 1;
        return 0;
    });

    // フィルター適用
    const filtered =
        activeFilter === "all"
            ? allNotifications
            : activeFilter === "review"
            ? allNotifications.filter((n) => n.type === "review")
            : allNotifications.filter((n) => n.type !== "review");

    const totalFiltered = filtered.length;
    const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE);
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const notifications = filtered.slice(from, from + ITEMS_PER_PAGE);

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
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-4xl mx-auto py-8 px-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">通知</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            イベントの応募状況や主催者からのお知らせを確認できます。
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
                            イベントへの応募や評価が届くとここに表示されます。
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
                                    <span key={`dots-${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-slate-400">
                                        ...
                                    </span>
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
