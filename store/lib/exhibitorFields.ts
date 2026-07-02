// Canonical catalog of additional-info fields an organizer can require.
// MUST stay in sync with organizer/lib/exhibitorFields.ts and the organizer
// event-create preset list — the keys are the contract between the two apps.
export interface PresetFieldDef {
    label: string;
    type: string;
    options?: string[];
}

export const PRESET_EXHIBITOR_FIELDS: Record<string, PresetFieldDef> = {
    // 基本・メニュー情報
    booth_type: { label: "出店形態", type: "select", options: ["テント", "キッチンカー", "相談可"] },
    food_categories: { label: "提供カテゴリ", type: "multiselect", options: ["主食", "軽食", "デザート", "ノンアル", "アルコール"] },
    menu_list: { label: "出店メニュー・商品リスト", type: "textarea" },
    price_range: { label: "販売価格帯", type: "text" },
    expected_sales_count: { label: "販売予定数", type: "text" },
    allergy_display: { label: "アレルギー表示の有無", type: "select", options: ["あり", "なし"] },
    booth_description: { label: "ブースの装飾・外観の説明", type: "textarea" },
    // 安全・インフラ要件
    fire_equipment: { label: "火気使用機材", type: "multiselect", options: ["ガスコンロ", "カセットコンロ", "炭火", "ガスフライヤー", "IH", "その他"] },
    generator_type: { label: "発電機の種別", type: "select", options: ["持参なし", "ガソリン式", "灯油式", "ガス式", "電動バッテリー式"] },
    fire_extinguisher: { label: "消火器の有無と有効期限", type: "radio_date", options: ["あり", "なし"] },
    power_needed: { label: "電源の要否・必要電力量", type: "text" },
    water_needed: { label: "水道の要否", type: "text" },
    tent_info: { label: "テント持参の有無・サイズ", type: "text" },
    space_size: { label: "必要なスペースサイズ", type: "text" },
    // 車両・搬入
    vehicle_entry: { label: "車両乗り入れの有無・サイズ", type: "text" },
    loading_time_preference: { label: "搬入希望時間帯", type: "text" },
    // 必須書類
    business_license: { label: "営業許可証（許可番号・自治体名・有効期限）", type: "file" },
    food_safety_cert: { label: "食品衛生責任者証", type: "file" },
    vehicle_inspection: { label: "車検証（キッチンカー選択時）", type: "file" },
    pl_insurance: { label: "PL保険証書", type: "file" },
    fire_equipment_layout: { label: "火器類配置図", type: "file" },
    allergy_info: { label: "アレルギー表示資料", type: "file" },
    // その他
    staff_count: { label: "当日のスタッフ人数", type: "text" },
    emergency_contact: { label: "当日の緊急連絡先", type: "text" },
};

export interface FormField {
    key: string;
    label: string;
    type: string;
    options?: string[];
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
                if (preset) fields.push({ key, label: preset.label, type: preset.type, options: preset.options });
            }
        }
        if (Array.isArray(raw.custom)) {
            for (const custom of raw.custom) {
                if (custom.label) {
                    fields.push({
                        key: custom.id || custom.label,
                        label: custom.label,
                        type: custom.type || "text",
                        options: custom.options,
                    });
                }
            }
        }
    } catch {
        // Invalid JSON — return whatever parsed so far
    }
    return fields;
}
