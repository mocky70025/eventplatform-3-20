import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ApplyClient from "./ApplyClient";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ApplyPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Check Auth & Profile
    const user = await getUserWithRefresh(supabase);
    if (!user) redirect("/login");

    const { data: exhibitors } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
    const exhibitor = exhibitors?.[0];

    // 2. Refresh Event Details
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*, organizers(company_name, user_id)")
        .eq("id", id)
        .eq("status", "published")
        .or("visibility.eq.public,visibility.is.null")
        .single();

    if (eventError || !event) return notFound();

    const missingFields = [
        !exhibitor?.shop_name && "店舗名",
        !exhibitor?.name && "代表者名",
        !exhibitor?.phone_number && "電話番号",
        !exhibitor?.prefecture && "都道府県",
        !exhibitor?.city_address && "市区町村・番地",
        !exhibitor?.business_permit_image_url && "営業許可証",
    ].filter(Boolean) as string[];

    if (missingFields.length > 0) {
        const documentsOnly = missingFields.length === 1 && missingFields[0] === "営業許可証";
        return (
            <div className="min-h-screen bg-[#f0fdf4]">
                <main className="container mx-auto max-w-2xl px-4 py-8">
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                        <h1 className="text-lg font-bold text-amber-900">応募前にプロフィールを完成してください</h1>
                        <p className="mt-2 text-sm text-amber-800">未登録: {missingFields.join("、")}</p>
                        <Link href={documentsOnly ? "/profile#documents" : "/profile"} className="mt-5 inline-flex rounded-xl bg-store-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-store-600">
                            {documentsOnly ? "営業許可証を登録する" : "プロフィールを編集する"}
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    // 3. Check for existing application (use maybeSingle to avoid error when no rows)
    const { data: existingApp } = await supabase
        .from("event_applications")
        .select("id")
        .eq("event_id", id)
        .eq("exhibitor_id", exhibitor.id)
        .maybeSingle();

    if (existingApp) {
        redirect(`/events/${id}`);
    }

    return (
        <div className="min-h-screen bg-[#f0fdf4]">
            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <ApplyClient event={event} exhibitor={exhibitor} />
            </main>
        </div>
    );
}
