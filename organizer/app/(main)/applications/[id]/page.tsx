import { createClient } from "@/lib/supabase/server";
import { signExhibitorDocuments } from "@/lib/supabase/documents";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { parseExhibitorFormFields, formatAnswer } from "@/lib/exhibitorFields";
import { getExhibitorRating } from "@/lib/ratings";
import {
    ArrowLeft,
    Mail,
    FileText,
    MessageCircle,
    ExternalLink,
    Star,
    ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ApplicationStatusActions from "./ApplicationStatusActions";
import DocumentCard from "./DocumentCard";
import RequestDocumentFix from "./RequestDocumentFix";

export default async function ApplicationDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const supabase = await createClient();
    let user = null;
    user = await getUserWithRefresh(supabase);

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
    const rating = await getExhibitorRating(supabase, app.exhibitors?.user_id);

    const [permitUrl, vehicleUrl, plUrl, fireUrl] = await signExhibitorDocuments([
        app.exhibitors?.business_permit_image_url,
        app.exhibitors?.vehicle_inspection_image_url,
        app.exhibitors?.pl_insurance_image_url,
        app.exhibitors?.fire_equipment_layout_image_url,
    ]);

    // Additional info the organizer required for this event, and the answers
    // the exhibitor submitted (file answers get signed for viewing).
    const formFields = parseExhibitorFormFields(app.events);
    const formAnswers = (app.form_answers ?? {}) as Record<string, any>;
    const selectedDays: string[] = Array.isArray(formAnswers.selected_days) ? formAnswers.selected_days : [];
    const fileFieldKeys = formFields.filter((f) => f.type === "file").map((f) => f.key);
    const signedFiles = await signExhibitorDocuments(fileFieldKeys.map((k) => formAnswers[k]));
    const fileUrlByKey: Record<string, string | undefined> = {};
    fileFieldKeys.forEach((k, i) => { fileUrlByKey[k] = signedFiles[i]; });
    const hasAdditionalInfo = formFields.length > 0 || selectedDays.length > 0;

    const statusLabel = app.status === "approved" ? "承認済み"
        : app.status === "rejected" ? "却下済み"
        : "審査中";
    const statusColor = app.status === "approved" ? "bg-emerald-100 text-emerald-700"
        : app.status === "rejected" ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

    return (
        <div className="min-h-screen bg-[#fdf8f1]">

            <main className="max-w-5xl mx-auto py-8 px-6">

                {/* Back Link */}
                <Link href="/applications" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    応募一覧に戻る
                </Link>

                {/* Header card (full width) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between gap-5">
                        <div className="flex items-start gap-4 min-w-0">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-lg font-bold shrink-0">
                                {shopInitial}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900 truncate">{app.exhibitors?.shop_name}</h1>
                                    <span className={`shrink-0 h-6 inline-flex items-center justify-center px-2.5 rounded-full text-xs font-semibold ${statusColor}`} style={{ lineHeight: 1 }}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1">
                                    {[app.exhibitors?.genre, app.exhibitors?.name && `代表: ${app.exhibitors.name}`].filter(Boolean).join("　・　")}
                                </p>
                                {rating.count > 0 && (
                                    <div className="flex items-center gap-1 mt-1.5 text-sm">
                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                        <span className="font-bold text-slate-900">{rating.avg!.toFixed(1)}</span>
                                        <span className="text-slate-500">（{rating.count}件の評価）</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                    {app.exhibitors?.rating && (
                                        <span className="inline-flex items-center gap-1 text-slate-700">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            {app.exhibitors.rating}
                                        </span>
                                    )}
                                    <span className="text-slate-500">
                                        申請日 {app.created_at ? new Date(app.created_at).toLocaleDateString("ja-JP") : "-"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="shrink-0 text-right">
                            <p className="text-xs text-slate-500">応募イベント</p>
                            <p className="text-sm font-semibold text-slate-700 mt-0.5">{app.events?.event_name}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Applicant Details (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Contact Info */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Mail className="w-5 h-5 text-orange-500" />
                                連絡先情報
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 font-medium">メール</span>
                                    <span className="text-slate-900 font-semibold">{app.exhibitors?.email || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 font-medium">電話番号</span>
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
                                    imageUrl={permitUrl}
                                    required={true}
                                />
                                <DocumentCard
                                    label="車検証"
                                    imageUrl={vehicleUrl}
                                />
                                <DocumentCard
                                    label="PL保険"
                                    imageUrl={plUrl}
                                />
                                <DocumentCard
                                    label="火器類配置図"
                                    imageUrl={fireUrl}
                                />
                            </div>
                            {app.exhibitors?.user_id && (
                                <RequestDocumentFix
                                    exhibitorUserId={app.exhibitors.user_id}
                                    eventId={(app.events as any)?.id}
                                    eventName={(app.events as any)?.event_name || "イベント"}
                                    applicationId={app.id}
                                />
                            )}
                        </div>

                        {/* Additional Info Section */}
                        {hasAdditionalInfo && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-orange-500" />
                                    追加情報
                                </h3>
                                <div className="space-y-4">
                                    {selectedDays.length > 0 && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-500 mb-1">出店希望日</p>
                                            <p className="text-sm text-slate-900">{selectedDays.join("、")}</p>
                                        </div>
                                    )}
                                    {formFields.map((f) => {
                                        const display = formatAnswer(formAnswers[f.key]);
                                        return (
                                            <div key={f.key}>
                                                <p className="text-xs font-semibold text-slate-500 mb-1">{f.label}</p>
                                                {f.type === "file" ? (
                                                    fileUrlByKey[f.key] ? (
                                                        <a
                                                            href={fileUrlByKey[f.key]}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 underline"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            ファイルを開く
                                                        </a>
                                                    ) : (
                                                        <p className="text-sm text-slate-500">未提出</p>
                                                    )
                                                ) : display ? (
                                                    <p className="text-sm text-slate-900 whitespace-pre-wrap">{display}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-500">未回答</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
                                    <span className="text-slate-500 font-medium">応募先</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.event_name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 font-medium">開催日</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.event_start_date || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 font-medium">会場</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.venue_name || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-50">
                                    <span className="text-slate-500 font-medium">カテゴリ</span>
                                    <span className="text-slate-900 font-semibold">{app.events?.genre || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-slate-500 font-medium">応募日時</span>
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

