import { Header } from "@/components/layout/Header";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ReviewsSection } from "@/components/profile/ReviewsSection";
import { MediaSection } from "@/components/profile/MediaSection";
import { DocumentsSection } from "@/components/profile/DocumentsSection";
import { NotificationsSection } from "@/components/profile/NotificationsSection";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const params = await searchParams;
    const activeTab = params.tab || "basic";

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

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Page title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">プロフィール設定</h1>
                    <p className="text-sm text-slate-500 mt-1">店舗情報や提出書類を最新の状態に保ちましょう。</p>
                </div>

                {/* Two-column layout */}
                <div className="flex gap-8">
                    {/* Left sidebar nav */}
                    <ProfileSidebar activeTab={activeTab} />

                    {/* Right content */}
                    <div className="flex-1 min-w-0">
                        {activeTab === "basic" && (
                            <ProfileForm initialProfile={profile} />
                        )}
                        {activeTab === "reviews" && (
                            <ReviewsSection reviews={reviews} />
                        )}
                        {activeTab === "media" && (
                            <MediaSection initialProfile={profile} />
                        )}
                        {activeTab === "documents" && (
                            <DocumentsSection initialProfile={profile} />
                        )}
                        {activeTab === "notifications" && (
                            <NotificationsSection initialProfile={profile} />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
