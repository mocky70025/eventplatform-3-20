import { createClient } from "@/lib/supabase/server";
import { getUserWithRefresh } from "@/lib/supabase/auth";
import { notFound, redirect } from "next/navigation";
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

    if (!exhibitor) redirect("/onboarding");

    // 2. Refresh Event Details
    const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*, organizers(company_name, user_id)")
        .eq("id", id)
        .single();

    if (eventError || !event) return notFound();

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
