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
const PRESET_EXHIBITOR_FIELDS = [
    { key: "menu_list", label: "出店メニュー・商品リスト", type: "textarea" as const, category: "基本情報" },
    { key: "price_range", label: "販売価格帯", type: "text" as const, category: "基本情報" },
    { key: "booth_description", label: "ブースの装飾・外観の説明", type: "textarea" as const, category: "基本情報" },
    { key: "power_needed", label: "電源の要否・必要電力量", type: "text" as const, category: "設備・インフラ" },
    { key: "water_needed", label: "水道の要否", type: "text" as const, category: "設備・インフラ" },
    { key: "gas_usage", label: "ガス使用の有無", type: "text" as const, category: "設備・インフラ" },
    { key: "tent_info", label: "テント持参の有無・サイズ", type: "text" as const, category: "設備・インフラ" },
    { key: "space_size", label: "必要なスペースサイズ", type: "text" as const, category: "設備・インフラ" },
    { key: "vehicle_entry", label: "車両乗り入れの有無・サイズ", type: "text" as const, category: "車両・搬入" },
    { key: "loading_time_preference", label: "搬入希望時間帯", type: "text" as const, category: "車両・搬入" },
    { key: "food_safety_cert", label: "食品衛生責任者証", type: "file" as const, category: "必要書類" },
    { key: "business_license", label: "営業許可証（保健所）", type: "file" as const, category: "必要書類" },
    { key: "pl_insurance", label: "PL保険証書", type: "file" as const, category: "必要書類" },
    { key: "fire_equipment_layout", label: "火器類配置図", type: "file" as const, category: "必要書類" },
    { key: "vehicle_inspection", label: "車検証", type: "file" as const, category: "必要書類" },
    { key: "allergy_info", label: "アレルギー表示", type: "file" as const, category: "必要書類" },
    { key: "staff_count", label: "当日のスタッフ人数", type: "text" as const, category: "その他" },
    { key: "emergency_contact", label: "当日の緊急連絡先", type: "text" as const, category: "その他" },
];

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
                    .select("is_approved")
                    .eq("user_id", user.id)
                    .single();

                if (profile) {
                    setIsApproved(profile.is_approved || false);
                } else {
                    router.push("/onboarding");
                }
            } catch (err) {
                console.error("Error checking approval:", err);
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
        postponedType: "" as "" | "none" | "date",
        postponedDate: "",
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
    });

    const [customFields, setCustomFields] = useState<CustomField[]>([
        { id: "custom_text_1", label: "テキスト", type: "text" },
        { id: "custom_file_1", label: "画像", type: "file" },
    ]);

    const [files, setFiles] = useState<{ main: File | null; layout: File | null }>({
        main: null,
        layout: null,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

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

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

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
            console.error("Zip code search error:", err);
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
                    postponed_date: formData.postponedType === "date" ? formData.postponedDate : null,
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
                });

            if (insertError) throw insertError;

            router.push("/");
            router.refresh();
        } catch (err: any) {
            console.error("Event creation error:", err);
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
                return formData.eventName && formData.genre && formData.description && formData.boothContent
                    && formData.startDate && formData.startTime && formData.endTime && formData.postponedType && formData.appDeadline
                    && (formData.postponedType === "none" || formData.postponedDate)
                    && formData.venueName && formData.address
                    && formData.recruitCount && formData.fee && formData.venueRules
                    && !!formData.mainImage;
            case 2:
                return formData.termsCompliance && formData.boothQualification && formData.privacyPolicy && formData.cancelPolicy
                    && formData.organizerName && formData.organizerEmail && formData.organizerPhone;
            default: return true;
        }
    };

    const inputClass = "block w-full rounded-lg border-slate-300 bg-slate-50 p-3.5 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all font-medium shadow-sm";
    const textareaClass = "block w-full rounded-lg border-slate-300 bg-slate-50 p-3.5 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-orange-200 focus:border-orange-500 transition-all resize-none shadow-sm leading-relaxed";
    const labelClass = "block text-sm font-bold text-slate-700 mb-2";
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
                <div className="mb-14 px-2">
                    <div className="flex justify-between relative max-w-md mx-auto">
                        <div className="absolute top-[28px] left-0 w-full h-1.5 bg-slate-100 -z-10 rounded-full"></div>
                        <div
                            className="absolute top-[28px] left-0 h-1.5 bg-orange-500 -z-10 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((s) => (
                            <div key={s.id} className="flex flex-col items-center gap-3 relative">
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 relative bg-white",
                                    step >= s.id
                                        ? "border-orange-500 text-orange-600 shadow-lg shadow-orange-100 scale-110 z-10"
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
                                    "text-xs font-bold tracking-wider transition-all duration-500 absolute -bottom-8 w-24 text-center select-none",
                                    step === s.id ? "text-orange-600 scale-110" : step > s.id ? "text-orange-400" : "text-slate-300"
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
                                        <input name="eventName" value={formData.eventName} onChange={handleChange} className={inputClass} placeholder="例： 第5回 東京サマーマルシェ" autoFocus />
                                    </div>
                                    <div>
                                        <label className={labelClass}>ジャンル </label>
                                        <select name="genre" value={formData.genre} onChange={handleChange} className={cn(inputClass, "appearance-none cursor-pointer")}>
                                            <option value="">選択してください</option>
                                            <option value="マルシェ">マルシェ</option>
                                            <option value="音楽フェス">音楽フェス</option>
                                            <option value="フードフェス">フードフェス</option>
                                            <option value="地域のお祭り">地域のお祭り</option>
                                            <option value="スポーツ">スポーツ</option>
                                            <option value="その他">その他</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>概要 </label>
                                        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className={textareaClass} placeholder="イベントの趣旨、ターゲット層、過去の実績などを詳しく記入してください。" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>出店内容 </label>
                                        <textarea name="boothContent" value={formData.boothContent} onChange={handleChange} rows={3} className={textareaClass} placeholder={"例：\n・飲食ブース（キッチンカー含む）\n・ハンドメイド雑貨\n・ワークショップ体験"} />
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
                                            <input name="startDate" type="date" value={formData.startDate} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>開催日 (終了) <span className="text-slate-400 font-normal">（任意）</span></label>
                                            <input name="endDate" type="date" value={formData.endDate} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>
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
                                    <div>
                                        <label className={labelClass}>延期時の仮日 </label>
                                        <div className="flex gap-3 mb-3">
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, postponedType: "none", postponedDate: "" }))} className={cn("flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold transition-all", formData.postponedType === "none" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300")}>
                                                延期なし
                                            </button>
                                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, postponedType: "date" }))} className={cn("flex-1 py-3 px-4 rounded-lg border-2 text-sm font-bold transition-all", formData.postponedType === "date" ? "border-orange-500 bg-orange-50 text-orange-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300")}>
                                                仮日を設定する
                                            </button>
                                        </div>
                                        {formData.postponedType === "date" && (
                                            <input name="postponedDate" type="date" value={formData.postponedDate} onChange={handleChange} className={inputClass} />
                                        )}
                                        <p className="text-xs text-slate-400 mt-1">※ 雨天等で延期する場合の予備日を設定できます</p>
                                    </div>
                                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                        <label className="block text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            出店募集の締め切り</label>
                                        <input name="appDeadline" type="date" value={formData.appDeadline} onChange={handleChange} className="block w-full rounded-lg border-orange-200 bg-white p-3.5 text-slate-900 outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-all font-bold shadow-sm" />
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
                                        <input name="venueName" value={formData.venueName} onChange={handleChange} className={inputClass} placeholder="例： 代々木公園 イベント広場" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>郵便番号 <span className="text-slate-400 font-normal">（任意）</span></label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                    <span className="text-sm font-bold">〒</span>
                                                </div>
                                                <input name="zipCode" value={formData.zipCode} onChange={handleChange} className={cn(inputClass, "pl-10")} placeholder="例： 1500041" maxLength={7} />
                                            </div>
                                            <Button type="button" onClick={searchAddress} disabled={isLoading || formData.zipCode.length < 7} className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 shadow-none px-6 rounded-lg">
                                                <Search className="w-4 h-4 mr-2" /> 住所を検索
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>住所 / 所在地 </label>
                                        <input name="address" value={formData.address} onChange={handleChange} className={inputClass} placeholder="例： 東京都渋谷区神南2-3" />
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>出店数 </label>
                                            <input name="recruitCount" type="number" value={formData.recruitCount} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>出店料 </label>
                                            <input name="fee" value={formData.fee} onChange={handleChange} className={inputClass} placeholder="例： 1日 5,000円 / 売上の10%" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>会場内ルール </label>
                                        <textarea name="venueRules" value={formData.venueRules} onChange={handleChange} rows={5} className={textareaClass} placeholder={"例：\n・火気の使用は禁止です\n・ゴミは各自持ち帰り\n・音量は80dB以下"} />
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
                                <h2 className={sectionTitle}><ImageIcon className="w-5 h-5 text-orange-500" /> メイン画像 <span className="text-slate-400 font-normal text-sm">（任意）</span></h2>
                                <label htmlFor="file-upload" className="mt-2 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-10 hover:bg-slate-50 transition-colors relative overflow-hidden cursor-pointer">
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
                            </section>
                        </div>
                    )}

                    {/* ============ Step 2: 規約・運営 ============ */}
                    {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">

                            {/* 出店規約 */}
                            <section>
                                <h2 className={sectionTitle}><Shield className="w-5 h-5 text-orange-500" /> 出店規約</h2>
                                <p className="text-sm text-slate-500 mb-4">出店者に同意していただく規約内容を設定してください。</p>
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>規約の履行 </label>
                                        <textarea name="termsCompliance" value={formData.termsCompliance} onChange={handleChange} rows={3} className={textareaClass} placeholder="例： 出店者は本規約の全条項を遵守するものとします。" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>出店資格 </label>
                                        <textarea name="boothQualification" value={formData.boothQualification} onChange={handleChange} rows={3} className={textareaClass} placeholder={"例：\n・食品衛生責任者の資格を有すること\n・営業許可証を取得していること"} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>肖像権・個人情報の取り扱い </label>
                                        <textarea name="privacyPolicy" value={formData.privacyPolicy} onChange={handleChange} rows={3} className={textareaClass} placeholder="例： イベント会場内では撮影を行う場合があります。" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>キャンセルポリシー </label>
                                        <textarea name="cancelPolicy" value={formData.cancelPolicy} onChange={handleChange} rows={3} className={textareaClass} placeholder={"例：\n・開催日30日前まで：全額返金\n・14日前まで：50%返金\n・7日前以降：返金不可"} />
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
                                        <input name="organizerName" value={formData.organizerName} onChange={handleChange} className={inputClass} placeholder="例： 株式会社イベントプランニング / 田中太郎" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><span className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> メールアドレス </span></label>
                                        <input name="organizerEmail" type="email" value={formData.organizerEmail} onChange={handleChange} className={inputClass} placeholder="例： event@example.com" />
                                    </div>
                                    <div>
                                        <label className={labelClass}><span className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> 電話番号 </span></label>
                                        <input name="organizerPhone" type="tel" value={formData.organizerPhone} onChange={handleChange} className={inputClass} placeholder="例： 03-1234-5678" />
                                    </div>
                                </div>
                            </section>

                            {/* 搬出入 */}
                            <section>
                                <h2 className={sectionTitle}><Truck className="w-5 h-5 text-orange-500" /> 搬出入について <span className="text-slate-400 font-normal text-sm">（任意）</span>{editableBadge}</h2>
                                <textarea name="loadingInfo" value={formData.loadingInfo} onChange={handleChange} rows={5} className={textareaClass} placeholder={"例：\n・搬入時間：開催日前日 14:00〜17:00、当日 7:00〜9:00\n・搬出時間：イベント終了後〜19:00\n・搬入口：会場北側ゲートから進入"} />
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
                                                            <span className={cn("ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded", field.type === "file" ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500")}>
                                                                {field.type === "file" ? "画像" : "テキスト"}
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
                                        <button type="button" onClick={() => addCustomField("text")} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-orange-600 transition-colors">
                                            <Plus className="w-4 h-4" /> カスタム質問を追加
                                        </button>
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
                                    </dl>
                                </section>

                                {/* 日時 */}
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-1">日時</h3>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                        <div><dt className="text-slate-500 text-xs">開催日</dt><dd className="font-semibold text-slate-900">{formData.startDate}{formData.endDate && ` ～ ${formData.endDate}`}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">時間</dt><dd className="font-semibold text-slate-900">{formData.startTime} - {formData.endTime}</dd></div>
                                        <div><dt className="text-slate-500 text-xs">延期時の仮日</dt><dd className="font-semibold text-slate-900">{formData.postponedType === "none" ? "延期なし" : formData.postponedDate}</dd></div>
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
                                        <div className="col-span-2"><dt className="text-slate-500 text-xs">会場内ルール</dt><dd className="font-semibold text-slate-900 whitespace-pre-wrap">{formData.venueRules}</dd></div>
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
                                disabled={!canProceed()}
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 shadow-md shadow-orange-200"
                            >
                                次へ進む <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                disabled={isLoading || isApproved === false}
                                className="bg-slate-900 hover:bg-black text-white rounded-full px-10 shadow-lg h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isApproved === false ? "管理者の承認が必要です" : undefined}
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
