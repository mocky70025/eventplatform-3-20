import Image from "next/image";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ReviewsSection } from "@/components/profile/ReviewsSection";
import { NotificationsSection } from "@/components/profile/NotificationsSection";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const supabase = await createClient();
    const user = await getUserWithRefresh(supabase);

    if (!user) {
        redirect("/login");
    }

    const { data: profiles } = await supabase
        .from("organizers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
    const profile = profiles?.[0] || null;

    // 直近3件の評価を取得（出店者→主催者）
    const { data: rawReviews } = await supabase
        .from("event_reviews")
        .select(`
            id,
            rating,
            comment,
            created_at,
            event_id,
            reviewer_id,
            events ( event_name ),
            exhibitors:reviewer_id ( shop_name, name )
        `)
        .eq("reviewee_id", user.id)
        .eq("reviewee_type", "organizer")
        .order("created_at", { ascending: false })
        .limit(3);

    const reviews = (rawReviews || []).map((r: any) => ({
        id: r.id,
        event_name: r.events?.event_name || "不明なイベント",
        reviewer_name: r.exhibitors?.shop_name || r.exhibitors?.name || "出店者",
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
    }));

    // Header stats
    let eventCount = 0;
    let appCount = 0;
    if (profile?.id) {
        const { data: orgEvents } = await supabase
            .from("events")
            .select("id")
            .eq("organizer_id", profile.id);
        const eventIds = (orgEvents || []).map((e: any) => e.id);
        eventCount = eventIds.length;
        if (eventIds.length > 0) {
            const { count } = await supabase
                .from("event_applications")
                .select("id", { count: "exact", head: true })
                .in("event_id", eventIds);
            appCount = count || 0;
        }
    }
    const { data: allRatings } = await supabase
        .from("event_reviews")
        .select("rating")
        .eq("reviewee_id", user.id)
        .eq("reviewee_type", "organizer");
    const reviewCount = (allRatings || []).length;
    const avgRating = reviewCount > 0
        ? (allRatings!.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviewCount)
        : null;

    const displayName = profile?.company_name || profile?.name || "主催者";
    const location = [profile?.prefecture, profile?.city_address].filter(Boolean).join("") || profile?.address || null;

    return (
        <div className="min-h-screen bg-[#fdf8f1]">

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Header card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="relative w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
                                {profile?.avatar_url ? (
                                    <Image src={profile.avatar_url} alt={displayName} fill sizes="64px" className="object-cover" />
                                ) : (
                                    displayName.charAt(0)
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900 truncate">{displayName}</h1>
                                    <span className="shrink-0 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">主催者</span>
                                </div>
                                {location && <p className="text-sm text-slate-500 mt-1 truncate">{location}</p>}
                            </div>
                        </div>
                        <a
                            href="#basic"
                            className="shrink-0 inline-flex items-center justify-center text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors"
                        >
                            プロフィールを編集
                        </a>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{eventCount}</p>
                            <p className="text-xs text-slate-500 mt-1">主催イベント</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-500">{appCount}</p>
                            <p className="text-xs text-slate-500 mt-1">累計応募</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-500">{avgRating !== null ? avgRating.toFixed(1) : "—"}</p>
                            <p className="text-xs text-slate-500 mt-1">平均評価</p>
                        </div>
                    </div>
                </div>

                {/* Two-column layout: sticky scroll-spy sidebar + stacked sections */}
                <div className="flex gap-8">
                    {/* Left sidebar nav (sticky, scroll-spy) */}
                    <ProfileSidebar />

                    {/* Right content — all sections stacked as scroll anchors */}
                    <div className="flex-1 min-w-0 space-y-8">
                        <section id="basic" className="scroll-mt-24">
                            <ProfileForm initialProfile={profile} />
                        </section>
                        <section id="reviews" className="scroll-mt-24">
                            <ReviewsSection reviews={reviews} />
                        </section>
                        <section id="notifications" className="scroll-mt-24">
                            <NotificationsSection initialProfile={profile} />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
