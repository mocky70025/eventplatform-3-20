import { createClient } from "@/lib/supabase/server";
import { signExhibitorDocuments } from "@/lib/supabase/documents";
import { getExhibitorRating } from "@/lib/ratings";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { ArrowLeft, Mail, Star } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DocumentCard from "./DocumentCard";
import ReviewForm from "./ReviewForm";

export default async function ExhibitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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
        .maybeSingle();

    if (!profile) {
        redirect("/onboarding");
    }

    const { data: applications } = await supabase
        .from("event_applications")
        .select(`
            id,
            status,
            events!inner(id, event_name, event_start_date, status, organizer_id)
        `)
        .eq("exhibitor_id", id)
        .eq("events.organizer_id", profile.id);

    if (!applications || applications.length === 0) {
        notFound();
    }

    const { data: exhibitor, error } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !exhibitor) {
        notFound();
    }

    const [permitUrl, vehicleUrl, plUrl, fireUrl, automobileUrl] = await signExhibitorDocuments([
        exhibitor.business_permit_image_url,
        exhibitor.vehicle_inspection_image_url,
        exhibitor.pl_insurance_image_url,
        exhibitor.fire_equipment_layout_image_url,
        exhibitor.automobile_inspection_image_url,
    ]);

    const endedEvents = applications
        .filter((a: any) => {
            const s = a.events?.status;
            return (s === "ended" || s === "closed") && a.status === "approved";
        })
        .map((a: any) => ({
            id: a.events.id as string,
            event_name: a.events.event_name as string,
        }));

    const { data: existingReviews } = endedEvents.length > 0
        ? await supabase
            .from("event_reviews")
            .select("event_id, rating, comment")
            .eq("reviewer_id", user.id)
            .eq("reviewee_id", exhibitor.user_id)
            .in("event_id", endedEvents.map((e) => e.id))
        : { data: [] };

    const reviewMap = new Map((existingReviews || []).map((r: any) => [r.event_id, r]));

    const reviewEvents = endedEvents.map((e) => ({
        ...e,
        existingReview: (reviewMap.get(e.id) as { rating: number; comment: string | null } | undefined) || null,
    }));

    const statusOrder: Record<string, number> = { ended: 0, closed: 1, published: 2, pending: 3, draft: 4 };
    const eventHistory = applications
        .map((a: any) => ({
            eventId: a.events?.id,
            eventName: a.events?.event_name,
            eventDate: a.events?.event_start_date,
            eventStatus: a.events?.status,
            appStatus: a.status,
        }))
        .sort((a: any, b: any) => (statusOrder[a.eventStatus] ?? 5) - (statusOrder[b.eventStatus] ?? 5));

    const appStatusLabel = (s: string) =>
        s === "approved" ? "承認済み" : s === "rejected" ? "却下" : "審査中";
    const appStatusColor = (s: string) =>
        s === "approved"
            ? "bg-emerald-100 text-emerald-700"
            : s === "rejected"
            ? "bg-red-100 text-red-700"
            : "bg-yellow-100 text-yellow-700";

    const approvedCount = applications.filter((a: any) => a.status === "approved").length;
    const ratingSummary = await getExhibitorRating(supabase, exhibitor.user_id);
    const rating = ratingSummary.avg;
    const location = [exhibitor.prefecture, exhibitor.city].filter(Boolean).join("") || exhibitor.address || null;

    const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
            <dt className="text-sm text-slate-500 sm:w-28 shrink-0">{label}</dt>
            <dd className="text-sm text-slate-900 font-medium flex-1">{value || "—"}</dd>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#fdf8f1]">
            <main className="max-w-4xl mx-auto px-6 py-8">
                <Link
                    href="/applications"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" /> 応募一覧に戻る
                </Link>

                {/* Centered header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-2xl font-bold">
                        {exhibitor.shop_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                        <h1 className="text-xl font-bold text-slate-900">{exhibitor.shop_name || "店舗名なし"}</h1>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">出店者</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {[exhibitor.genre, location, rating != null ? `★ ${rating.toFixed(1)}（${ratingSummary.count}件）` : null].filter(Boolean).join("　・　")}
                    </p>
                    <div className="flex items-center gap-10 mt-5">
                        <div><p className="text-2xl font-bold text-slate-900">{approvedCount}</p><p className="text-xs text-slate-500 mt-0.5">出店回数</p></div>
                        <div><p className="text-2xl font-bold text-slate-900">{rating != null ? rating.toFixed(1) : "—"}</p><p className="text-xs text-slate-500 mt-0.5">平均評価（{ratingSummary.count}件）</p></div>
                        <div><p className="text-2xl font-bold text-slate-900">{applications.length}</p><p className="text-xs text-slate-500 mt-0.5">応募回数</p></div>
                    </div>
                    {exhibitor.email && (
                        <a
                            href={`mailto:${exhibitor.email}`}
                            className="inline-flex items-center gap-2 mt-5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-xl px-6 py-2.5 transition-colors"
                        >
                            <Mail className="w-4 h-4" /> 連絡先を確認
                        </a>
                    )}
                </div>

                {/* Single column sections */}
                <div className="space-y-6">
                    {/* 店舗情報 */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">店舗情報</h2>
                        <dl>
                            <InfoRow label="代表者" value={exhibitor.name} />
                            <InfoRow label="ジャンル" value={exhibitor.genre} />
                            <InfoRow label="拠点" value={location} />
                            <InfoRow label="連絡先" value={exhibitor.phone_number} />
                        </dl>
                        {exhibitor.description && (
                            <p className="text-sm text-slate-600 leading-relaxed mt-3 whitespace-pre-wrap">{exhibitor.description}</p>
                        )}
                    </section>

                    {/* 応募履歴 */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">応募履歴</h2>
                        <div className="divide-y divide-slate-100">
                            {eventHistory.map((ev: any, i: number) => (
                                <div key={i} className="flex items-center justify-between py-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{ev.eventName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {ev.eventDate ? new Date(ev.eventDate).toLocaleDateString("ja-JP") : "日付未定"}
                                        </p>
                                    </div>
                                    <span className={`h-6 inline-flex items-center justify-center px-2.5 rounded-full text-xs font-semibold ${appStatusColor(ev.appStatus)}`} style={{ lineHeight: 1 }}>
                                        {appStatusLabel(ev.appStatus)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 提出書類 */}
                    <section className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">提出書類</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DocumentCard label="営業許可証" imageUrl={permitUrl} required />
                            <DocumentCard label="車検証" imageUrl={vehicleUrl} />
                            <DocumentCard label="PL保険" imageUrl={plUrl} />
                            <DocumentCard label="火器類配置図" imageUrl={fireUrl} />
                            <DocumentCard label="自動車検査証" imageUrl={automobileUrl} />
                        </div>
                    </section>

                    {/* レビューを書く */}
                    {reviewEvents.length > 0 && (
                        <section className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                レビューを書く
                            </h2>
                            <p className="text-xs text-slate-500 mb-4">終了したイベントについて出店者を評価できます</p>
                            <ReviewForm exhibitorUserId={exhibitor.user_id} events={reviewEvents} />
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}
