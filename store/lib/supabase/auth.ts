import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the current user (as { id, email }).
 *
 * Fast path: verify the JWT locally via getClaims() — no round-trip to the
 * Auth server. The proxy middleware already validated/refreshed the session on
 * this request, so the claims are trustworthy here. Falls back to getUser()
 * (plus one refresh) if claims can't be read, so an expired token doesn't cause
 * a silent logout.
 */
export async function getUserWithRefresh(
    supabase: SupabaseClient
): Promise<{ id: string; email?: string } | null> {
    try {
        const { data, error } = await (supabase.auth as any).getClaims()
        const claims = data?.claims
        if (!error && claims?.sub) {
            return { id: claims.sub as string, email: claims.email as string | undefined }
        }
    } catch {
        // fall through to the network path
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) return { id: user.id, email: user.email }

    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.user) return null
    return { id: data.user.id, email: data.user.email }
}
