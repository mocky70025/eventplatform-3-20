import { createAdminClient } from "./admin";

const BUCKET = "exhibitor-documents";

/**
 * Exhibitor documents are stored as storage paths in the private
 * `exhibitor-documents` bucket, so a raw path can't be rendered directly.
 * Convert each path to a short-lived signed URL (service role, server-side)
 * so an authorized organizer can view the applicant's documents.
 * Values that are already full URLs are passed through unchanged.
 */
export async function signExhibitorDocuments(
    paths: (string | null | undefined)[]
): Promise<(string | undefined)[]> {
    const admin = createAdminClient();
    return Promise.all(
        paths.map(async (path) => {
            if (!path) return undefined;
            if (/^https?:\/\//.test(path)) return path;
            try {
                const { data, error } = await admin.storage
                    .from(BUCKET)
                    .createSignedUrl(path, 60 * 60);
                if (error || !data) return undefined;
                return data.signedUrl;
            } catch {
                return undefined;
            }
        })
    );
}
