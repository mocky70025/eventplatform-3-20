"use client";

import { useState, useEffect, useRef } from "react";
import { LogoMark } from "@/components/LogoMark";
import { LegalModal } from "@/components/LegalModal";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
    Store,
    Building2,
    User,
    Phone,
    Mail,
    Globe,
    MapPin,
    Loader2,
    ChevronDown,
    Check,
    Camera,
} from "lucide-react";

export interface OnboardingConfig {
    appType: "store" | "organizer";
    primaryColor: string;
    primaryLightColor: string;
    bgColor: string;
    title: string;
    badgeLabel: string;
    icon: React.ReactNode;
    draftKey: string;
    tableName: "exhibitors" | "organizers";
    avatarBucket: "exhibitor-avatars" | "organizer-avatars";
    formFields: OnboardingFormFields;
    requiredFields: (keyof OnboardingFormFields)[];
    initialsFrom: keyof OnboardingFormFields;
}

export interface OnboardingFormFields {
    companyName: string;
    storeName?: string;
    repName: string;
    email: string;
    phone: string;
    prefecture?: string;
    cityAddress?: string;
    building?: string;
    postalCode: string;
    address?: string;
    website: string;
    description: string;
}

export interface OnboardingSubmitData {
    user_id: string;
    company_name?: string;
    shop_name?: string;
    name: string;
    email: string;
    phone_number: string;
    prefecture?: string;
    city_address?: string;
    building?: string | null;
    address?: string | null;
    postal_code?: string | null;
    social_links?: Record<string, string> | null;
    description?: string | null;
    [key: string]: any;
}

const PREFECTURES = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
    "岐阜県", "静岡県", "愛知県", "三重県",
    "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
    "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県",
    "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^[\d\-+() ]{10,15}$/.test(phone.replace(/\s/g, ''));

