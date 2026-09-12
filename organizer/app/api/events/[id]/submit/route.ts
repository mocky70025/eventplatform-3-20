import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabase.rpc("submit_organizer_event", { p_event_id: id });
    if (error) return NextResponse.json({ error: "必須項目を確認してから提出してください。" }, { status: 400 });

    return NextResponse.json({ ok: true });
}
