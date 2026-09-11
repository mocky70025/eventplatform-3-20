// Canonical exhibitor document set (confirmed 2026-07). Labels/columns are the
// single source of truth shared across profile registration, apply reuse, and
// the organizer's view. Only the business permit is required to apply.
export interface ExhibitorDocDef {
    key: string;
    label: string;
    urlCol: string;
    expiryCol?: string;
    required: boolean;
    /** Shown under the label as a hint. */
    desc?: string;
    /** Present only for documents the AI reader supports (see /api/verify-document). */
    ai?: { type: string };
}

export const EXHIBITOR_DOCUMENTS: ExhibitorDocDef[] = [
    { key: "business_permit", label: "営業許可証", urlCol: "business_permit_image_url", expiryCol: "business_permit_expiry", required: false, ai: { type: "businessLicense" }, desc: "応募時に必須です。後からでも登録できます。" },
    { key: "food_safety", label: "食品衛生責任者証", urlCol: "business_license_image_url", expiryCol: "business_license_expiry", required: false },
    { key: "pl_insurance", label: "PL保険証書", urlCol: "pl_insurance_image_url", expiryCol: "pl_insurance_expiry", required: false },
    { key: "vehicle_inspection", label: "車検証", urlCol: "vehicle_inspection_image_url", expiryCol: "vehicle_inspection_expiry", required: false, desc: "キッチンカーの車検証をアップロードしてください" },
    { key: "fire_equipment_layout", label: "火器類配置図", urlCol: "fire_equipment_layout_image_url", required: false, desc: "火気を使用する場合に必要です" },
];

// --- File validation (single source of truth for every document upload UI) ---

export const DOC_MAX_FILE_SIZE = 10 * 1024 * 1024;
export const DOC_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
/** Value for an <input type="file"> accept attribute. */
export const DOC_ACCEPT = "image/*,.pdf";

/** Returns an error message, or null when the file is acceptable. */
export function validateDocumentFile(file: File): string | null {
    if (file.size > DOC_MAX_FILE_SIZE) {
        return "ファイルサイズが大きすぎます（最大10MB）";
    }
    if (!DOC_ALLOWED_MIME_TYPES.includes(file.type)) {
        return "対応していないファイル形式です（JPEG, PNG, GIF, WebP, PDFのみ）";
    }
    return null;
}

/** Accepts a MIME type, file name, or storage path. PDFs cannot render in an <img>. */
export function isPdfLike(nameOrMime: string | null | undefined): boolean {
    if (!nameOrMime) return false;
    const v = nameOrMime.toLowerCase();
    return v === "application/pdf" || v.split("?")[0].endsWith(".pdf");
}

export interface RegisteredDoc extends ExhibitorDocDef {
    url: string;
    expiry: string | null;
    expired: boolean;
}

/** Resolve which documents an exhibitor has registered, with expiry validity. */
export function getRegisteredDocuments(exhibitor: any): RegisteredDoc[] {
    const today = new Date().toISOString().slice(0, 10);
    const out: RegisteredDoc[] = [];
    for (const d of EXHIBITOR_DOCUMENTS) {
        const url = exhibitor?.[d.urlCol];
        if (!url) continue;
        const expiry = d.expiryCol ? (exhibitor[d.expiryCol] || null) : null;
        out.push({ ...d, url, expiry, expired: !!expiry && expiry < today });
    }
    return out;
}
