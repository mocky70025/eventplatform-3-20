import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generate a signed URL for a private storage file.
 * Falls back to public URL for backward compatibility with existing data.
 * @param supabase - Supabase client instance
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket (or a full public URL for backward compat)
 * @param expiresIn - Signed URL expiry in seconds (default: 1 hour)
 */
export async function getSignedUrl(
    supabase: SupabaseClient,
    bucket: string,
    path: string,
    expiresIn = 3600
): Promise<string | null> {
    if (!path) return null;

    // Backward compatibility: if path is already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        console.error(`Failed to create signed URL for ${bucket}/${path}:`, error.message);
        return null;
    }

    return data.signedUrl;
}

/**
 * Generate signed URLs for multiple document fields.
 */
export async function getSignedDocumentUrls(
    supabase: SupabaseClient,
    profile: Record<string, any>,
    bucket: string
): Promise<Record<string, string | null>> {
    const documentFields = [
        'business_license_image_url',
        'vehicle_inspection_image_url',
        'pl_insurance_image_url',
        'fire_equipment_layout_image_url',
    ];

    const urls: Record<string, string | null> = {};

    await Promise.all(
        documentFields.map(async (field) => {
            if (profile[field]) {
                urls[field] = await getSignedUrl(supabase, bucket, profile[field]);
            } else {
                urls[field] = null;
            }
        })
    );

    return urls;
}
