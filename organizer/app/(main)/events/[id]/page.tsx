"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import {
    ArrowLeft, Loader2, AlertCircle, X,
    Edit, Share2, ExternalLink, Calendar as CalendarIcon,
} from "lucide-react";
import NextImage from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface EventDetail {
    id: string;
    event_name: string;
    genre: string;
    description: string;
    event_start_date: string;
    event_end_date: string;
    event_time: string;
    venue_name: string;
    address: string;
    main_image_url: string;
    status: string;
    recruit_count: number;
    max_exhibitors: number;
    fee: string;
    application_period_end: string;
    exhibitor_list_visibility: string;
    visibility: string;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
function formatDate(d?: string | null): string {
    if (!d) return "未定";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}（${WEEKDAYS[dt.getDay()]}）`;
}

const VISIBILITY_LABEL: Record<string, string> = {
    all: "すべて公開",
    category: "カテゴリのみ公開",
    none: "非公開",
};

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;
    const supabase = createClient();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [appCount, setAppCount] = useState(0);
    const [approvedCount, setApprovedCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const orgIdRef = useRef<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインが必要です");

            const { data: org } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", user.id)
                .single();
            if (!org) throw new Error("主催者プロフィールが見つかりません");
            orgIdRef.current = org.id;

            const [eventResult, appResult] = await Promise.all([
                supabase
                    .from("events")
                    .select("*")
                    .eq("id", eventId)
                    .eq("organizer_id", org.id)
                    .single(),
                supabase
                    .from("event_applications")
                    .select("status")
                    .eq("event_id", eventId),
            ]);

            if (eventResult.error) throw eventResult.error;
            if (!eventResult.data) throw new Error("イベントが見つからないか、アクセス権がありません");
            setEvent(eventResult.data);

            const apps = appResult.data ?? [];
            setAppCount(apps.length);
            setApprovedCount(apps.filter((a) => a.status === "approved").length);
            setPendingCount(apps.filter((a) => a.status === "pending").length);
        } catch (err: any) {
            setError(err.message || "データの取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    }, [eventId, supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async () => {
        if (!event) return;
        if (!confirm(`「${event.event_name}」を削除しますか？この操作は元に戻せません。`)) return;
        try {
            if (!orgIdRef.current) throw new Error("主催者プロフィールが見つかりません");
            const { error, count } = await supabase
                .from("events")
                .delete({ count: "exact" })
                .eq("id", eventId)
                .eq("organizer_id", orgIdRef.current);
            if (error) throw error;
            if (count === 0) throw new Error("削除対象が見つかりませんでした。権限を確認してください。");
            router.push("/events");
            router.refresh();
        } catch (err: any) {
            setActionMessage({ type: "error", text: "削除に失敗しました: " + (err.message || "不明なエラー") });
        }
    };

    const publicUrl = () => {
        const storeOrigin = window.location.origin.replace("organizer", "store");
        return `${storeOrigin}/events/${eventId}`;
    };

    const handleShare = async () => {
        const url = publicUrl();
        if (navigator.share) {
            try { await navigator.share({ title: event?.event_name, url }); } catch { /* cancelled */ }
        } else {
            try {
                await navigator.clipboard.writeText(url);
                setActionMessage({ type: "success", text: "共有URLをコピーしました" });
                setTimeout(() => setActionMessage(null), 3000);
            } catch {
                prompt("以下のURLをコピーしてください:", url);
            }
        }
    };

    const handlePreview = () => {
        window.open(publicUrl(), "_blank");
    };

    const handleCloseRecruitment = async () => {
        if (!event) return;
        if (!confirm("このイベントの募集を締め切りますか？")) return;
        try {
            if (!orgIdRef.current) throw new Error("主催者プロフィールが見つかりません");
            const { error } = await supabase
                .from("events")
                .update({ status: "closed" })
                .eq("id", eventId)
                .eq("organizer_id", orgIdRef.current);
            if (error) throw error;
            setEvent({ ...event, status: "closed" });
            setActionMessage({ type: "success", text: "募集を締め切りました" });
            setTimeout(() => setActionMessage(null), 3000);
        } catch (err: any) {
            setActionMessage({ type: "error", text: "失敗しました: " + (err.message || "不明なエラー") });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#fdf8f1] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-[#fdf8f1] flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">エラーが発生しました</h2>
                <p className="text-slate-500 mb-6">{error || "イベントが見つかりません"}</p>
                <Link href="/events"><Button>イベント一覧に戻る</Button></Link>
            </div>
        );
    }

    const recruit = event.recruit_count || event.max_exhibitors || 0;
    const pct = recruit > 0 ? Math.min(100, Math.round((approvedCount / recruit) * 100)) : 0;

    const statusMap: Record<string, { label: string; className: string }> = {
        published: { label: "募集中", className: "bg-emerald-100 text-emerald-700" },
        pending: { label: "審査中", className: "bg-amber-100 text-amber-700" },
        draft: { label: "下書き", className: "bg-slate-100 text-slate-600" },
        closed: { label: "募集終了", className: "bg-slate-100 text-slate-600" },
        ended: { label: "終了", className: "bg-slate-100 text-slate-500" },
        rejected: { label: "却下", className: "bg-red-100 text-red-700" },
    };
    const statusInfo = statusMap[event.status] || statusMap.draft;

    const dateText = `${formatDate(event.event_start_date)}${event.event_end_date && event.event_end_date !== event.event_start_date ? ` 〜 ${formatDate(event.event_end_date)}` : ""}`;

    const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
            <dt className="text-sm text-slate-500 sm:w-32 shrink-0">{label}</dt>
            <dd className="text-sm text-slate-900 font-medium flex-1">{value || "—"}</dd>
        </div>
    );

    const SidebarBtn = ({ onClick, href, children, variant = "default" }: { onClick?: () => void; href?: string; children: React.ReactNode; variant?: "default" | "danger" }) => {
        const cls = cn(
            "w-full flex items-center justify-center gap-2 text-sm font-bold rounded-xl px-4 py-2.5 transition-colors border",
            variant === "danger"
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
        );
        return href ? <Link href={href} className={cls}>{children}</Link> : <button onClick={onClick} className={cls}>{children}</button>;
    };

    return (
        <div className="min-h-screen bg-[#fdf8f1]">
            <main className="max-w-6xl mx-auto py-8 px-6 w-full">
                {actionMessage && (
                    <div className={cn(
                        "mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between",
                        actionMessage.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}>
                        <span>{actionMessage.text}</span>
                        <button onClick={() => setActionMessage(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
                    <ArrowLeft className="w-4 h-4" /> イベント一覧に戻る
                </Link>

                {/* Hero card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="w-full sm:w-[200px] h-[130px] shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 relative">
                        {event.main_image_url ? (
                            <NextImage src={event.main_image_url} alt={event.event_name} fill sizes="200px" className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center"><CalendarIcon className="w-8 h-8 text-orange-300" /></div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-2", statusInfo.className)}>{statusInfo.label}</span>
                        <h1 className="text-2xl font-bold text-slate-900 mb-1">{event.event_name}</h1>
                        <p className="text-sm text-slate-500 mb-4">{dateText}　・　{event.venue_name || event.address}</p>
                        <div className="flex flex-wrap gap-x-8 gap-y-2">
                            <div><p className="text-xs text-slate-500">出店料</p><p className="text-sm font-bold text-slate-900">{event.fee || "—"}</p></div>
                            <div><p className="text-xs text-slate-500">募集数</p><p className="text-sm font-bold text-slate-900">{recruit ? `${recruit}店舗` : "—"}</p></div>
                            <div><p className="text-xs text-slate-500">応募締切</p><p className="text-sm font-bold text-slate-900">{formatDate(event.application_period_end)}</p></div>
                        </div>
                    </div>
                </div>

                {/* 2-column */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Main */}
                    <div className="lg:col-span-2 space-y-6">
                        {event.description && (
                            <section className="bg-white rounded-2xl border border-slate-200 p-6">
                                <h2 className="text-lg font-bold text-slate-900 mb-3">イベント概要</h2>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                            </section>
                        )}

                        <section className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">開催情報</h2>
                            <dl>
                                <InfoRow label="開催日時" value={`${dateText}${event.event_time ? `　${event.event_time}` : ""}`} />
                                <InfoRow label="会場" value={event.venue_name} />
                                <InfoRow label="住所" value={event.address} />
                            </dl>
                        </section>

                        <section className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">募集要項</h2>
                            <dl>
                                <InfoRow label="募集ジャンル" value={event.genre} />
                                <InfoRow label="募集数" value={recruit ? `${recruit}店舗` : "—"} />
                                <InfoRow label="出店料" value={event.fee} />
                                <InfoRow label="応募締切" value={formatDate(event.application_period_end)} />
                                <InfoRow label="出店者公開設定" value={VISIBILITY_LABEL[event.exhibitor_list_visibility] || "—"} />
                            </dl>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* 募集状況 */}
                        <section className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">募集状況</h3>
                            <p className="mb-2">
                                <span className="text-3xl font-bold text-orange-500">{approvedCount}</span>
                                <span className="text-sm text-slate-500"> / {recruit || "—"} 名</span>
                            </p>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            {pendingCount > 0 && (
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-slate-500">新規応募</span>
                                    <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full">{pendingCount}件</span>
                                </div>
                            )}
                            <Link href={`/events/${eventId}/applications`} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl px-4 py-2.5 transition-colors">
                                応募を確認する
                            </Link>
                        </section>

                        {/* 操作 */}
                        <section className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">操作</h3>
                            <div className="space-y-2">
                                <SidebarBtn href={`/events/${eventId}/edit`}><Edit className="w-4 h-4" /> イベントを編集</SidebarBtn>
                                <SidebarBtn onClick={handleShare}><Share2 className="w-4 h-4" /> 当日情報を共有</SidebarBtn>
                                <SidebarBtn onClick={handlePreview}><ExternalLink className="w-4 h-4" /> 公開ページをプレビュー</SidebarBtn>
                                {event.status !== "closed" && event.status !== "ended" && (
                                    <SidebarBtn onClick={handleCloseRecruitment} variant="danger">募集を締め切る</SidebarBtn>
                                )}
                            </div>
                        </section>

                        {/* 公開設定 */}
                        <section className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-3">公開設定</h3>
                            <div className="flex items-center justify-between py-2 border-b border-slate-100">
                                <span className="text-sm text-slate-500">ステータス</span>
                                <span className={cn("inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full", statusInfo.className)}>{statusInfo.label}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-slate-500">出店者リスト</span>
                                <span className="text-sm font-medium text-slate-900">{VISIBILITY_LABEL[event.exhibitor_list_visibility] || "—"}</span>
                            </div>
                        </section>

                        <button onClick={handleDelete} className="w-full text-center text-xs text-slate-500 hover:text-red-500 transition-colors py-2">
                            このイベントを削除
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
