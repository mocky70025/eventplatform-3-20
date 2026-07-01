import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Returns the current user, retrying once via refreshSession() when the access
 * token has just expired. Server Components can't persist the refreshed cookie
 * (the proxy handles that on the next request), but this still returns a valid
 * user for the current render so an expired token doesn't cause a silent logout.
 */
export async function getUserWithRefresh(supabase: SupabaseClient) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user

    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data.user) return null
    return data.user
}
