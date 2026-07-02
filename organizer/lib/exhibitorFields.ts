// Preset additional-info fields an organizer can require from exhibitors.
// Mirrors the definitions used by the store apply form so labels/types match.
export const PRESET_EXHIBITOR_FIELDS: Record<string, { label: string; type: string }> = {
    menu_list: { label: "出店メニュー・商品リスト", type: "textarea" },
    price_range: { label: "販売価格帯", type: "text" },
    booth_description: { label: "ブースの装飾・外観の説明", type: "textarea" },
    power_needed: { label: "電源の要否・必要電力量", type: "text" },
    water_needed: { label: "水道の要否", type: "text" },
    gas_usage: { label: "ガス使用の有無", type: "text" },
    tent_info: { label: "テント持参の有無・サイズ", type: "text" },
    space_size: { label: "必要なスペースサイズ", type: "text" },
    vehicle_entry: { label: "車両乗り入れの有無・サイズ", type: "text" },
    loading_time_preference: { label: "搬入希望時間帯", type: "text" },
    food_safety_cert: { label: "食品衛生責任者証", type: "file" },
    business_license: { label: "営業許可証（保健所）", type: "file" },
    pl_insurance: { label: "PL保険証書", type: "file" },
    fire_equipment_layout: { label: "火器類配置図", type: "file" },
    vehicle_inspection: { label: "車検証", type: "file" },
    allergy_info: { label: "アレルギー表示", type: "file" },
    staff_count: { label: "当日のスタッフ人数", type: "text" },
    emergency_contact: { label: "当日の緊急連絡先", type: "text" },
};

export interface FormField {
    key: string;
    label: string;
    type: string;
}

/** Parse an event's `exhibitor_form_fields` JSON into an ordered field list. */
export function parseExhibitorFormFields(event: any): FormField[] {
    const fields: FormField[] = [];
    try {
        const raw = typeof event?.exhibitor_form_fields === "string"
            ? JSON.parse(event.exhibitor_form_fields)
            : event?.exhibitor_form_fields;
        if (!raw) return fields;

        if (Array.isArray(raw.preset)) {
            for (const key of raw.preset) {
                const preset = PRESET_EXHIBITOR_FIELDS[key];
                if (preset) fields.push({ key, label: preset.label, type: preset.type });
            }
        }
        if (Array.isArray(raw.custom)) {
            for (const custom of raw.custom) {
                if (custom.label) {
                    fields.push({ key: custom.id || custom.label, label: custom.label, type: custom.type || "text" });
                }
            }
        }
    } catch {
        // Invalid JSON — return whatever parsed so far
    }
    return fields;
}
