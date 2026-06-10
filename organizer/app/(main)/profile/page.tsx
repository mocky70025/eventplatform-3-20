import { ProfileForm } from "@/components/profile/ProfileForm";
import { ReviewsSection } from "@/components/profile/ReviewsSection";
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

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Page title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">設定</h1>
                    <p className="text-sm text-slate-500 mt-1">主催者情報を管理します。出店者に公開される情報です。</p>
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
