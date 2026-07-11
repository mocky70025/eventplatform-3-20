// Canonical exhibitor document set (confirmed 2026-07). Labels/columns are the
// single source of truth shared across profile registration, apply reuse, and
// the organizer's view. Only the business permit is required to apply.
export interface ExhibitorDocDef {
    key: string;
    label: string;
    urlCol: string;
    expiryCol?: string;
    required: boolean;
}

export const EXHIBITOR_DOCUMENTS: ExhibitorDocDef[] = [
    { key: "business_permit", label: "営業許可証", urlCol: "business_permit_image_url", expiryCol: "business_permit_expiry", required: true },
    { key: "food_safety", label: "食品衛生責任者証", urlCol: "business_license_image_url", expiryCol: "business_license_expiry", required: false },
    { key: "pl_insurance", label: "PL保険証書", urlCol: "pl_insurance_image_url", expiryCol: "pl_insurance_expiry", required: false },
    { key: "vehicle_inspection", label: "車検証", urlCol: "vehicle_inspection_image_url", expiryCol: "vehicle_inspection_expiry", required: false },
    { key: "fire_equipment_layout", label: "火器類配置図", urlCol: "fire_equipment_layout_image_url", required: false },
];

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