export function OnboardingForm({ config }: { config: OnboardingConfig }) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [readTerms, setReadTerms] = useState(false);
    const [readPrivacy, setReadPrivacy] = useState(false);
    const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);
    const [error, setError] = useState("");
    const [showErrors, setShowErrors] = useState(false);
    const [sessionMissing, setSessionMissing] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [cropState, setCropState] = useState<{ src: string; aspect: number; onDone: (f: File) => void } | null>(null);
    const [postalCode, setPostalCode] = useState("");
    const [postalCodeLoading, setPostalCodeLoading] = useState(false);
    const [postalCodeError, setPostalCodeError] = useState("");
    const supabase = createClient();

    const initialFormData: OnboardingFormFields = {
        companyName: "",
        storeName: "",
        repName: "",
        email: "",
        phone: "",
        prefecture: "",
        cityAddress: "",
        building: "",
        postalCode: "",
        address: "",
        website: "",
        description: "",
    };

    const [formData, setFormData] = useState<OnboardingFormFields>(initialFormData);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Persist draft
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(config.draftKey);
            if (saved) {
                const d = JSON.parse(saved);
                if (d.formData) setFormData((prev) => ({ ...prev, ...d.formData }));
                if (typeof d.agreedTerms === "boolean") setAgreedTerms(d.agreedTerms);
                if (typeof d.agreedPrivacy === "boolean") setAgreedPrivacy(d.agreedPrivacy);
            }
        } catch { }
    }, [config.draftKey]);

    useEffect(() => {
        try {
            sessionStorage.setItem(config.draftKey, JSON.stringify({ formData, agreedTerms, agreedPrivacy }));
        } catch { }
    }, [formData, agreedTerms, agreedPrivacy, config.draftKey]);

    // Check user session
    useEffect(() => {
        const checkUser = async (retry = false) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setError("");
                setSessionMissing(false);
                if (user.email) {
                    setFormData(prev => ({ ...prev, email: user.email || "" }));
                }
                return;
            }
            if (!retry) {
                await new Promise((r) => setTimeout(r, 600));
                return checkUser(true);
            }
            setSessionMissing(true);
            setError("");
        };
        checkUser();
    }, []);

    const lookupPostalCode = async () => {
        const code = postalCode.replace(/-/g, "");
        if (code.length !== 7) {
            setPostalCodeError("7桁の郵便番号を入力してください");
            return;
        }
        setPostalCodeLoading(true);
        setPostalCodeError("");
        try {
            const res = await fetch(`/api/zipcode?zipcode=${code}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const r = data.results[0];
                if (config.formFields.prefecture !== undefined) {
                    // Store: separate prefecture and city
                    setFormData(prev => ({
                        ...prev,
                        prefecture: r.address1,
                        cityAddress: r.address2 + r.address3,
                    }));
                } else {
                    // Organizer: combined address
                    setFormData(prev => ({
                        ...prev,
                        address: `${r.address1}${r.address2}${r.address3}`,
                    }));
                }
            } else {
                setPostalCodeError("住所が見つかりませんでした");
            }
        } catch {
            setPostalCodeError("検索に失敗しました");
        } finally {
            setPostalCodeLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateField = (name: string, value: string): string | null => {
        switch (name) {
            case "companyName":
            case "storeName":
                if (!value.trim()) return `${name === "storeName" ? "店舗名" : "団体名"}を入力してください`;
                if (value.length > 200) return `${name === "storeName" ? "店舗名" : "団体名"}は200文字以内で入力してください`;
                return null;
            case "repName":
                if (!value.trim()) return "代表者名を入力してください";
                if (value.length > 100) return "代表者名は100文字以内で入力してください";
                return null;
            case "email":
                if (value && !isValidEmail(value)) return "有効なメールアドレスを入力してください";
                return null;
            case "phone":
                if (value && !isValidPhone(value)) return "有効な電話番号を入力してください（半角数字・ハイフン、10〜15桁）";
                return null;
            case "postalCode":
                if (value && !/^\d{3}-?\d{4}$/.test(value) && !/^\d{7}$/.test(value)) return "郵便番号は7桁の数字で入力してください";
                return null;
            case "prefecture":
                if (value === "" && config.requiredFields.includes("prefecture")) return "都道府県を選択してください";
                return null;
            case "cityAddress":
                if (value === "" && config.requiredFields.includes("cityAddress")) return "市区町村・番地を入力してください";
                if (value && value.length > 200) return "市区町村・番地は200文字以内で入力してください";
                return null;
            case "address":
                if (value === "" && config.requiredFields.includes("address")) return "住所を入力してください";
                if (value && value.length > 200) return "住所は200文字以内で入力してください";
                return null;
            default:
                return null;
        }
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setError("");
        setSuccess("");
    };

    const [success, setSuccess] = useState("");

    const openCrop = (file: File, aspect: number, onDone: (f: File) => void) => {
        setCropState({ src: URL.createObjectURL(file), aspect, onDone });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            setError("画像ファイルを選択してください");
            return;
        }
        setError("");
        openCrop(file, 1, (cropped) => uploadAvatar(cropped));
    };

    const uploadAvatar = async (file: File) => {
        setIsUploadingImage(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const filePath = `${user.id}/avatar.jpg`;

            const { error: uploadError } = await supabase.storage
                .from(config.avatarBucket)
                .upload(filePath, file, { upsert: true, metadata: { user_id: user.id } });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(config.avatarBucket)
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            const { error: updateError } = await supabase
                .from(config.tableName)
                .update({ avatar_url: publicUrl })
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
            setSuccess("プロフィール画像を更新しました");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "画像のアップロードに失敗しました");
        } finally {
            setIsUploadingImage(false);
            setCropState(null);
        }
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!agreedTerms || !agreedPrivacy) {
            setError("利用規約とプライバシーポリシーに同意してください。");
            return;
        }

        const missingRequired = config.requiredFields.some(field => !formData[field]);
        const emailInvalid = formData.email && !isValidEmail(formData.email);
        const phoneInvalid = formData.phone && !isValidPhone(formData.phone);

        if (missingRequired || emailInvalid || phoneInvalid) {
            setShowErrors(true);
            return;
        }

        // Run field validations
        const errors: Record<string, string> = {};
        for (const name of config.requiredFields) {
            const err = validateField(name, formData[name]);
            if (err) errors[name] = err;
        }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setShowErrors(true);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            // Build update data
            const updateData: OnboardingSubmitData = {
                user_id: user.id,
            };

            if (config.tableName === "exhibitors") {
                updateData.shop_name = formData.storeName || formData.companyName;
                updateData.prefecture = formData.prefecture;
                updateData.city_address = formData.cityAddress;
                updateData.building = formData.building || null;
                updateData.address = `${formData.prefecture}${formData.cityAddress}${formData.building || ""}`;
            } else {
                updateData.company_name = formData.companyName;
                updateData.postal_code = formData.postalCode.replace(/[-\s]/g, "") || null;
                updateData.address = formData.address;
                updateData.social_links = formData.website ? { website: formData.website } : null;
            }

            updateData.name = formData.repName;
            updateData.email = formData.email;
            updateData.phone_number = formData.phone;
            updateData.description = formData.description;

            const { error: updateError } = await supabase
                .from(config.tableName)
                .upsert(updateData)
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            try { sessionStorage.removeItem(config.draftKey); } catch { }
            router.push("/");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "登録に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    // Avatar preview
    useEffect(() => {
        if (config.tableName === "exhibitors") {
            // For store, we'd need to fetch from exhibitors table
            // For now, use local state
        }
    }, []);

    const initials = formData[config.initialsFrom]
        ? formData[config.initialsFrom]!.substring(0, 2)
        : config.appType === "store" ? "店" : "主";

    const inputBase = `w-full border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition ${showErrors && !formData[name] ? "border-red-400 focus:ring-red-500 focus:border-red-500" : `border-slate-200 focus:ring-${config.primaryColor} focus:border-${config.primaryColor}`}`;
    const inputClass = `w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-${config.primaryColor} focus:border-${config.primaryColor} ${showErrors && !formData[name] ? "border-red-400 focus:ring-red-500 focus:border-red-500" : ""}`;

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${config.bgColor}`}>
            <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
            {/* Card */}
            <div className="relative z-10 w-[520px] max-w-lg bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-8 md:px-11 py-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-6">
                    <LogoMark />
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
                    <span className={`text-xs bg-${config.primaryLightColor} text-${config.primaryColor} px-2 rounded-full font-semibold inline-flex items-center justify-center h-5`} style={{ lineHeight: 1 }}>
                        {config.badgeLabel}
                    </span>
                </div>

                {sessionMissing && (
                    <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                        <p className="font-medium">セッションが確認できませんでした。</p>
                        <p className="mt-1 text-amber-700">登録フォームはそのままご利用いただけます。送信時にエラーになる場合は、一度ログインしてから再度このページへお越しください。</p>
                        <a href="/login" className="mt-2 inline-block font-medium text-amber-700 underline hover:text-amber-900">ログインへ</a>
                    </div>
                )}

                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-[22px] font-bold text-slate-900">{config.title}</h2>
                    </div>

                    {/* Avatar Upload */}
                    <div className="relative flex items-center justify-center">
                        <div className="relative">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="プロフィール画像"
                                    className="w-20 h-20 rounded-2xl object-cover"
                                />
                            ) : (
                                <div className={`w-20 h-20 rounded-2xl bg-${config.primaryLightColor} flex items-center justify-center text-${config.primaryColor} text-xl font-bold`}>
                                    {initials}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleImageClick}
                                disabled={isUploadingImage}
                                className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-${config.primaryColor} flex items-center justify-center shadow-md disabled:opacity-50`}
                            >
                                {isUploadingImage ? (
                                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-3.5 h-3.5 text-white" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Company/Store Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                {config.formFields.storeName !== undefined ? "店舗名 / 屋号" : "主催団体名 / 会社名"}
                            </label>
                            {showErrors && !formData[config.formFields.storeName !== undefined ? "storeName" : "companyName"] && (
                                <p className="text-xs text-red-500 mb-1">{config.formFields.storeName !== undefined ? "店舗名" : "団体名"}を入力してください</p>
                            )}
                            <input
                                name={config.formFields.storeName !== undefined ? "storeName" : "companyName"}
                                value={formData[config.formFields.storeName !== undefined ? "storeName" : "companyName"]}
                                onChange={handleChange}
                                onBlur={(e) => {
                                    const err = validateField(e.target.name, e.target.value);
                                    if (err) setFieldErrors(prev => ({ ...prev, [e.target.name]: err }));
                                    else setFieldErrors(prev => { const next = { ...prev }; delete next[e.target.name]; return next; });
                                }}
                                className={inputClass}
                                placeholder={config.formFields.storeName !== undefined ? "たこ焼き太郎" : "株式会社イベントプロ"}
                            />
                            {fieldErrors[config.formFields.storeName !== undefined ? "storeName" : "companyName"] && (
                                <p className="text-xs text-red-500 mt-1">{fieldErrors[config.formFields.storeName !== undefined ? "storeName" : "companyName"]}</p>
                            )}
                        </div>

                        {/* Representative Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">代表者名 / 担当者名</label>
                            {showErrors && !formData.repName && <p className="text-xs text-red-500 mb-1">代表者名を入力してください</p>}
                            <input
                                name="repName"
                                value={formData.repName}
                                onChange={handleChange}
                                onBlur={(e) => {
                                    const err = validateField(e.target.name, e.target.value);
                                    if (err) setFieldErrors(prev => ({ ...prev, [e.target.name]: err }));
                                    else setFieldErrors(prev => { const next = { ...prev }; delete next[e.target.name]; return next; });
                                }}
                                className={inputClass}
                                placeholder={config.appType === "store" ? "田中 太郎" : "山田 太郎"}
                            />
                            {fieldErrors.repName && <p className="text-xs text-red-500 mt-1">{fieldErrors.repName}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">メールアドレス</label>
                            {showErrors && !formData.email && <p className="text-xs text-red-500 mb-1">メールアドレスを入力してください</p>}
                            {fieldErrors.email && <p className="text-xs text-red-500 mb-1">{fieldErrors.email}</p>}
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={(e) => {
                                    const err = validateField(e.target.name, e.target.value);
                                    if (err) setFieldErrors(prev => ({ ...prev, [e.target.name]: err }));
                                    else setFieldErrors(prev => { const next = { ...prev }; delete next[e.target.name]; return next; });
                                }}
                                type="email"
                                className={inputClass}
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">電話番号</label>
                            {showErrors && !formData.phone && <p className="text-xs text-red-500 mb-1">電話番号を入力してください</p>}
                            {fieldErrors.phone && <p className="text-xs text-red-500 mb-1">{fieldErrors.phone}</p>}
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={(e) => {
                                    const err = validateField(e.target.name, e.target.value);
                                    if (err) setFieldErrors(prev => ({ ...prev, [e.target.name]: err }));
                                    else setFieldErrors(prev => { const next = { ...prev }; delete next[e.target.name]; return next; });
                                }}
                                type="tel"
                                className={inputClass}
                                placeholder={config.appType === "store" ? "090-1234-5678" : "03-1234-5678"}
                            />
                        </div>

                        {/* Website */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">SNS・ウェブサイト URL <span className="text-slate-500 font-normal">（任意）</span></label>
                            <input
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                type="url"
                                className={inputClass}
                                placeholder="https://..."
                            />
                        </div>

                        {/* Postal Code Lookup */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">郵便番号で住所検索</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={postalCode}
                                    onChange={e => { setPostalCode(e.target.value); setPostalCodeError(""); }}
                                    onKeyDown={e => e.key === "Enter" && lookupPostalCode()}
                                    className={`flex-1 min-w-0 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-500 ${inputClass}`}
                                    placeholder="1234567"
                                    maxLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={lookupPostalCode}
                                    disabled={postalCodeLoading}
                                    className={`inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-${config.primaryColor} text-white hover:bg-${config.primaryColor}600 disabled:opacity-50 transition-colors`}
                                >
                                    {postalCodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "検索"}
                                </button>
                            </div>
                            {postalCodeError && <p className="text-xs text-red-500 mt-1">{postalCodeError}</p>}
                        </div>

                        {/* Address - conditional rendering based on config */}
                        {config.formFields.prefecture !== undefined && (
                            <>
                                {/* Prefecture */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">都道府県</label>
                                    {showErrors && !formData.prefecture && <p className="text-xs text-red-500 mb-1">都道府県を選択してください</p>}
                                    <select
                                        name="prefecture"
                                        value={formData.prefecture}
                                        onChange={handleChange}
                                        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                                    >
                                        <option value="">選択してください</option>
                                        {PREFECTURES.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* City Address */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">市区町村・番地</label>
                                    {showErrors && !formData.cityAddress && <p className="text-xs text-red-500 mb-1">市区町村・番地を入力してください</p>}
                                    <input
                                        name="cityAddress"
                                        value={formData.cityAddress}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="渋谷区神宮前1-2-3"
                                    />
                                </div>

                                {/* Building */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">建物名 <span className="text-slate-500 font-normal">（任意）</span></label>
                                    <input
                                        name="building"
                                        value={formData.building}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="〇〇ビル 3F"
                                    />
                                </div>
                            </>
                        )}

                        {config.formFields.address !== undefined && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">住所</label>
                                    {showErrors && !formData.address && <p className="text-xs text-red-500 mb-1">住所を入力してください</p>}
                                    <input
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={inputClass}
                                        placeholder="渋谷区神宮前1-2-3 〇〇ビル 3F"
                                    />
                                </div>
                            </>
                        )}

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                {config.appType === "store" ? "お店の紹介" : "自己紹介 / 団体概要"} <span className="text-slate-500 font-normal">（任意）</span>
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                maxLength={100}
                                className={inputClass + " resize-none"}
                                placeholder={config.appType === "store" ? "お店の特徴やメニューの紹介を入力してください" : "どのようなイベントを主催しているか、簡単な説明を入力してください。"}
                            />
                            <p className="text-xs text-slate-500 mt-1 text-right">{formData.description.length}/100</p>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200 text-left">
                            <p className="font-bold mb-1">エラーが発生しました</p>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="space-y-2.5 pt-1">
                        <label className={`flex items-start gap-2.5 text-sm text-slate-600 select-none ${readTerms ? "cursor-pointer" : "cursor-default"}`}>
                            <input type="checkbox" checked={agreedTerms} disabled={!readTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="sr-only" />
                            <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreedTerms ? `bg-${config.primaryColor} border-${config.primaryColor}` : readTerms ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                                {agreedTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal("terms"); setReadTerms(true); }} className={`text-${config.primaryColor}600 underline hover:text-${config.primaryColor}700`}>利用規約</button>
                                に同意する
                                {!readTerms && <span className="block text-xs text-slate-500 mt-0.5">※ 内容を確認すると選択できます</span>}
                            </span>
                        </label>
                        <label className={`flex items-start gap-2.5 text-sm text-slate-600 select-none ${readPrivacy ? "cursor-pointer" : "cursor-default"}`}>
                            <input type="checkbox" checked={agreedPrivacy} disabled={!readPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="sr-only" />
                            <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreedPrivacy ? `bg-${config.primaryColor} border-${config.primaryColor}` : readPrivacy ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                                {agreedPrivacy && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal("privacy"); setReadPrivacy(true); }} className={`text-${config.primaryColor}600 underline hover:text-${config.primaryColor}700`}>プライバシーポリシー</button>
                                に同意する
                                {!readPrivacy && <span className="block text-xs text-slate-500 mt-0.5">※ 内容を確認すると選択できます</span>}
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !agreedTerms || !agreedPrivacy || config.requiredFields.some(f => !formData[f])}
                            className={`w-full h-12 rounded-xl bg-${config.primaryColor} hover:bg-${config.primaryColor}600 text-white font-semibold text-sm shadow-lg shadow-${config.primaryColor}/25 transition disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    登録処理中...
                                </>
                            ) : (
                                "登録してダッシュボードへ"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />

            {/* Image Crop Dialog */}
            {cropState && (
                <ImageCropDialog
                    imageSrc={cropState.src}
                    aspect={cropState.aspect}
                    accent={config.primaryColor}
                    title="プロフィール画像を調整"
                    maxWidth={600}
                    onCancel={() => { URL.revokeObjectURL(cropState.src); setCropState(null); }}
                    onDone={(croppedFile) => {
                        cropState.onDone(croppedFile);
                        URL.revokeObjectURL(cropState.src);
                        setCropState(null);
                    }}
                />
            )}
        </div>
    );
}

// Simple ImageCropDialog component
function ImageCropDialog({
    imageSrc,
    aspect,
    accent,
    title,
    maxWidth,
    onCancel,
    onDone,
}: {
    imageSrc: string;
    aspect: number;
    accent: string;
    title: string;
    maxWidth: number;
    onCancel: () => void;
    onDone: (file: File) => void;
}) {
    // Simplified - in real implementation, use a proper cropper
    // For now, just pass through
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div className="p-4">
                    <img src={imageSrc} alt="Crop preview" className="max-w-full max-h-[60vh] mx-auto" />
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">キャンセル</button>
                        <button onClick={() => {}} className={`px-4 py-2 text-sm font-medium text-white bg-${accent} hover:opacity-90 rounded-lg`}>決定</button>
                    </div>
                </div>
            </div>
        </div>
    );
}