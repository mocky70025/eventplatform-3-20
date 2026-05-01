"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
    ChevronRight, ChevronLeft, Calendar, MapPin,
    ImageIcon, FileText, CheckCircle2, Users, Upload, Clock, AlertCircle, Search,
    Shield, Phone, Mail, User, Truck, ClipboardList, Plus, X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

// 出店者に求める情報のプリセット項目
type PresetField = {
    key: string;
    label: string;
    category: string;
    type: "text" | "textarea" | "file" | "select" | "multiselect" | "radio_date";
    options?: string[];
};

const PRESET_EXHIBITOR_FIELDS: PresetField[] = [
    // 基本・メニュー情報
    { key: "booth_type", label: "出店形態", type: "select", options: ["テント", "キッチンカー", "相談可"], category: "基本・メニュー情報" },
    { key: "food_categories", label: "提供カテゴリ", type: "multiselect", options: ["主食", "軽食", "デザート", "ノンアル", "アルコール"], category: "基本・メニュー情報" },
    { key: "menu_list", label: "出店メニュー・商品リスト", type: "textarea", category: "基本・メニュー情報" },
    { key: "price_range", label: "販売価格帯", type: "text", category: "基本・メニュー情報" },
    { key: "expected_sales_count", label: "販売予定数", type: "text", category: "基本・メニュー情報" },
    { key: "allergy_display", label: "アレルギー表示の有無", type: "select", options: ["あり", "なし"], category: "基本・メニュー情報" },
    { key: "booth_description", label: "ブースの装飾・外観の説明", type: "textarea", category: "基本・メニュー情報" },
    // 安全・インフラ要件
    { key: "fire_equipment", label: "火気使用機材", type: "multiselect", options: ["ガスコンロ", "カセットコンロ", "炭火", "ガスフライヤー", "IH", "その他"], category: "安全・インフラ要件" },
    { key: "generator_type", label: "発電機の種別", type: "select", options: ["持参なし", "ガソリン式", "灯油式", "ガス式", "電動バッテリー式"], category: "安全・インフラ要件" },
    { key: "fire_extinguisher", label: "消火器の有無と有効期限", type: "radio_date", category: "安全・インフラ要件" },
    { key: "power_needed", label: "電源の要否・必要電力量", type: "text", category: "安全・インフラ要件" },
    { key: "water_needed", label: "水道の要否", type: "text", category: "安全・インフラ要件" },
    { key: "tent_info", label: "テント持参の有無・サイズ", type: "text", category: "安全・インフラ要件" },
    { key: "space_size", label: "必要なスペースサイズ", type: "text", category: "安全・インフラ要件" },
    // 車両・搬入
    { key: "vehicle_entry", label: "車両乗り入れの有無・サイズ", type: "text", category: "車両・搬入" },
    { key: "loading_time_preference", label: "搬入希望時間帯", type: "text", category: "車両・搬入" },
    // 必須書類
    { key: "business_license", label: "営業許可証（許可番号・自治体名・有効期限）", type: "file", category: "必須書類" },
    { key: "food_safety_cert", label: "食品衛生責任者証", type: "file", category: "必須書類" },
    { key: "vehicle_inspection", label: "車検証（キッチンカー選択時）", type: "file", category: "必須書類" },
    { key: "pl_insurance", label: "PL保険証書", type: "file", category: "必須書類" },
    { key: "fire_equipment_layout", label: "火器類配置図", type: "file", category: "必須書類" },
    { key: "allergy_info", label: "アレルギー表示資料", type: "file", category: "必須書類" },
    // その他
    { key: "staff_count", label: "当日のスタッフ人数", type: "text", category: "その他" },
    { key: "emergency_contact", label: "当日の緊急連絡先", type: "text", category: "その他" },
];

// プリセット項目の表示用ラベルとスタイル
const TYPE_BADGE: Record<PresetField["type"], { label: string; class: string }> = {
    text: { label: "テキスト", class: "bg-slate-100 text-slate-500" },
    textarea: { label: "長文", class: "bg-slate-100 text-slate-500" },
    file: { label: "画像", class: "bg-blue-50 text-blue-600" },
    select: { label: "単一選択", class: "bg-purple-50 text-purple-600" },
    multiselect: { label: "複数選択", class: "bg-emerald-50 text-emerald-600" },
    radio_date: { label: "選択+日付", class: "bg-amber-50 text-amber-600" },
};

const TARGET_AUDIENCE_OPTIONS = ["ファミリー", "学生・若者", "20〜30代", "40〜50代", "高齢者", "インバウンド・外国人", "ビジネスパーソン"];
const RESTRICTION_OPTIONS = ["火気厳禁", "アルコールNG", "匂いの強いものNG", "大音量NG", "ペットNG", "喫煙NG", "車両乗り入れNG"];
const FOOD_CATEGORIES = ["主食", "軽食・スナック", "デザート・スイーツ", "ノンアル飲料", "アルコール飲料", "雑貨・物販", "体験・ワークショップ", "その他"];

type CustomField = {
    id: string;
    label: string;
    type: "text" | "file";
};

