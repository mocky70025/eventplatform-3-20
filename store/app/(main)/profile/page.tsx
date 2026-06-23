import { ProfileForm } from "@/components/profile/ProfileForm";
import { ReviewsSection } from "@/components/profile/ReviewsSection";
import { MediaSection } from "@/components/profile/MediaSection";
import { DocumentsSection } from "@/components/profile/DocumentsSection";
import { NotificationsSection } from "@/components/profile/NotificationsSection";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profiles } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
    const profile = profiles?.[0] || null;

    // 直近3件の評価を取得（主催者→出店者）
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
            organizers:reviewer_id ( company_name, name )
        `)
        .eq("reviewee_id", user.id)
        .eq("reviewee_type", "exhibitor")
        .order("created_at", { ascending: false })
        .limit(3);

    const reviews = (rawReviews || []).map((r: any) => ({
        id: r.id,
        event_name: r.events?.event_name || "不明なイベント",
        reviewer_name: r.organizers?.company_name || r.organizers?.name || "主催者",
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
    }));

    // Header stats
    let appCount = 0;
    let approvedCount = 0;
    if (profile?.id) {
        const { data: apps } = await supabase
            .from("event_applications")
            .select("status")
            .eq("exhibitor_id", profile.id);
        appCount = (apps || []).length;
        approvedCount = (apps || []).filter((a: any) => a.status === "approved").length;
    }
    const rating = profile?.rating as number | null;
    const displayName = profile?.shop_name || profile?.name || "出店者";
    const location = [profile?.prefecture, profile?.city].filter(Boolean).join("") || profile?.address || null;

    return (
        <div className="min-h-screen bg-[#f0fdf4]">

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Header card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-16 h-16 rounded-full bg-store-500 flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
                                {profile?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                ) : (
                                    displayName.charAt(0)
                                )}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h1 className="text-xl font-bold text-slate-900 truncate">{displayName}</h1>
                                    <span className="shrink-0 text-[10px] bg-store-100 text-store-700 px-2 py-0.5 rounded-full font-semibold">出店者</span>
                                </div>
                                <p className="text-sm text-slate-500 mt-1 truncate">
                                    {[profile?.genre, location, rating ? `★ ${rating}` : null].filter(Boolean).join("　・　")}
                                </p>
                            </div>
                        </div>
                        <a href="#basic" className="shrink-0 inline-flex items-center justify-center text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-colors">
                            プロフィールを編集
                        </a>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100 text-center">
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{approvedCount}</p>
                            <p className="text-xs text-slate-400 mt-1">出店回数</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-store-600">{rating ?? "—"}</p>
                            <p className="text-xs text-slate-400 mt-1">平均評価</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-store-600">{appCount}</p>
                            <p className="text-xs text-slate-400 mt-1">応募</p>
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
                        <section id="media" className="scroll-mt-24">
                            <MediaSection initialProfile={profile} />
                        </section>
                        <section id="documents" className="scroll-mt-24">
                            <DocumentsSection initialProfile={profile} />
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
