import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Store, Mail, Phone, FileText, Star } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DocumentCard from "./DocumentCard";
import ReviewForm from "./ReviewForm";

export default async function ExhibitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

    // Get organizer profile to verify access
    const { data: profile } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (!profile) {
        redirect("/onboarding");
    }

    // Fetch all applications from this exhibitor to this organizer's events
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

    // Fetch exhibitor details
    const { data: exhibitor, error } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !exhibitor) {
        notFound();
    }

    // Get ended/closed events where this exhibitor was approved (review eligible)
    const endedEvents = applications
        .filter((a: any) => {
            const s = a.events?.status;
            return (s === "ended" || s === "closed") && a.status === "approved";
        })
        .map((a: any) => ({
            id: a.events.id as string,
            event_name: a.events.event_name as string,
        }));

    // Fetch existing reviews from this organizer for this exhibitor
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

    // Application history sorted by event status
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

    return (
        <div className="min-h-screen bg-orange-50/30">

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-8">
                    <Link
                        href="/applications"
                        className="flex items-center text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors mb-4 group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        出店者管理へ戻る
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">出店者詳細</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Exhibitor Profile Card */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Store className="w-6 h-6 text-orange-600" />
                                出店者プロフィール
                            </h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shrink-0 text-2xl font-bold">
                                        {exhibitor.shop_name?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-900">
                                            {exhibitor.shop_name || "店舗名なし"}
                                        </h3>
                                        <p className="text-slate-500 font-medium">{exhibitor.name || "名前なし"}</p>
                                        {exhibitor.genre && (
                                            <span
                                                className="inline-flex items-center justify-center mt-2 h-6 px-2.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
                                                style={{ lineHeight: 1 }}
                                            >
                                                {exhibitor.genre}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {exhibitor.description && (
                                    <div className="bg-slate-50 rounded-xl p-4">
                                        <p className="text-sm text-slate-600 leading-relaxed">{exhibitor.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {exhibitor.email && (
                                        <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                            <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                                            <div className="text-sm min-w-0">
                                                <p className="text-slate-400 font-medium leading-none mb-1">メール</p>
                                                <p className="text-slate-900 font-bold truncate">{exhibitor.email}</p>
                                            </div>
                                        </div>
                                    )}
                                    {exhibitor.phone_number && (
                                        <div className="p-4 rounded-xl border border-slate-100 flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                                            <div className="text-sm">
                                                <p className="text-slate-400 font-medium leading-none mb-1">電話番号</p>
                                                <p className="text-slate-900 font-bold">{exhibitor.phone_number}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Application History */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6">応募履歴</h2>
                            <div className="divide-y divide-slate-50">
                                {eventHistory.map((ev: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{ev.eventName}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {ev.eventDate
                                                    ? new Date(ev.eventDate).toLocaleDateString("ja-JP")
                                                    : "日付未定"}
                                            </p>
                                        </div>
                                        <span
                                            className={`h-6 inline-flex items-center justify-center px-2.5 rounded-full text-[10px] font-semibold ${appStatusColor(ev.appStatus)}`}
                                            style={{ lineHeight: 1 }}
                                        >
                                            {appStatusLabel(ev.appStatus)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Documents Section */}
                        <section className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <FileText className="w-6 h-6 text-orange-600" />
                                提出書類
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DocumentCard
                                    label="営業許可証"
                                    imageUrl={exhibitor.business_permit_image_url}
                                    required
                                />
                                <DocumentCard label="車検証" imageUrl={exhibitor.vehicle_inspection_image_url} />
                                <DocumentCard label="PL保険" imageUrl={exhibitor.pl_insurance_image_url} />
                                <DocumentCard
                                    label="火器類配置図"
                                    imageUrl={exhibitor.fire_equipment_layout_image_url}
                                />
                                <DocumentCard
                                    label="自動車検査証"
                                    imageUrl={exhibitor.automobile_inspection_image_url}
                                />
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Review Panel */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100 sticky top-24">
                            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                                レビューを書く
                            </h3>
                            <p className="text-xs text-slate-400 mb-4">
                                終了したイベントについて出店者を評価できます
                            </p>
                            <ReviewForm exhibitorUserId={exhibitor.user_id} events={reviewEvents} />
                        </section>

                        {/* Actions */}
                        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">アクション</h3>
                            <div className="space-y-3">
                                {exhibitor.email && (
                                    <a
                                        href={`mailto:${exhibitor.email}`}
                                        className="w-full inline-flex items-center justify-center gap-2 border border-orange-200 text-orange-600 hover:bg-orange-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        メールを送る
                                    </a>
                                )}
                                <Link href="/applications" className="block">
                                    <Button
                                        variant="outline"
                                        className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        出店者管理に戻る
                                    </Button>
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
