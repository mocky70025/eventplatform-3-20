import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { notFound, redirect } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    MapPin,
    CheckCircle2,
    XCircle,
    Clock,
    Check,
    Image,
    Mail,
    Phone,
    MessageCircle,
    X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CancelApplicationButton } from "./ApplicationActions";
import { ReviewForm } from "./ReviewForm";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const user = await getUserWithRefresh(supabase);

    if (!user) {
        redirect("/login");
    }

    // Get exhibitor profile
    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
    const exhibitor = exhibitors?.[0];

    if (!exhibitor) {
        redirect("/onboarding");
    }

    // Get application details with event
    const { data: application, error } = await supabase
        .from("event_applications")
        .select(`
            *,
            event:events (
                id,
                event_name,
                event_start_date,
                venue_name,
                status,
                organizer:organizers (
                    user_id,
                    company_name,
                    name,
                    email,
                    phone_number
                )
            )
        `)
        .eq("id", id)
        .eq("exhibitor_id", exhibitor.id)
        .maybeSingle();

    if (error || !application) {
        notFound();
    }

    // Get full exhibitor profile for displaying submitted info
    const { data: exhibitorProfiles } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
    const exhibitorProfile = exhibitorProfiles?.[0] || null;

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "approved":
                return {
                    label: "承認済み",
                    icon: CheckCircle2,
                    bannerBg: "bg-store-50 border-store-200",
                    bannerIconBg: "bg-store-500",
                    bannerTitle: "text-store-800",
                    bannerDesc: "text-store-600",
                    bannerMessage: "出店が承認されました",
                    bannerDescription: "おめでとうございます。出店が承認されました。詳細は主催者からの連絡をお待ちください。",
                };
            case "rejected":
                return {
                    label: "見送り",
                    icon: XCircle,
                    bannerBg: "bg-red-50 border-red-200",
                    bannerIconBg: "bg-red-500",
                    bannerTitle: "text-red-800",
                    bannerDesc: "text-red-600",
                    bannerMessage: "出店が見送りになりました",
                    bannerDescription: "今回はご期待に沿えず申し訳ございません。",
                };
            default:
                return {
                    label: "確認中",
                    icon: Clock,
                    bannerBg: "bg-blue-50 border-blue-200",
                    bannerIconBg: "bg-blue-500",
                    bannerTitle: "text-blue-800",
                    bannerDesc: "text-blue-600",
                    bannerMessage: "申し込みを受け付けました",
                    bannerDescription: "主催者が申し込み内容を確認中です。結果が出るまでしばらくお待ちください。",
                };
        }
    };

    const statusInfo = getStatusInfo(application.status);
    const StatusIcon = statusInfo.icon;
    const event = application.event as any;
    const organizer = event?.organizer as any;

    // Timeline steps
    const timelineSteps = getTimelineSteps(application);

    // Review: visible when approved and event ended/closed
    const isEventEnded = event?.status === "ended" || event?.status === "closed";
    const canReview = application.status === "approved" && isEventEnded;

    let existingReview: { rating: number; comment: string | null } | null = null;
    if (canReview && organizer?.user_id) {
        const { data: reviewData } = await supabase
            .from("event_reviews")
            .select("rating, comment")
            .eq("event_id", event.id)
            .eq("reviewer_id", user.id)
            .eq("reviewee_id", organizer.user_id)
            .maybeSingle();
        existingReview = reviewData || null;
    }

    return (
        <div className="min-h-screen bg-[#f0fdf4] flex flex-col">

            <main className="flex-1 max-w-5xl mx-auto w-full py-8 px-6">
                {/* Back Link */}
                <Link
                    href="/applications"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    申込管理に戻る
                </Link>

                {/* Status Banner */}
                <div className={cn("border rounded-2xl p-6 mb-6", statusInfo.bannerBg)}>
                    <div className="flex items-start gap-4">
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", statusInfo.bannerIconBg)}>
                            {application.status === "approved" && <Check className="w-6 h-6 text-white" strokeWidth={2.5} />}
                            {application.status === "rejected" && <X className="w-6 h-6 text-white" strokeWidth={2.5} />}
                            {application.status !== "approved" && application.status !== "rejected" && <Clock className="w-6 h-6 text-white" strokeWidth={2} />}
                        </div>
                        <div className="flex-1">
                            <h2 className={cn("text-lg font-bold", statusInfo.bannerTitle)}>
                                {statusInfo.bannerMessage}
                            </h2>
                            <p className={cn("text-sm mt-1", statusInfo.bannerDesc)}>
                                {statusInfo.bannerDescription}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Two Column Layout */}
                <div className="flex gap-6">
                    {/* Left: Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Event Info Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4">イベント情報</h3>
                            <div className="flex gap-4 mb-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center shrink-0">
                                    <Image className="w-8 h-8 text-orange-300" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                                        {event?.event_name}
                                    </h4>
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                                            {event?.event_start_date
                                                ? new Date(event.event_start_date).toLocaleDateString("ja-JP")
                                                : "未定"}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                                            {event?.venue_name || "会場未定"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href={`/events/${event?.id}`}
                                className="text-xs font-medium text-store-600 hover:text-store-800"
                            >
                                イベント詳細を見る &rarr;
                            </Link>
                        </div>

                        {/* Submitted Profile Info */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4">申し込み時のプロフィール情報</h3>
                            <p className="text-xs text-slate-500 mb-4">申し込み時に提出されたプロフィール情報です</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">屋号</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {exhibitorProfile?.shop_name || exhibitorProfile?.company_name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">代表者名</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {exhibitorProfile?.representative_name || exhibitorProfile?.name || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">メールアドレス</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {exhibitorProfile?.email || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">住所</p>
                                    <p className="text-sm font-medium text-slate-900">
                                        {exhibitorProfile?.address || "-"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">ジャンル</p>
                                    <div className="flex gap-1.5 mt-1 flex-wrap">
                                        {exhibitorProfile?.genre ? (
                                            (Array.isArray(exhibitorProfile.genre)
                                                ? exhibitorProfile.genre
                                                : [exhibitorProfile.genre]
                                            ).map((g: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center justify-center text-xs font-medium bg-store-50 text-store-700 h-6 px-2.5 rounded-full"
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    {g}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-slate-500">-</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">営業形態</p>
                                    <div className="flex gap-1.5 mt-1 flex-wrap">
                                        {exhibitorProfile?.business_type ? (
                                            (Array.isArray(exhibitorProfile.business_type)
                                                ? exhibitorProfile.business_type
                                                : [exhibitorProfile.business_type]
                                            ).map((bt: string, i: number) => (
                                                <span
                                                    key={i}
                                                    className="inline-flex items-center justify-center text-xs font-medium bg-store-50 text-store-700 h-6 px-2.5 rounded-full"
                                                    style={{ lineHeight: 1 }}
                                                >
                                                    {bt}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-slate-500">-</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Store description */}
                            <div className="border-t border-slate-100 mt-4 pt-4">
                                <p className="text-xs text-slate-500 mb-1">店舗紹介</p>
                                <p className="text-sm text-slate-600">
                                    {exhibitorProfile?.description || exhibitorProfile?.introduction || "-"}
                                </p>
                            </div>

                            {/* Business license */}
                            <div className="border-t border-slate-100 mt-4 pt-4">
                                <p className="text-xs text-slate-500 mb-1">営業許可証</p>
                                <div className="flex items-center gap-2">
                                    {exhibitorProfile?.business_license_url || exhibitorProfile?.license_url ? (
                                        <span
                                            className="inline-flex items-center justify-center text-xs font-semibold bg-store-100 text-store-700 h-5 px-2 rounded-full"
                                            style={{ lineHeight: 1 }}
                                        >
                                            登録済み
                                        </span>
                                    ) : (
                                        <span className="text-sm text-slate-500">未登録</span>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right: Sidebar */}
                    <div className="w-72 shrink-0 space-y-4">
                        {/* Timeline */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-5">ステータス</h3>

                            {timelineSteps.map((step, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                        {step.state === "completed" && (
                                            <div className="w-8 h-8 bg-store-500 rounded-full flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                                            </div>
                                        )}
                                        {step.state === "current" && (
                                            <div className="w-8 h-8 bg-store-100 border-2 border-store-400 rounded-full flex items-center justify-center">
                                                <div className="w-2.5 h-2.5 bg-store-500 rounded-full" />
                                            </div>
                                        )}
                                        {step.state === "upcoming" && (
                                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-xs font-bold text-slate-500">
                                                {idx + 1}
                                            </div>
                                        )}
                                        {idx < timelineSteps.length - 1 && (
                                            <div
                                                className={cn(
                                                    "w-0.5 h-8",
                                                    step.state === "completed" ? "bg-store-300" : "bg-slate-200"
                                                )}
                                            />
                                        )}
                                    </div>
                                    <div className={idx < timelineSteps.length - 1 ? "pb-4" : ""}>
                                        <p
                                            className={cn(
                                                "text-sm font-semibold",
                                                step.state === "completed" && "text-slate-900",
                                                step.state === "current" && "text-store-700",
                                                step.state === "upcoming" && "text-slate-500 font-medium"
                                            )}
                                        >
                                            {step.label}
                                        </p>
                                        {step.date && (
                                            <p className="text-xs text-slate-500 mt-0.5">{step.date}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Organizer Info */}
                        {organizer && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <p className="text-xs text-slate-500 mb-3">主催者</p>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-sm font-bold text-orange-700">
                                        {(organizer.company_name || organizer.name || "?").charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {organizer.company_name || organizer.name}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2 pt-3 border-t border-slate-100">
                                    {organizer.email && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            {organizer.email}
                                        </div>
                                    )}
                                    {organizer.phone_number && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                            {organizer.phone_number}
                                        </div>
                                    )}
                                </div>
                                {organizer.email && (
                                    <a
                                        href={`mailto:${organizer.email}?subject=${encodeURIComponent(`【Wacca】${event?.event_name || "イベント"}についてのお問い合わせ`)}`}
                                        className="w-full mt-4 text-xs font-medium text-store-600 hover:text-store-800 py-2.5 rounded-xl border border-store-200 text-center flex items-center justify-center gap-1.5"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        メッセージを送る
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Review Form */}
                        {canReview && organizer?.user_id && (
                            <ReviewForm
                                eventId={event.id}
                                organizerUserId={organizer.user_id}
                                existingReview={existingReview}
                            />
                        )}

                        {/* Cancel Application */}
                        {application.status !== "rejected" && (
                            <CancelApplicationButton applicationId={application.id} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ---------- Timeline logic ---------- */

interface TimelineStep {
    label: string;
    state: "completed" | "current" | "upcoming";
    date?: string;
}

function getTimelineSteps(application: any): TimelineStep[] {
    const status = application.status;
    const createdDate = application.created_at
        ? new Date(application.created_at).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
          })
        : undefined;

    if (status === "rejected") {
        return [
            { label: "申し込み完了", state: "completed", date: createdDate },
            { label: "選考中", state: "completed" },
            { label: "見送り", state: "current" },
        ];
    }

    if (status === "approved") {
        return [
            { label: "申し込み完了", state: "completed", date: createdDate },
            { label: "選考中", state: "completed" },
            { label: "承認", state: "completed" },
            { label: "追加情報提出", state: "current" },
            { label: "出店準備", state: "upcoming" },
        ];
    }

    // pending / default
    return [
        { label: "申し込み完了", state: "completed", date: createdDate },
        { label: "選考中", state: "current" },
        { label: "承認", state: "upcoming" },
        { label: "追加情報提出", state: "upcoming" },
        { label: "出店準備", state: "upcoming" },
    ];
}
