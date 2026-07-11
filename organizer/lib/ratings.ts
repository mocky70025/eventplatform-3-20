import type { SupabaseClient } from "@supabase/supabase-js";

export interface RatingSummary {
    avg: number | null;
    count: number;
}

/** Average exhibitor rating (reviews written about the exhibitor), computed on read. */
export async function getExhibitorRating(
    supabase: SupabaseClient,
    exhibitorUserId: string | null | undefined
): Promise<RatingSummary> {
    if (!exhibitorUserId) return { avg: null, count: 0 };
    const { data } = await supabase
        .from("event_reviews")
        .select("rating")
        .eq("reviewee_id", exhibitorUserId)
        .eq("reviewee_type", "exhibitor");
    const ratings = (data || []).map((r: any) => r.rating).filter((n: any) => typeof n === "number");
    if (ratings.length === 0) return { avg: null, count: 0 };
    return { avg: ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length, count: ratings.length };
}

/** Batch: average exhibitor ratings keyed by reviewee (exhibitor user id). */
export async function getExhibitorRatingsMap(
    supabase: SupabaseClient,
    exhibitorUserIds: string[]
): Promise<Map<string, RatingSummary>> {
    const map = new Map<string, RatingSummary>();
    const ids = [...new Set(exhibitorUserIds.filter(Boolean))];
    if (ids.length === 0) return map;
    const { data } = await supabase
        .from("event_reviews")
        .select("reviewee_id, rating")
        .in("reviewee_id", ids)
        .eq("reviewee_type", "exhibitor");
    const agg = new Map<string, number[]>();
    for (const r of (data || []) as any[]) {
        const arr = agg.get(r.reviewee_id) || [];
        arr.push(r.rating);
        agg.set(r.reviewee_id, arr);
    }
    for (const [id, arr] of agg) {
        map.set(id, { avg: arr.reduce((a, b) => a + b, 0) / arr.length, count: arr.length });
    }
    return map;
}
