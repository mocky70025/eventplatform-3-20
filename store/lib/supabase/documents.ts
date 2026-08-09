import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "exhibitor-documents";

/**
 * Exhibitor documents live as storage paths in the private `exhibitor-documents`
 * bucket, so a raw value can't be rendered directly. The bucket's RLS policy
 * scopes objects to `auth.uid()`, so an exhibitor can sign their own documents
 * straight from the browser (the organizer-side equivalent needs the service
 * role, see organizer/lib/supabase/documents.ts).
 *
 * Some rows store a full URL pointing at our own bucket; extract the object path
 * from those so they can be re-signed. Truly external URLs pass through.
 */
function extractStoragePath(raw: string): { path: string } | { passthrough: string } {
    const m = raw.match(/\/exhibitor-documents\/(.+?)(?:\?|$)/);
    if (m) return { path: decodeURIComponent(m[1]) };
    if (/^https?:\/\//.test(raw)) return { passthrough: raw };
    return { path: raw };
}

/**
 * Sign many documents in a single request. The returned array lines up with
 * `raws` index-for-index; entries that are empty or fail to sign come back
 * as undefined.
 */
export async function signExhibitorDocumentUrls(
    supabase: SupabaseClient,
    raws: (string | null | undefined)[]
): Promise<(string | undefined)[]> {
    const out: (string | undefined)[] = new Array(raws.length).fill(undefined);

    // Collect the paths that actually need signing, remembering where each came from.
    const toSign: string[] = [];
    const originIndex: number[] = [];

    raws.forEach((raw, i) => {
        if (!raw) return;
        const resolved = extractStoragePath(raw);
        if ("passthrough" in resolved) {
            out[i] = resolved.passthrough;
            return;
        }
        toSign.push(resolved.path);
        originIndex.push(i);
    });

    if (toSign.length === 0) return out;

    try {
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrls(toSign, 60 * 60);
        if (error || !data) return out;

        data.forEach((entry, i) => {
            if (entry.signedUrl && !entry.error) {
                out[originIndex[i]] = entry.signedUrl;
            }
        });
    } catch {
        // Leave the failed entries undefined; callers render a placeholder.
    }

    return out;
}

/** Convenience wrapper for the single-document case (e.g. opening in a new tab). */
export async function signExhibitorDocumentUrl(
    supabase: SupabaseClient,
    raw: string | null | undefined
): Promise<string | undefined> {
    const [url] = await signExhibitorDocumentUrls(supabase, [raw]);
    return url;
}