export default function CreateEventPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isApproved, setIsApproved] = useState<boolean | null>(null);
    const [isCheckingApproval, setIsCheckingApproval] = useState(true);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkApproval = async () => {
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    await supabase.auth.signOut();
                    router.push("/login");
                    return;
                }

                const { data: profile } = await supabase
                    .from("organizers")
                    .select("is_approved, company_name, name, email, phone_number")
                    .eq("user_id", user.id)
                    .single();

                if (profile) {
                    setIsApproved(profile.is_approved || false);
                    setFormData(prev => ({
                        ...prev,
                        organizerName: prev.organizerName || profile.company_name || profile.name || "",
                        organizerEmail: prev.organizerEmail || profile.email || "",
                        organizerPhone: prev.organizerPhone || profile.phone_number || "",
                    }));
                } else {
                    router.push("/onboarding");
                }
            } catch (err) {
                setError("承認状態の確認に失敗しました");
            } finally {
                setIsCheckingApproval(false);
            }
        };

        checkApproval();
    }, [supabase, router]);

    // Form State
    const [formData, setFormData] = useState({
        eventName: "",
        genre: "",
        description: "",
        boothContent: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        postponedType: "none" as "none" | "date",
        postponedDate: "",
        postponedDates: [] as Array<{ date: string; postponed_to: string }>,
        postponedNote: "",
        appDeadline: "",
        venueName: "",
        zipCode: "",
        address: "",
        recruitCount: 10,
        fee: "",
        venueRules: "",
        venueLayout: null as string | null,
        termsCompliance: "",
        boothQualification: "",
        privacyPolicy: "",
        cancelPolicy: "",
        organizerName: "",
        organizerEmail: "",
        organizerPhone: "",
        mainImage: null as string | null,
        loadingInfo: "",
        selectedExhibitorFields: [] as string[],
        visibility: "public" as "public" | "private",
        usePerDaySchedule: false,
        eventSchedule: [] as Array<{ date: string; start_time: string; end_time: string }>,
        usePerDaySettings: false,
        eventDaySettings: [] as Array<{ date: string; recruit_count: number; fee: string; notes: string }>,
        targetAudience: [] as string[],
        expectedVisitors: "",
        powerSupply: "" as "yes" | "no" | "",
        waterSupply: "" as "yes" | "no" | "",
        restrictions: [] as string[],
        categorySlots: [] as Array<{ category: string; count: number }>,
        exhibitorListVisibility: "all" as "all" | "category" | "none",
    });

    const [customFields, setCustomFields] = useState<CustomField[]>([]);

    const [files, setFiles] = useState<{ main: File | null; layout: File | null }>({
        main: null,
        layout: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    // 日付範囲から日付リストを生成
    const getDateRange = (start: string, end: string): string[] => {
        if (!start || !end || start === end) return [];
        const dates: string[] = [];
        const current = new Date(start);
        const last = new Date(end);
        while (current <= last) {
            dates.push(current.toISOString().split("T")[0]);
            current.setDate(current.getDate() + 1);
        }
        return dates;
    };

    const isMultiDay = formData.startDate && formData.endDate && formData.startDate !== formData.endDate;
    const dateRange = isMultiDay ? getDateRange(formData.startDate, formData.endDate) : [];

    const initPerDaySchedule = () => {
        setFormData(prev => ({
            ...prev,
            usePerDaySchedule: true,
            eventSchedule: dateRange.map(d => ({
                date: d,
                start_time: prev.startTime || "10:00",
                end_time: prev.endTime || "18:00",
            })),
        }));
    };

    const initPerDaySettings = () => {
        setFormData(prev => ({
            ...prev,
            usePerDaySettings: true,
            eventDaySettings: dateRange.map(d => ({
                date: d,
                recruit_count: prev.recruitCount || 10,
                fee: prev.fee || "",
                notes: "",
            })),
        }));
    };

    // 日付変更時に日別設定を同期
    useEffect(() => {
        if (formData.usePerDaySchedule && dateRange.length > 0) {
            setFormData(prev => {
                const existing = new Map(prev.eventSchedule.map(s => [s.date, s]));
                return {
                    ...prev,
                    eventSchedule: dateRange.map(d => existing.get(d) || {
                        date: d,
                        start_time: prev.startTime || "10:00",
                        end_time: prev.endTime || "18:00",
                    }),
                };
            });
        }
        if (formData.usePerDaySettings && dateRange.length > 0) {
            setFormData(prev => {
                const existing = new Map(prev.eventDaySettings.map(s => [s.date, s]));
                return {
                    ...prev,
                    eventDaySettings: dateRange.map(d => existing.get(d) || {
                        date: d,
                        recruit_count: prev.recruitCount || 10,
                        fee: prev.fee || "",
                        notes: "",
                    }),
                };
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.startDate, formData.endDate]);

    const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "main" | "layout") => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                setError("ファイルサイズは10MB以下にしてください。");
                e.target.value = '';
                return;
            }
            if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
                setError("対応していない画像形式です（JPEG, PNG, GIF, WebPのみ）");
                e.target.value = '';
                return;
            }
            setError("");
            const url = URL.createObjectURL(file);
            if (field === "main") {
                setFormData(prev => ({ ...prev, mainImage: url }));
                setFiles(prev => ({ ...prev, main: file }));
            } else {
                setFormData(prev => ({ ...prev, venueLayout: url }));
                setFiles(prev => ({ ...prev, layout: file }));
            }
        }
    };

    const toggleExhibitorField = (key: string) => {
        setFormData(prev => ({
            ...prev,
            selectedExhibitorFields: prev.selectedExhibitorFields.includes(key)
                ? prev.selectedExhibitorFields.filter(k => k !== key)
                : [...prev.selectedExhibitorFields, key],
        }));
    };

    const addCustomField = (type: "text" | "file") => {
        const id = `custom_${type}_${Date.now()}`;
        setCustomFields(prev => [...prev, { id, label: type === "text" ? "テキスト" : "画像", type }]);
    };

    const removeCustomField = (id: string) => {
        setCustomFields(prev => prev.filter(f => f.id !== id));
    };

    const updateCustomFieldLabel = (id: string, label: string) => {
        setCustomFields(prev => prev.map(f => f.id === id ? { ...f, label } : f));
    };

    const [showErrors, setShowErrors] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone: string) => /^[0-9\-]{10,13}$/.test(phone);

    const validateField = (name: string, value: string) => {
        if (name === "organizerEmail" && value && !isValidEmail(value)) {
            setFieldErrors(prev => ({ ...prev, [name]: "正しいメールアドレスを入力してください" }));
        } else if (name === "organizerPhone" && value && !isValidPhone(value)) {
            setFieldErrors(prev => ({ ...prev, [name]: "正しい電話番号を入力してください（半角数字・ハイフン、10〜13桁）" }));
        } else {
            setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
        }
    };

    const handleNext = () => {
        if (!canProceed()) {
            setShowErrors(true);
            // Scroll to the first error field
            setTimeout(() => {
                const errorEl = document.querySelector('.text-red-500, .border-red-400');
                if (errorEl) {
                    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 100);
            return;
        }
        setShowErrors(false);
        setStep(prev => prev + 1);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    };
    const handleBack = () => {
        setShowErrors(false);
        setStep(prev => prev - 1);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    };

    const searchAddress = async () => {
        const cleanZip = formData.zipCode.replace(/[-\s]/g, "");
        if (!cleanZip || !/^\d{7}$/.test(cleanZip)) {
            setError("正しい郵便番号を入力してください（数字7桁）");
            return;
        }

        setIsLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/zipcode?zipcode=${cleanZip}`);
            const data = await res.json();

            if (data.results && data.results[0]) {
                const result = data.results[0];
                const addr = `${result.address1}${result.address2}${result.address3}`;
                setFormData(prev => ({ ...prev, address: addr }));
                setError("");
            } else {
                setError(data.message || "住所が見つかりませんでした。");
            }
        } catch (err) {
            setError("住所の検索に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    const uploadImage = async (userId: string, file: File, prefix: string) => {
        const fileExt = (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
            throw new Error(`対応していない画像形式です（${ALLOWED_IMAGE_EXTENSIONS.join(', ')}のみ）`);
        }
        const fileName = `${userId}/${prefix}_${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('event-images')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('event-images')
            .getPublicUrl(fileName);
        return publicUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        // Client-side validation
        if (!formData.eventName.trim()) {
            setError("イベント名を入力してください。");
            setIsLoading(false);
            return;
        }
        if (!formData.startDate) {
            setError("開催開始日を入力してください。");
            setIsLoading(false);
            return;
        }
        if (!formData.venueName.trim()) {
            setError("会場名を入力してください。");
            setIsLoading(false);
            return;
        }
        if (formData.zipCode) {
            const cleanZip = formData.zipCode.replace(/[-\s]/g, "");
            if (!/^\d{7}$/.test(cleanZip)) {
                setError("郵便番号は7桁の数字で入力してください。");
                setIsLoading(false);
                return;
            }
        }
        if (formData.organizerEmail && !isValidEmail(formData.organizerEmail)) {
            setError("有効なメールアドレスを入力してください。");
            setIsLoading(false);
            return;
        }
        if (formData.organizerPhone && !isValidPhone(formData.organizerPhone)) {
            setError("有効な電話番号を入力してください（半角数字・ハイフン、10〜13桁）。");
            setIsLoading(false);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインセッションが見つかりません。");

            const { data: profile, error: profileError } = await supabase
                .from("organizers")
                .select("id, is_approved")
                .eq("user_id", user.id)
                .single();

            if (profileError || !profile) {
                throw new Error("主催者プロフィールが見つかりません。");
            }

            if (!profile.is_approved) {
                throw new Error("アカウントがまだ承認されていません。");
            }

            let mainImageUrl = "";
            let venueLayoutUrl = "";

            if (files.main) {
                mainImageUrl = await uploadImage(user.id, files.main, "main");
            }
            if (files.layout) {
                venueLayoutUrl = await uploadImage(user.id, files.layout, "layout");
            }

            const { error: insertError } = await supabase
                .from("events")
                .insert({
                    organizer_id: profile.id,
                    event_name: formData.eventName,
                    genre: formData.genre,
                    description: formData.description,
                    booth_content: formData.boothContent,
                    event_start_date: formData.startDate,
                    event_end_date: formData.endDate || formData.startDate,
                    event_time: `${formData.startTime} - ${formData.endTime}`,
                    postponed_date: formData.postponedType === "date" && !isMultiDay ? formData.postponedDate : null,
                    postponed_dates: formData.postponedType === "date" && isMultiDay && formData.postponedDates.length > 0
                        ? JSON.stringify(formData.postponedDates) : null,
                    postponed_note: formData.postponedType === "date" && formData.postponedNote ? formData.postponedNote : null,
                    application_period_end: formData.appDeadline,
                    venue_name: formData.venueName,
                    address: formData.address,
                    recruit_count: formData.recruitCount,
                    fee: formData.fee,
                    venue_rules: formData.venueRules,
                    venue_layout_url: venueLayoutUrl || null,
                    terms_compliance: formData.termsCompliance,
                    booth_qualification: formData.boothQualification,
                    privacy_policy: formData.privacyPolicy,
                    cancel_policy: formData.cancelPolicy,
                    organizer_name: formData.organizerName,
                    organizer_email: formData.organizerEmail,
                    organizer_phone: formData.organizerPhone,
                    loading_info: formData.loadingInfo || null,
                    main_image_url: mainImageUrl,
                    exhibitor_form_fields: JSON.stringify({
                        preset: formData.selectedExhibitorFields,
                        custom: customFields,
                    }),
                    status: 'pending',
                    visibility: formData.visibility,
                    event_schedule: formData.usePerDaySchedule && formData.eventSchedule.length > 0
                        ? JSON.stringify(formData.eventSchedule) : null,
                    event_day_settings: formData.usePerDaySettings && formData.eventDaySettings.length > 0
                        ? JSON.stringify(formData.eventDaySettings) : null,
                    target_audience: formData.targetAudience.length > 0 ? JSON.stringify(formData.targetAudience) : null,
                    expected_visitors: formData.expectedVisitors ? parseInt(formData.expectedVisitors) : null,
                    power_supply: formData.powerSupply === "yes",
                    water_supply: formData.waterSupply === "yes",
                    restrictions: formData.restrictions.length > 0 ? JSON.stringify(formData.restrictions) : null,
                    category_slots: formData.categorySlots.length > 0 ? JSON.stringify(formData.categorySlots) : null,
                    exhibitor_list_visibility: formData.exhibitorListVisibility,
                });

            if (insertError) throw insertError;

            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "イベントの作成に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    const TOTAL_STEPS = 3;
    const steps = [
        { id: 1, title: "イベント情報", icon: Calendar },
        { id: 2, title: "規約・運営", icon: Shield },
        { id: 3, title: "確認", icon: CheckCircle2 },
    ];

    const canProceed = () => {
        switch (step) {
            case 1:
                const timeValid = formData.usePerDaySchedule || (formData.startTime && formData.endTime);
                const postponedValid = formData.postponedType === "none"
                    || (formData.postponedType === "date" && !isMultiDay && formData.postponedDate)
                    || (formData.postponedType === "date" && isMultiDay && formData.postponedDates.every(d => d.postponed_to));
                const recruitValid = formData.usePerDaySettings || (formData.recruitCount && formData.fee);
                return formData.eventName && formData.genre && formData.description && formData.boothContent
                    && formData.startDate && timeValid && formData.postponedType && formData.appDeadline
                    && postponedValid
                    && formData.venueName && formData.address
                    && formData.targetAudience.length > 0 && formData.expectedVisitors
                    && formData.powerSupply && formData.waterSupply
                    && formData.restrictions.length > 0
                    && recruitValid
                    && !!formData.mainImage;
            case 2:
                return formData.termsCompliance && formData.boothQualification && formData.privacyPolicy && formData.cancelPolicy
                    && formData.organizerName && formData.organizerEmail && formData.organizerPhone;
            default: return true;
        }
    };

    const errorBorder = "border-red-400 ring-2 ring-red-100";
    const inputClass = "block w-full rounded-lg border-slate-300 bg-slate-50 p-3.5 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all font-medium shadow-sm";
    const textareaClass = "block w-full rounded-lg border-slate-300 bg-slate-50 p-3.5 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all resize-none shadow-sm leading-relaxed";
    const labelClass = "block text-sm font-bold text-slate-700 mb-2";
    const fieldError = (name: string) => showErrors && !formData[name as keyof typeof formData] ? errorBorder : "";
    const fieldErrorMsg = (name: string) => showErrors && !formData[name as keyof typeof formData] ? <p className="text-xs text-red-500 mt-1">この項目は必須です</p> : null;
    const inlineError = (name: string) => fieldErrors[name] ? <p className="text-xs text-red-500 mt-1">{fieldErrors[name]}</p> : null;
    const sectionTitle = "text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2";
    const editableBadge = <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">訂正可</span>;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <header className="px-6 h-16 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold text-slate-900">イベント新規作成</h1>
                </div>
                <div className="text-sm font-medium text-slate-500">
                    Step {step} / {TOTAL_STEPS}
                </div>
            </header>

            <main className="flex-1 container mx-auto max-w-3xl px-4 py-8">
                {/* Approval Status Warning */}
                {isCheckingApproval ? (
                    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <p className="text-sm text-slate-500">承認状態を確認中...</p>
                    </div>
                ) : isApproved === false ? (
                    <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                                <AlertCircle className="w-6 h-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-amber-900 mb-1">承認待ち</h3>
                                <p className="text-sm text-amber-700 leading-relaxed mb-4">
                                    現在、管理者による承認を待っています。承認が完了するまで、イベントの作成はできません。
                                </p>
                                <Link href="/">
                                    <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                        ダッシュボードに戻る
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Progress Bar */}
                <div className="mb-10 px-2">
                    <div className="flex justify-between relative max-w-lg mx-auto">
                        {/* Background line */}
                        <div className="absolute top-7 left-[calc(100%/(2*3))] right-[calc(100%/(2*3))] h-1.5 bg-slate-100 rounded-full"></div>
                        {/* Active line */}
                        <div
                            className="absolute top-7 left-[calc(100%/(2*3))] h-1.5 bg-orange-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                            style={{ width: `${((step - 1) / (steps.length - 1)) * (100 - 100 / steps.length)}%` }}
                        ></div>

                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-2 z-10">
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 relative bg-white",
                                    step >= s.id
                                        ? "border-orange-500 text-orange-600 shadow-lg shadow-orange-100 scale-110"
                                        : "border-slate-100 text-slate-300"
                                )}>
                                    <s.icon className={cn(
                                        "w-6 h-6 transition-transform duration-500",
                                        step === s.id && "scale-110"
                                    )} />
                                    {step > s.id && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300">
                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-xs font-bold tracking-wider transition-all duration-500 select-none",
                                    step === s.id ? "text-orange-600" : step > s.id ? "text-orange-400" : "text-slate-300"
                                )}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">

                    {/* ============ Step 1: イベント情報 ============ */}
                    {step === 1 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* 基本情報 */}
                            <section>
                                <h2 className={sectionTitle}><FileText className="w-5 h-5 text-orange-500" /> 基本情報</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>イベント名 </label>
                                        <input name="eventName" value={formData.eventName} onChange={handleChange} className={cn(inputClass, fieldError("eventName"))} placeholder="第5回 東京サマーマルシェ" autoFocus />
                                        {fieldErrorMsg("eventName")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>ジャンル </label>
                                        <select name="genre" value={formData.genre} onChange={handleChange} className={cn(inputClass, "appearance-none cursor-pointer", fieldError("genre"))}>
                                            <option value="">選択してください</option>
                                            <option value="音楽フェス">音楽フェス</option>
                                            <option value="ライブ">ライブ</option>
                                            <option value="マルシェ">マルシェ</option>
                                            <option value="フリーマーケット">フリーマーケット</option>
                                            <option value="地域おこし">地域おこし</option>
                                            <option value="祭り">祭り</option>
                                            <option value="食フェス">食フェス</option>
                                            <option value="グルメイベント">グルメイベント</option>
                                            <option value="スポーツ">スポーツ</option>
                                            <option value="アウトドア">アウトドア</option>
                                            <option value="企業">企業</option>
                                            <option value="展示会">展示会</option>
                                            <option value="その他">その他</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>公開設定</label>
                                        <div className="flex gap-3">
                                            <label className={cn("flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors", formData.visibility === "public" ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300")}>
                                                <input type="radio" name="visibility" value="public" checked={formData.visibility === "public"} onChange={handleChange} className="accent-orange-500" />
                                                <div>
                                                    <span className="text-sm font-medium text-slate-900">一般公開</span>
                                                    <p className="text-xs text-slate-500 mt-0.5">検索結果に表示され、誰でも閲覧できます</p>
                                                </div>
                                            </label>
                                            <label className={cn("flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors", formData.visibility === "private" ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300")}>
                                                <input type="radio" name="visibility" value="private" checked={formData.visibility === "private"} onChange={handleChange} className="accent-orange-500" />
                                                <div>
                                                    <span className="text-sm font-medium text-slate-900">限定公開</span>
                                                    <p className="text-xs text-slate-500 mt-0.5">招待リンクを知っている人のみ閲覧できます</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>概要 </label>
                                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={cn(textareaClass, fieldError("description"))} placeholder="イベントの趣旨、ターゲット層、過去の実績などを詳しく記入してください。" />
                                        {fieldErrorMsg("description")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>出店内容 </label>
                                        <textarea name="boothContent" value={formData.boothContent} onChange={handleChange} rows={3} className={cn(textareaClass, fieldError("boothContent"))} placeholder={"・飲食ブース（キッチンカー含む）\n・ハンドメイド雑貨\n・ワークショップ体験"} />
                                        {fieldErrorMsg("boothContent")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>ターゲット層 </label>
                                        <div className={cn("flex flex-wrap gap-2 p-3 rounded-lg border bg-slate-50", showErrors && formData.targetAudience.length === 0 ? "border-red-400 ring-2 ring-red-100" : "border-slate-300")}>
                                            {TARGET_AUDIENCE_OPTIONS.map(opt => (
                                                <label key={opt} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm font-medium transition-colors", formData.targetAudience.includes(opt) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-700 border-slate-200 hover:border-orange-300")}>
                                                    <input type="checkbox" className="sr-only" checked={formData.targetAudience.includes(opt)} onChange={() => setFormData(prev => ({ ...prev, targetAudience: prev.targetAudience.includes(opt) ? prev.targetAudience.filter(v => v !== opt) : [...prev.targetAudience, opt] }))} />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                        {showErrors && formData.targetAudience.length === 0 && <p className="text-xs text-red-500 mt-1">1つ以上選択してください</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>予想来場者数 </label>
                                        <div className="relative">
                                            <input name="expectedVisitors" type="number" min="0" value={formData.expectedVisitors} onChange={handleChange} className={cn(inputClass, "pr-12", showErrors && !formData.expectedVisitors ? errorBorder : "")} placeholder="500" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">人</span>
                                        </div>
                                        {showErrors && !formData.expectedVisitors && <p className="text-xs text-red-500 mt-1">この項目は必須です</p>}
                                    </div>
                                </div>
                            </section>

                            {/* 日時 */}
                            <section>
                                <h2 className={sectionTitle}><Calendar className="w-5 h-5 text-orange-500" /> 日時</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>開催日 (開始) </label>
                                            <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className={cn(inputClass, fieldError("startDate"))} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>開催日 (終了) <span className="text-slate-400 font-normal">（任意）</span></label>
                                            <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>
                                    {!formData.usePerDaySchedule && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>開始時間 </label>
                                                <div className="flex items-center gap-2">
                                                    <select value={formData.startTime.split(':')[0] || ""} onChange={(e) => { const mins = formData.startTime.split(':')[1] || "00"; setFormData(prev => ({ ...prev, startTime: `${e.target.value.padStart(2, '0')}:${mins}` })); }} className={cn(inputClass, "appearance-none cursor-pointer")}>
                                                        <option value="">時</option>
                                                        {Array.from({ length: 24 }).map((_, i) => (<option key={i} value={i.toString().padStart(2, '0')}>{i}時</option>))}
                                                    </select>
                                                    <select value={formData.startTime.split(':')[1] || ""} onChange={(e) => { const hrs = formData.startTime.split(':')[0] || "00"; setFormData(prev => ({ ...prev, startTime: `${hrs.padStart(2, '0')}:${e.target.value}` })); }} className={cn(inputClass, "appearance-none cursor-pointer")}>
                                                        <option value="">分</option>
                                                        {['00', '10', '20', '30', '40', '50'].map((m) => (<option key={m} value={m}>{m}分</option>))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className={labelClass}>終了時間 </label>
                                                <div className="flex items-center gap-2">
                                                    <select value={formData.endTime.split(':')[0] || ""} onChange={(e) => { const mins = formData.endTime.split(':')[1] || "00"; setFormData(prev => ({ ...prev, endTime: `${e.target.value.padStart(2, '0')}:${mins}` })); }} className={cn(inputClass, "appearance-none cursor-pointer")}>
                                                        <option value="">時</option>
                                                        {Array.from({ length: 24 }).map((_, i) => (<option key={i} value={i.toString().padStart(2, '0')}>{i}時</option>))}
                                                    </select>
                                                    <select value={formData.endTime.split(':')[1] || ""} onChange={(e) => { const hrs = formData.endTime.split(':')[0] || "00"; setFormData(prev => ({ ...prev, endTime: `${hrs.padStart(2, '0')}:${e.target.value}` })); }} className={cn(inputClass, "appearance-none cursor-pointer")}>
                                                        <option value="">分</option>
                                                        {['00', '10', '20', '30', '40', '50'].map((m) => (<option key={m} value={m}>{m}分</option>))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 日別スケジュール */}
                                    {isMultiDay && dateRange.length > 0 && (
                                        <div className="mt-2">
                                            {!formData.usePerDaySchedule ? (
                                                <button type="button" onClick={initPerDaySchedule} className="text-sm text-orange-600 font-medium hover:underline">
                                                    日ごとに時間を設定する
                                                </button>
                                            ) : (
                                                <div className="space-y-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-slate-700">日別スケジュール</span>
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePerDaySchedule: false, eventSchedule: [] }))} className="text-xs text-slate-400 hover:text-red-500">解除</button>
                                                    </div>
                                                    {formData.eventSchedule.map((day, idx) => (
                                                        <div key={day.date} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
                                                            <span className="text-sm font-medium text-slate-700 min-w-[90px]">{new Date(day.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}</span>
                                                            <input type="time" value={day.start_time} onChange={(e) => {
                                                                const updated = [...formData.eventSchedule];
                                                                updated[idx] = { ...updated[idx], start_time: e.target.value };
                                                                setFormData(prev => ({ ...prev, eventSchedule: updated }));
                                                            }} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                                                            <span className="text-slate-400">〜</span>
                                                            <input type="time" value={day.end_time} onChange={(e) => {
                                                                const updated = [...formData.eventSchedule];
                                                                updated[idx] = { ...updated[idx], end_time: e.target.value };
                                                                setFormData(prev => ({ ...prev, eventSchedule: updated }));
                                                            }} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClass}>延期時の仮日 </label>
                                        <div className="flex gap-3 mb-3">
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, postponedType: "none", postponedDate: "", postponedDates: [], postponedNote: "" }))} className={cn("flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold transition-all", formData.postponedType === "none" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300")}>
                                                延期なし
                                            </button>
                                            <button type="button" onClick={() => {
                                                if (isMultiDay && dateRange.length > 0) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        postponedType: "date",
                                                        postponedDates: dateRange.map(d => ({ date: d, postponed_to: "" })),
                                                    }));
                                                } else {
                                                    setFormData(prev => ({ ...prev, postponedType: "date" }));
                                                }
                                            }} className={cn("flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold transition-all", formData.postponedType === "date" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300")}>
                                                仮日を設定する
                                            </button>
                                        </div>
                                        {formData.postponedType === "date" && (
                                            <div className="space-y-3">
                                                {isMultiDay && formData.postponedDates.length > 0 ? (
                                                    <div className="space-y-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                                        <span className="text-sm font-semibold text-slate-700">日別の延期先</span>
                                                        {formData.postponedDates.map((day, idx) => (
                                                            <div key={day.date} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
                                                                <span className="text-sm font-medium text-slate-700 min-w-[90px]">{new Date(day.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}</span>
                                                                <span className="text-slate-400 text-sm">→</span>
                                                                <input type="date" value={day.postponed_to} onChange={(e) => {
                                                                    const updated = [...formData.postponedDates];
                                                                    updated[idx] = { ...updated[idx], postponed_to: e.target.value };
                                                                    setFormData(prev => ({ ...prev, postponedDates: updated }));
                                                                }} className="flex-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <input name="postponedDate" type="date" value={formData.postponedDate} onChange={handleChange} className={inputClass} />
                                                )}
                                                <input name="postponedNote" value={formData.postponedNote} onChange={handleChange} className={inputClass} placeholder="雨天延期 / 荒天時は翌週に延期 など" />
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">※ 雨天等で延期する場合の予備日を設定できます</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                        <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            出店募集の締め切り</label>
                                        <input name="appDeadline" type="date" value={formData.appDeadline} onChange={handleChange} className={cn("block w-full rounded-lg border-orange-200 bg-white p-3.5 text-slate-900 outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all font-bold shadow-sm", fieldError("appDeadline"))} />
                                        {fieldErrorMsg("appDeadline")}
                                        <p className="text-xs text-orange-600 mt-2">※ この日を過ぎると出店申し込みができなくなります。</p>
                                    </div>
                                </div>
                            </section>

                            {/* 場所 */}
                            <section>
                                <h2 className={sectionTitle}><MapPin className="w-5 h-5 text-orange-500" /> 場所</h2>

                                {error && (
                                    <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
                                        <AlertCircle className="w-5 h-5 shrink-0" />
                                        <p className="font-medium">{error}</p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>会場名 </label>
                                        <input name="venueName" value={formData.venueName} onChange={handleChange} className={cn(inputClass, fieldError("venueName"))} placeholder="代々木公園 イベント広場" />
                                        {fieldErrorMsg("venueName")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>郵便番号 <span className="text-slate-400 font-normal">（任意）</span></label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <span className="text-sm font-bold">〒</span>
                                                </div>
                                                <input name="zipCode" value={formData.zipCode} onChange={handleChange} className={cn(inputClass, "pl-10")} placeholder="1500041" maxLength={7} />
                                            </div>
                                            <Button type="button" onClick={searchAddress} disabled={isLoading || formData.zipCode.length < 7} className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 shadow-none px-6 rounded-lg">
                                                <Search className="w-4 h-4 mr-2" /> 住所を検索
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>住所 / 所在地 </label>
                                        <input name="address" value={formData.address} onChange={handleChange} className={cn(inputClass, fieldError("address"))} placeholder="東京都渋谷区神南2-3" />
                                        {fieldErrorMsg("address")}
                                    </div>
                                    {formData.address ? (
                                        <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50">
                                            <iframe width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen src={`https://maps.google.com/maps?q=${encodeURIComponent(formData.address)}&output=embed&z=15`} title="Venue Map"></iframe>
                                        </div>
                                    ) : (
                                        <div className="h-32 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-400">
                                            <div className="text-center">
                                                <MapPin className="w-6 h-6 mx-auto mb-1 opacity-30" />
                                                <p className="text-xs font-medium">住所を入力すると地図が表示されます</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* 募集・会場 */}
                            <section>
                                <h2 className={sectionTitle}><Users className="w-5 h-5 text-orange-500" /> 募集・会場</h2>
                                <div className="space-y-4">
                                    {!formData.usePerDaySettings && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>出店数 </label>
                                                <input name="recruitCount" type="number" value={formData.recruitCount} onChange={handleChange} className={cn(inputClass, fieldError("recruitCount"))} />
                                            </div>
                                            <div>
                                                <label className={labelClass}>出店料 </label>
                                                <input name="fee" value={formData.fee} onChange={handleChange} className={cn(inputClass, fieldError("fee"))} placeholder="1日 5,000円 / 売上の10%" />
                                            </div>
                                        </div>
                                    )}

                                    {/* 日別条件 */}
                                    {isMultiDay && dateRange.length > 0 && (
                                        <div>
                                            {!formData.usePerDaySettings ? (
                                                <button type="button" onClick={initPerDaySettings} className="text-sm text-orange-600 font-medium hover:underline">
                                                    日ごとに募集条件を設定する
                                                </button>
                                            ) : (
                                                <div className="space-y-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-semibold text-slate-700">日別の募集条件</span>
                                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, usePerDaySettings: false, eventDaySettings: [] }))} className="text-xs text-slate-400 hover:text-red-500">解除</button>
                                                    </div>
                                                    {formData.eventDaySettings.map((day, idx) => (
                                                        <div key={day.date} className="bg-white rounded-lg p-3 border border-slate-200 space-y-2">
                                                            <span className="text-sm font-medium text-slate-700">{new Date(day.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric", weekday: "short" })}</span>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div>
                                                                    <label className="text-xs text-slate-500">募集数</label>
                                                                    <input type="number" value={day.recruit_count} onChange={(e) => {
                                                                        const updated = [...formData.eventDaySettings];
                                                                        updated[idx] = { ...updated[idx], recruit_count: parseInt(e.target.value) || 0 };
                                                                        setFormData(prev => ({ ...prev, eventDaySettings: updated }));
                                                                    }} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5" />
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs text-slate-500">出店料</label>
                                                                    <input value={day.fee} onChange={(e) => {
                                                                        const updated = [...formData.eventDaySettings];
                                                                        updated[idx] = { ...updated[idx], fee: e.target.value };
                                                                        setFormData(prev => ({ ...prev, eventDaySettings: updated }));
                                                                    }} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5" placeholder="5,000円" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-slate-500">備考</label>
                                                                <input value={day.notes} onChange={(e) => {
                                                                    const updated = [...formData.eventDaySettings];
                                                                    updated[idx] = { ...updated[idx], notes: e.target.value };
                                                                    setFormData(prev => ({ ...prev, eventDaySettings: updated }));
                                                                }} className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5" placeholder="この日のみキッチンカー優先 等" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div>
                                        <label className={labelClass}>会場インフラ提供 </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-sm text-slate-600 mb-2 font-medium">電源</p>
                                                <div className={cn("flex gap-2", showErrors && !formData.powerSupply ? "ring-2 ring-red-100 rounded-lg p-1" : "")}>
                                                    {[{ v: "yes", label: "提供あり" }, { v: "no", label: "提供なし" }].map(({ v, label }) => (
                                                        <label key={v} className={cn("flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors", formData.powerSupply === v ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                                                            <input type="radio" name="powerSupply" value={v} checked={formData.powerSupply === v} onChange={handleChange} className="sr-only" />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 mb-2 font-medium">水道</p>
                                                <div className={cn("flex gap-2", showErrors && !formData.waterSupply ? "ring-2 ring-red-100 rounded-lg p-1" : "")}>
                                                    {[{ v: "yes", label: "提供あり" }, { v: "no", label: "提供なし" }].map(({ v, label }) => (
                                                        <label key={v} className={cn("flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors", formData.waterSupply === v ? "border-orange-400 bg-orange-50 text-orange-700" : "border-slate-200 text-slate-600 hover:border-slate-300")}>
                                                            <input type="radio" name="waterSupply" value={v} checked={formData.waterSupply === v} onChange={handleChange} className="sr-only" />
                                                            {label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        {showErrors && (!formData.powerSupply || !formData.waterSupply) && <p className="text-xs text-red-500 mt-1">電源・水道どちらも選択してください</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>禁止・制限事項 </label>
                                        <div className={cn("flex flex-wrap gap-2 p-3 rounded-lg border bg-slate-50", showErrors && formData.restrictions.length === 0 ? "border-red-400 ring-2 ring-red-100" : "border-slate-300")}>
                                            {RESTRICTION_OPTIONS.map(opt => (
                                                <label key={opt} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm font-medium transition-colors", formData.restrictions.includes(opt) ? "bg-red-500 text-white border-red-500" : "bg-white text-slate-700 border-slate-200 hover:border-red-200")}>
                                                    <input type="checkbox" className="sr-only" checked={formData.restrictions.includes(opt)} onChange={() => setFormData(prev => ({ ...prev, restrictions: prev.restrictions.includes(opt) ? prev.restrictions.filter(v => v !== opt) : [...prev.restrictions, opt] }))} />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                        {showErrors && formData.restrictions.length === 0 && <p className="text-xs text-red-500 mt-1">1つ以上選択してください（制限なしの場合は該当なし以外を選択不要なら「なし」を追加）</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>その他のルール <span className="text-slate-400 font-normal">（任意）</span></label>
                                        <textarea name="venueRules" value={formData.venueRules} onChange={handleChange} rows={4} className={textareaClass} placeholder={"・ゴミは各自持ち帰り\n・音量は80dB以下\n・搬入は8:00〜10:00"} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>会場レイアウト <span className="text-slate-400 font-normal">（任意）</span>{editableBadge}</label>
                                        <label htmlFor="layout-upload" className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-6 hover:bg-slate-50 transition-colors relative overflow-hidden cursor-pointer">
                                            {formData.venueLayout ? (
                                                <div className="relative w-full aspect-video">
                                                    <Image src={formData.venueLayout} alt="会場レイアウト" fill className="object-contain rounded-lg" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <span className="text-white font-bold border border-white px-4 py-2 rounded-full hover:bg-white/20">変更する</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="mx-auto h-8 w-8 text-slate-300" />
                                                    <div className="mt-2 flex text-sm text-slate-600 justify-center">
                                                        <span className="relative font-semibold text-orange-600">レイアウト画像をアップロード</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, PDF（10MB以下）</p>
                                                </div>
                                            )}
                                            <input id="layout-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e, "layout")} />
                                        </label>
                                        <p className="text-xs text-green-600 mt-1">※ 後から訂正できます</p>
                                    </div>
                                </div>
                            </section>

                            {/* メイン画像 */}
                            <section>
                                <h2 className={sectionTitle}><ImageIcon className="w-5 h-5 text-orange-500" /> メイン画像</h2>
                                <label htmlFor="file-upload" className={cn("mt-2 flex justify-center rounded-xl border-2 border-dashed px-6 py-10 hover:bg-slate-50 transition-colors relative overflow-hidden cursor-pointer", showErrors && !formData.mainImage ? "border-red-400 ring-2 ring-red-100" : "border-slate-300")}>
                                    {formData.mainImage ? (
                                        <div className="relative w-full aspect-video">
                                            <Image src={formData.mainImage} alt="Preview" fill className="object-cover rounded-lg" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <span className="text-white font-bold border border-white px-4 py-2 rounded-full hover:bg-white/20">変更する</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-slate-300" />
                                            <div className="mt-4 flex text-sm leading-6 text-slate-600 justify-center">
                                                <span className="relative font-semibold text-orange-600">画像をアップロード</span>
                                                <p className="pl-1">またはドラッグ＆ドロップ</p>
                                            </div>
                                            <p className="text-xs leading-5 text-slate-600">PNG, JPG, GIF（10MB以下）</p>
                                        </div>
                                    )}
                                    <input id="file-upload" type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e, "main")} />
                                </label>
                                {showErrors && !formData.mainImage && <p className="text-xs text-red-500 mt-1">メイン画像のアップロードは必須です</p>}
                            </section>
                        </div>
                    )}

                    {/* ============ Step 2: 規約・運営 ============ */}
                    {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* カテゴリ別募集枠 */}
                            <section>
                                <h2 className={sectionTitle}><ClipboardList className="w-5 h-5 text-orange-500" /> カテゴリ別募集枠 <span className="text-slate-400 font-normal text-sm ml-1">（任意）</span></h2>
                                <p className="text-sm text-slate-500 mb-4">カテゴリごとに募集枠数を設定できます。総枠数とのバランスにご注意ください。</p>
                                <div className="space-y-3">
                                    {formData.categorySlots.map((slot, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
                                            <select value={slot.category} onChange={(e) => { const updated = [...formData.categorySlots]; updated[idx] = { ...updated[idx], category: e.target.value }; setFormData(prev => ({ ...prev, categorySlots: updated })); }} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500">
                                                <option value="">カテゴリを選択</option>
                                                {FOOD_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                            <div className="flex items-center gap-1.5">
                                                <input type="number" min="1" value={slot.count} onChange={(e) => { const updated = [...formData.categorySlots]; updated[idx] = { ...updated[idx], count: parseInt(e.target.value) || 1 }; setFormData(prev => ({ ...prev, categorySlots: updated })); }} className="w-20 text-sm border border-slate-200 rounded-lg px-2 py-2 text-center outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500" />
                                                <span className="text-sm text-slate-500">枠</span>
                                            </div>
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, categorySlots: prev.categorySlots.filter((_, i) => i !== idx) }))} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, categorySlots: [...prev.categorySlots, { category: "", count: 1 }] }))} className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-sm font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-colors">
                                        <Plus className="w-4 h-4" /> カテゴリを追加
                                    </button>
                                    {formData.categorySlots.length > 0 && (
                                        <p className="text-xs text-slate-500 text-right">合計: {formData.categorySlots.reduce((sum, s) => sum + s.count, 0)} 枠</p>
                                    )}
                                </div>
                            </section>

                            {/* 他出店者の公開設定 */}
                            <section>
                                <h2 className={sectionTitle}><Users className="w-5 h-5 text-orange-500" /> 他出店者情報の公開設定</h2>
                                <p className="text-sm text-slate-500 mb-4">応募してくる出店者に対して、すでに参加が決まっている出店者の情報をどこまで見せるかを設定します。</p>
                                <div className="space-y-2">
                                    {[
                                        { v: "all", label: "全公開", desc: "店名・カテゴリなど、すでに集まっている出店者の情報を全て公開します" },
                                        { v: "category", label: "カテゴリのみ公開", desc: "店名は伏せ、提供カテゴリ（主食・軽食など）のみ公開します" },
                                        { v: "none", label: "非公開", desc: "他の出店者の情報は一切公開しません" },
                                    ].map(({ v, label, desc }) => (
                                        <label key={v} className={cn("flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors", formData.exhibitorListVisibility === v ? "border-orange-400 bg-orange-50" : "border-slate-200 hover:border-slate-300")}>
                                            <input type="radio" name="exhibitorListVisibility" value={v} checked={formData.exhibitorListVisibility === v} onChange={handleChange} className="mt-1 accent-orange-500" />
                                            <div>
                                                <span className="text-sm font-bold text-slate-900">{label}</span>
                                                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </section>

                            {/* 出店規約 */}
                            <section>
                                <h2 className={sectionTitle}><Shield className="w-5 h-5 text-orange-500" /> 出店規約</h2>
                                <p className="text-sm text-slate-500 mb-4">出店者に同意していただく規約内容を設定してください。</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>規約の履行 </label>
                                        <textarea name="termsCompliance" value={formData.termsCompliance} onChange={handleChange} rows={3} className={cn(textareaClass, fieldError("termsCompliance"))} placeholder="出店者は本規約の全条項を遵守するものとします。" />
                                        {fieldErrorMsg("termsCompliance")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>出店資格 </label>
                                        <textarea name="boothQualification" value={formData.boothQualification} onChange={handleChange} rows={3} className={cn(textareaClass, fieldError("boothQualification"))} placeholder={"・食品衛生責任者の資格を有すること\n・営業許可証を取得していること"} />
                                        {fieldErrorMsg("boothQualification")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>肖像権・個人情報の取り扱い </label>
                                        <textarea name="privacyPolicy" value={formData.privacyPolicy} onChange={handleChange} rows={3} className={cn(textareaClass, fieldError("privacyPolicy"))} placeholder="イベント会場内では撮影を行う場合があります。" />
                                        {fieldErrorMsg("privacyPolicy")}
                                    </div>
                                    <div>
                                        <label className={labelClass}>キャンセルポリシー </label>
                                        <textarea name="cancelPolicy" value={formData.cancelPolicy} onChange={handleChange} rows={3} className={cn(textareaClass, fieldError("cancelPolicy"))} placeholder={"・開催日30日前まで：全額返金\n・14日前まで：50%返金\n・7日前以降：返金不可"} />
                                        {fieldErrorMsg("cancelPolicy")}
                                    </div>
                                </div>
                            </section>

                            {/* 主催者情報 */}
                            <section>
                                <h2 className={sectionTitle}><User className="w-5 h-5 text-orange-500" /> 主催者情報</h2>
                                <p className="text-sm text-slate-500 mb-4">出店者に公開される連絡先情報です。</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}><span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> 主催者名 </span></label>
                                        <input name="organizerName" value={formData.organizerName} onChange={handleChange} className={cn(inputClass, fieldError("organizerName"))} placeholder="株式会社イベントプランニング / 田中太郎" />
                                        {fieldErrorMsg("organizerName")}
                                    </div>
                                    <div>
                                        <label className={labelClass}><span className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> メールアドレス </span></label>
                                        <input name="organizerEmail" type="email" value={formData.organizerEmail} onChange={handleChange} onBlur={(e) => validateField("organizerEmail", e.target.value)} className={cn(inputClass, fieldError("organizerEmail"), fieldErrors.organizerEmail && errorBorder)} placeholder="event@example.com" />
                                        {fieldErrorMsg("organizerEmail")}
                                        {inlineError("organizerEmail")}
                                    </div>
                                    <div>
                                        <label className={labelClass}><span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> 電話番号 </span></label>
                                        <input name="organizerPhone" type="tel" value={formData.organizerPhone} onChange={handleChange} onBlur={(e) => validateField("organizerPhone", e.target.value)} className={cn(inputClass, fieldError("organizerPhone"), fieldErrors.organizerPhone && errorBorder)} placeholder="03-1234-5678" />
                                        {fieldErrorMsg("organizerPhone")}
                                        {inlineError("organizerPhone")}
                                    </div>
                                </div>
                            </section>

                            {/* 搬出入 */}
                            <section>
                                <h2 className={sectionTitle}><Truck className="w-5 h-5 text-orange-500" /> 搬出入について <span className="text-slate-400 font-normal text-sm">（任意）</span>{editableBadge}</h2>
                                <textarea name="loadingInfo" value={formData.loadingInfo} onChange={handleChange} rows={5} className={textareaClass} placeholder={"・搬入時間：開催日前日 14:00〜17:00、当日 7:00〜9:00\n・搬出時間：イベント終了後〜19:00\n・搬入口：会場北側ゲートから進入"} />
                                <p className="text-xs text-green-600 mt-1">※ 後から追加・訂正できます</p>
                            </section>

                            {/* 出店者への質問項目 */}
                            <section>
                                <h2 className={sectionTitle}><ClipboardList className="w-5 h-5 text-orange-500" /> 出店者への質問項目 <span className="text-slate-400 font-normal text-sm">（任意）</span></h2>
                                <p className="text-sm text-slate-500 mb-4">
                                    承認した出店者に自動送信されるフォームの項目を選択してください。
                                </p>

                                {(() => {
                                    const categories = [...new Set(PRESET_EXHIBITOR_FIELDS.map(f => f.category))];
                                    return categories.map(category => (
                                        <div key={category} className="space-y-2 mb-4">
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                {category}
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {PRESET_EXHIBITOR_FIELDS.filter(f => f.category === category).map(field => (
                                                    <label key={field.key} className={cn("flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all", formData.selectedExhibitorFields.includes(field.key) ? "border-orange-500 bg-orange-50" : "border-slate-100 bg-slate-50 hover:border-slate-200")}>
                                                        <input type="checkbox" checked={formData.selectedExhibitorFields.includes(field.key)} onChange={() => toggleExhibitorField(field.key)} className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500" />
                                                        <div className="flex-1 min-w-0">
                                                            <span className="text-sm font-medium text-slate-900">{field.label}</span>
                                                            <span className={cn("ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded", TYPE_BADGE[field.type].class)}>
                                                                {TYPE_BADGE[field.type].label}
                                                            </span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()}

                                {/* カスタム質問 */}
                                <div className="border-t border-slate-200 pt-6 space-y-4">
                                    {customFields.length > 0 ? (
                                        <>
                                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                カスタム質問
                                            </h3>
                                            {customFields.map(field => (
                                                <div key={field.id} className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-100 bg-slate-50">
                                                    <span className={cn("shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded", field.type === "file" ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500")}>
                                                        {field.type === "file" ? "画像" : "テキスト"}
                                                    </span>
                                                    <input value={field.label} onChange={(e) => updateCustomFieldLabel(field.id, e.target.value)} className="flex-1 bg-white rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500" placeholder="質問項目名を入力" />
                                                    <button type="button" onClick={() => removeCustomField(field.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => addCustomField("text")} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-all">
                                                    <Plus className="w-4 h-4" /> テキスト項目を追加
                                                </button>
                                                <button type="button" onClick={() => addCustomField("file")} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all">
                                                    <Plus className="w-4 h-4" /> 画像項目を追加
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => addCustomField("text")} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-orange-300 hover:text-orange-600 transition-all">
                                                <Plus className="w-4 h-4" /> テキスト項目を追加
                                            </button>
                                            <button type="button" onClick={() => addCustomField("file")} className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-sm font-medium text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all">
                                                <Plus className="w-4 h-4" /> 画像項目を追加
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* プレビュー */}
                                {(formData.selectedExhibitorFields.length > 0 || customFields.length > 0) && (
                                    <div className="border-t border-slate-200 pt-6">
                                        <h3 className="text-sm font-bold text-slate-800 mb-3">出店者に届くフォームのプレビュー</h3>
                                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                                            {formData.selectedExhibitorFields.map(key => {
                                                const field = PRESET_EXHIBITOR_FIELDS.find(f => f.key === key);
                                                if (!field) return null;
                                                return (
                                                    <div key={key} className="space-y-1">
                                                        <label className="text-xs font-bold text-slate-600">{field.label}</label>
                                                        {field.type === "file" ? (
                                                            <div className="h-10 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">ファイルアップロード欄</div>
                                                        ) : field.type === "select" ? (
                                                            <div className="h-10 bg-white rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">{field.options?.join(" / ")}</div>
                                                        ) : field.type === "multiselect" ? (
                                                            <div className="flex flex-wrap gap-1.5">{field.options?.map(o => <span key={o} className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 rounded-full text-slate-500">{o}</span>)}</div>
                                                        ) : field.type === "radio_date" ? (
                                                            <div className="flex gap-2">
                                                                <div className="h-10 flex-1 bg-white rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">あり / なし</div>
                                                                <div className="h-10 flex-1 bg-white rounded-lg border border-slate-200 flex items-center px-3 text-xs text-slate-400">有効期限</div>
                                                            </div>
                                                        ) : field.type === "textarea" ? (
                                                            <div className="h-16 bg-white rounded-lg border border-slate-200"></div>
                                                        ) : (
                                                            <div className="h-10 bg-white rounded-lg border border-slate-200"></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {customFields.map(field => (
                                                <div key={field.id} className="space-y-1">
                                                    <label className="text-xs font-bold text-slate-600">{field.label || "(未入力)"}</label>
                                                    {field.type === "file" ? (
                                                        <div className="h-10 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">ファイルアップロード欄</div>
                                                    ) : (
                                                        <div className="h-10 bg-white rounded-lg border border-slate-200"></div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                    {/* ============ Step 3: 確認 ============ */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900">内容の確認</h2>
                                <p className="text-slate-500 mt-2">以下の内容でイベントを作成してよろしいですか？</p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 space-y-6 text-sm border border-slate-100">
                                {/* 基本情報 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">基本情報</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div><dt className="text-slate-500 text-xs">イベント名</dt><dd className="font-semibold text-slate-900">{formData.eventName}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">ジャンル</dt><dd className="font-semibold text-slate-900">{formData.genre}</dd></div>
                                        <div className="col-span-2"><dt className="text-slate-500 text-xs">概要</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.description}</dd></div>
                                        <div className="col-span-2"><dt className="text-slate-500 text-xs">出店内容</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.boothContent}</dd></div>
                                        <div className="col-span-2"><dt className="text-slate-500 text-xs">ターゲット層</dt><dd className="flex flex-wrap gap-1.5 mt-1">{formData.targetAudience.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">{t}</span>)}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">予想来場者数</dt><dd className="font-semibold text-slate-900">{formData.expectedVisitors ? `${Number(formData.expectedVisitors).toLocaleString()}人` : ""}</dd></div>
                                    </dl>
                                </section>

                                {/* 日時 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">日時</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div><dt className="text-slate-500 text-xs">開催日</dt><dd className="font-semibold text-slate-900">{formData.startDate}{formData.endDate && ` ～ ${formData.endDate}`}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">時間</dt><dd className="font-semibold text-slate-900">{formData.startTime} - {formData.endTime}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">延期時の仮日</dt><dd className="font-semibold text-slate-900">{formData.postponedType === "none" ? "延期なし" : isMultiDay && formData.postponedDates.length > 0 ? formData.postponedDates.map(d => `${new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })} → ${d.postponed_to}`).join("、") : formData.postponedDate}{formData.postponedNote && ` (${formData.postponedNote})`}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">募集締切</dt><dd className="font-semibold text-orange-600">{formData.appDeadline} まで</dd></div>
                                    </dl>
                                </section>

                                {/* 場所 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">場所</h3>
                                    <dl className="mt-2">
                                        <div><dt className="text-slate-500 text-xs">会場</dt><dd className="font-semibold text-slate-900">{formData.venueName} <span className="text-xs font-normal text-slate-500">({formData.address})</span></dd></div>
                                    </dl>
                                </section>

                                {/* 募集・会場 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">募集・会場</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div><dt className="text-slate-500 text-xs">出店数</dt><dd className="font-semibold text-slate-900">{formData.recruitCount}店舗</dd></div>
                                        <div><dt className="text-slate-500 text-xs">出店料</dt><dd className="font-semibold text-slate-900">{formData.fee}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">電源</dt><dd className="font-semibold text-slate-900">{formData.powerSupply === "yes" ? "提供あり" : formData.powerSupply === "no" ? "提供なし" : "未設定"}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">水道</dt><dd className="font-semibold text-slate-900">{formData.waterSupply === "yes" ? "提供あり" : formData.waterSupply === "no" ? "提供なし" : "未設定"}</dd></div>
                                        <div className="col-span-2"><dt className="text-slate-500 text-xs">禁止・制限事項</dt><dd className="flex flex-wrap gap-1.5 mt-1">{formData.restrictions.map(r => <span key={r} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">{r}</span>)}</dd></div>
                                        {formData.categorySlots.length > 0 && (
                                            <div className="col-span-2"><dt className="text-slate-500 text-xs">カテゴリ別募集枠</dt><dd className="flex flex-wrap gap-1.5 mt-1">{formData.categorySlots.map((s, i) => <span key={i} className="text-xs px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-semibold">{s.category}：{s.count}枠</span>)}</dd></div>
                                        )}
                                        <div className="col-span-2"><dt className="text-slate-500 text-xs">他出店者情報の公開</dt><dd className="font-semibold text-slate-900">{formData.exhibitorListVisibility === "all" ? "全公開" : formData.exhibitorListVisibility === "category" ? "カテゴリのみ公開" : "非公開"}</dd></div>
                                        {formData.venueRules && (
                                            <div className="col-span-2"><dt className="text-slate-500 text-xs">その他のルール</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.venueRules}</dd></div>
                                        )}
                                        {formData.venueLayout && (
                                            <div className="col-span-2"><dt className="text-slate-500 text-xs mb-1">会場レイアウト</dt><dd className="relative w-full h-40"><Image src={formData.venueLayout} alt="会場レイアウト" fill className="object-contain rounded-lg" /></dd></div>
                                        )}
                                    </dl>
                                </section>

                                {/* 出店規約 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">出店規約</h3>
                                    <dl className="space-y-3 mt-2">
                                        <div><dt className="text-slate-500 text-xs">規約の履行</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.termsCompliance}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">出店資格</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.boothQualification}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">肖像権・個人情報の取り扱い</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.privacyPolicy}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">キャンセルポリシー</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.cancelPolicy}</dd></div>
                                    </dl>
                                </section>

                                {/* 主催者情報 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">主催者情報</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                                        <div><dt className="text-slate-500 text-xs">主催者</dt><dd className="font-semibold text-slate-900">{formData.organizerName}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">メール</dt><dd className="font-semibold text-slate-900">{formData.organizerEmail}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">電話</dt><dd className="font-semibold text-slate-900">{formData.organizerPhone}</dd></div>
                                    </dl>
                                </section>

                                {/* 搬出入 */}
                                {formData.loadingInfo && (
                                    <section>
                                        <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">搬出入について</h3>
                                        <dd className="font-semibold text-slate-900 whitespace-pre-wrap mt-2">{formData.loadingInfo}</dd>
                                    </section>
                                )}

                                {/* メイン画像 */}
                                {formData.mainImage && (
                                    <section>
                                        <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">メイン画像</h3>
                                        <div className="relative w-full h-48 mt-2">
                                            <Image src={formData.mainImage} alt="メイン画像" fill className="object-cover rounded-lg" />
                                        </div>
                                    </section>
                                )}

                                {/* 出店者への質問項目 */}
                                {(formData.selectedExhibitorFields.length > 0 || customFields.length > 0) && (
                                    <section>
                                        <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">出店者への質問項目</h3>
                                        <div className="mt-2 space-y-1">
                                            {formData.selectedExhibitorFields.map(key => {
                                                const field = PRESET_EXHIBITOR_FIELDS.find(f => f.key === key);
                                                return field ? (
                                                    <div key={key} className="flex items-center gap-2 text-sm">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                        <span className="font-semibold text-slate-900">{field.label}</span>
                                                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", field.type === "file" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500")}>{field.type === "file" ? "画像" : "テキスト"}</span>
                                                    </div>
                                                ) : null;
                                            })}
                                            {customFields.map(field => (
                                                <div key={field.id} className="flex items-center gap-2 text-sm">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                                    <span className="font-semibold text-slate-900">{field.label}</span>
                                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", field.type === "file" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500")}>{field.type === "file" ? "画像" : "テキスト"}</span>
                                                    <span className="text-[10px] text-slate-400">（カスタム）</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>

                            {/* 利用規約同意 */}
                            <label className="flex items-start gap-3 cursor-pointer bg-orange-50/50 border border-orange-100 rounded-xl p-4">
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                />
                                <span className="text-sm text-slate-700">
                                    上記の内容を確認し、<a href="/terms" target="_blank" className="text-orange-600 underline hover:text-orange-700">利用規約</a>に同意してイベントを作成します
                                </span>
                            </label>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={step === 1 || isLoading}
                            className={cn("text-slate-500", step === 1 && "invisible")}
                        >
                            戻る
                        </Button>

                        {step < TOTAL_STEPS ? (
                            <Button
                                onClick={handleNext}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 shadow-md shadow-orange-200"
                            >
                                次へ進む <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || isApproved === false || !agreedToTerms}
                                className="bg-slate-900 hover:bg-black text-white rounded-full px-10 shadow-lg h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isApproved === false ? "管理者の承認が必要です" : !agreedToTerms ? "利用規約への同意が必要です" : undefined}
                            >
                                {isLoading ? "作成中..." : "イベントを作成する"}
                            </Button>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
