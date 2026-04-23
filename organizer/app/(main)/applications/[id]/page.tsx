import { createClient } from "@/lib/supabase/server";
import {
    ArrowLeft,
    Mail,
    FileText,
    MessageCircle,
    ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ApplicationStatusActions from "./ApplicationStatusActions";
import DocumentCard from "./DocumentCard";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();
    let user = null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
            user = data.user;
        }
    } catch (error: any) {
        // ignore
    }

    if (!user) {
        redirect("/login");
    }

    // Get organizer profile
    const { data: profile } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", user.id)
        .single();

    if (!profile) {
        redirect("/onboarding");
    }

    // Fetch application details with event and exhibitor
    const { data: app, error } = await supabase
        .from("event_applications")
        .select(`
            *,
            events!inner(*),
            exhibitors(*)
        `)
        .eq("id", id)
        .eq("events.organizer_id", profile.id)
        .single();

    if (error || !app) {
        notFound();
    }

    const shopInitial = app.exhibitors?.shop_name?.charAt(0) || "?";

    const statusLabel = app.status === "approved" ? "承認済み"
        : app.status === "rejected" ? "却下済み"
        : "審査中";
    const statusColor = app.status === "approved" ? "bg-emerald-100 text-emerald-700"
        : app.status === "rejected" ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="max-w-5xl mx-auto py-8 px-6">

                {/* Back Link */}
                <Link href="/applications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
                    <ArrowLeft className="w-4 h-4" />
                    出店者管理へ戻る
                </Link>

                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">申請審査</h1>
                        <p className="text-sm text-slate-500 mt-1">出店者の情報を確認し、承認または却下してください。</p>
                    </div>
                    <span className={`h-7 inline-flex items-center justify-center px-3 rounded-full text-xs font-bold ${statusColor}`} style={{ lineHeight: 1 }}>
                        {statusLabel}
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Applicant Details (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Applicant Profile Card */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-xl font-bold shrink-0">
                                    {shopInitial}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-bold text-slate-900">{app.exhibitors?.shop_name}</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">代表: {app.exhibitors?.name}</p>
                                    {app.exhibitors?.genre && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            <span className="h-6 inline-flex items-center justify-center px-2.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium" style={{ lineHeight: 1 }}>
                                                {app.exhibitors.genre}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-xs text-slate-400">応募日</p>
                                    <p className="text-sm font-semibold text-slate-700">
                                        {app.created_at ? new Date(app.created_at).toLocaleDateString("ja-JP") : "-"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-orange-500" />
                                連絡先情報
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">メール</span>
                                    <span className="text-slate-900 font-semibold">{app.exhibitors?.email || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">電話番号</span>
                                    <span className="text-slate-900 font-semibold">{app.exhibitors?.phone_number || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Message from Applicant */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-orange-500" />
                                応募者からのメッセージ
                            </h3>
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {app.message || "メッセージはありません。"}
                                </p>
                            </div>
                        </div>

                        {/* Documents Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-500" />
                                提出書類
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DocumentCard
                                    label="営業許可証"
                                    imageUrl={app.exhibitors?.business_permit_image_url}
                                    required={true}
                                />
                                <DocumentCard
                                    label="車検証"
                                    imageUrl={app.exhibitors?.vehicle_inspection_image_url}
                                />
                                <DocumentCard
                                    label="PL保険"
                                    imageUrl={app.exhibitors?.pl_insurance_image_url}
                                />
                                <DocumentCard
                                    label="火器類配置図"
                                    imageUrl={app.exhibitors?.fire_equipment_layout_image_url}
                                />
                            </div>
                        </div>

                    </div>

                    {/* Right: Sidebar (1 col) */}
                    <div className="space-y-6">

                        {/* Decision Panel */}
                        <div className="bg-white rounded-2xl border-2 border-orange-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4">審査アクション</h3>
                            <ApplicationStatusActions
                                initialStatus={app.status}
                                applicationId={app.id}
                                eventId={(app.events as any)?.id}
                            />
                        </div>

                        {/* Application Summary / Event Info */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4">応募概要</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">応募先</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.event_name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">開催日</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.event_start_date || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">会場</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.venue_name || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-400 font-medium">カテゴリ</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.genre || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-slate-400 font-medium">応募日時</span>
                                    <span className="text-slate-900 font-semibold">
                                        {app.created_at ? new Date(app.created_at).toLocaleDateString("ja-JP") : "-"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100">
                                <Link
                                    href={`/events/${app.events?.id}`}
                                    className="w-full inline-flex items-center justify-center gap-2 border border-orange-200 text-orange-600 hover:bg-orange-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    イベント管理画面を見る
                                    <ExternalLink className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}

