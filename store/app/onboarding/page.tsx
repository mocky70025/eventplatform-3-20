"use client";

import { useState, useEffect } from "react";
import { LogoMark } from "@/components/LogoMark";
import { Store, User, Phone, Mail, Globe, MapPin, Loader2, FileText, ChevronDown, Check } from "lucide-react";
import { LegalModal } from "@/components/LegalModal";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const OPTIONAL_DOCS: { key: string; label: string; col: string }[] = [
    { key: "foodSafety", label: "食品衛生責任者証", col: "business_license_image_url" },
    { key: "plInsurance", label: "PL保険証書", col: "pl_insurance_image_url" },
    { key: "vehicleInspection", label: "車検証", col: "vehicle_inspection_image_url" },
    { key: "fireEquipment", label: "火器類配置図", col: "fire_equipment_layout_image_url" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);
    const [readTerms, setReadTerms] = useState(false);
    const [readPrivacy, setReadPrivacy] = useState(false);
    const [legalModal, setLegalModal] = useState<"terms" | "privacy" | null>(null);
    const [error, setError] = useState("");
    const [showErrors, setShowErrors] = useState(false);
    const [sessionMissing, setSessionMissing] = useState(false);
    const supabase = createClient();

    const [formData, setFormData] = useState({
        storeName: "",
        repName: "",
        email: "",
        phone: "",
        prefecture: "",
        cityAddress: "",
        building: "",
        website: "",
        description: "",
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    // Persist the draft so leaving for 利用規約/プライバシー and coming back keeps inputs
    const DRAFT_KEY = "store-onboarding-draft";
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(DRAFT_KEY);
            if (saved) {
                const d = JSON.parse(saved);
                if (d.formData) setFormData((prev) => ({ ...prev, ...d.formData }));
                if (typeof d.agreedTerms === "boolean") setAgreedTerms(d.agreedTerms);
                if (typeof d.agreedPrivacy === "boolean") setAgreedPrivacy(d.agreedPrivacy);
            }
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        try {
            sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, agreedTerms, agreedPrivacy }));
        } catch { }
    }, [formData, agreedTerms, agreedPrivacy]);

    const [licenseFile, setLicenseFile] = useState<File | null>(null);
    const [licensePreview, setLicensePreview] = useState("");
    const [optionalFiles, setOptionalFiles] = useState<Record<string, File | null>>({});
    const [optionalPreviews, setOptionalPreviews] = useState<Record<string, string>>({});
    const [aiResult, setAiResult] = useState<{ status: "idle" | "verifying" | "success" | "error"; message?: string }>({ status: "idle" });
    const [postalCode, setPostalCode] = useState("");
    const [postalCodeLoading, setPostalCodeLoading] = useState(false);
    const [postalCodeError, setPostalCodeError] = useState("");

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
                setFormData(prev => ({
                    ...prev,
                    prefecture: r.address1,
                    cityAddress: r.address2 + r.address3,
                }));
            } else {
                setPostalCodeError("住所が見つかりませんでした");
            }
        } catch {
            setPostalCodeError("検索に失敗しました");
        } finally {
            setPostalCodeLoading(false);
        }
    };

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            if (file.size > MAX_FILE_SIZE) {
                setError("ファイルサイズが大きすぎます（最大10MB）");
                e.target.value = '';
                return;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                setError("対応していないファイル形式です（JPEG, PNG, GIF, WebP, PDFのみ）");
                e.target.value = '';
                return;
            }

            setError("");
            setLicenseFile(file);

            const reader = new FileReader();
            reader.onloadend = async () => {
                const result = reader.result as string;
                setLicensePreview(result);

                setAiResult({ status: "verifying" });
                try {
                    const response = await fetch("/api/verify-document", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: result, type: "businessLicense" }),
                    });
                    if (!response.ok) {
                        setAiResult({ status: "idle" });
                        return;
                    }
                    const data = await response.json();
                    if (data.success) {
                        setAiResult({ status: "success", message: data.message });
                    } else {
                        setAiResult({ status: "idle", message: data.message });
                    }
                } catch {
                    setAiResult({ status: "idle" });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setLicenseFile(null);
        setLicensePreview("");
        setAiResult({ status: "idle" });
    };

    const handleOptionalFile = (key: string, file: File | null) => {
        if (!file) return;
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'].includes(ext)) {
            setError("対応していないファイル形式です");
            return;
        }
        setError("");
        setOptionalFiles((prev) => ({ ...prev, [key]: file }));
        const reader = new FileReader();
        reader.onloadend = () => setOptionalPreviews((prev) => ({ ...prev, [key]: reader.result as string }));
        reader.readAsDataURL(file);
    };

    const removeOptionalFile = (key: string) => {
        setOptionalFiles((prev) => ({ ...prev, [key]: null }));
        setOptionalPreviews((prev) => ({ ...prev, [key]: "" }));
    };

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone: string) => /^[\d\-+() ]{10,15}$/.test(phone.replace(/\s/g, ''));

    const validateField = (name: string, value: string) => {
        if (name === "email" && value && !isValidEmail(value)) {
            setFieldErrors(prev => ({ ...prev, [name]: "有効なメールアドレスを入力してください" }));
        } else if (name === "phone" && value && !isValidPhone(value)) {
            setFieldErrors(prev => ({ ...prev, [name]: "有効な電話番号を入力してください（半角数字・ハイフン、10〜15桁）" }));
        } else {
            setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
        }
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!agreedTerms || !agreedPrivacy) {
            setError("利用規約とプライバシーポリシーに同意してください。");
            return;
        }

        const missingRequired = !formData.storeName || !formData.repName || !formData.email || !formData.phone || !formData.prefecture || !formData.cityAddress || !formData.description || !licenseFile;
        const emailInvalid = formData.email && !isValidEmail(formData.email);
        const phoneInvalid = formData.phone && !isValidPhone(formData.phone);

        if (missingRequired || emailInvalid || phoneInvalid) {
            setShowErrors(true);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインしていません。サインアップ後、自動的にログインされているはずですが、セッションが見つかりません。");

            let licenseUrl: string | null = null;
            if (licenseFile) {
                const fileExt = (licenseFile.name.split(".").pop() || '').toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
                    throw new Error("対応していないファイル形式です");
                }
                const filePath = `${user.id}/businessLicense_${crypto.randomUUID()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from("exhibitor-documents").upload(filePath, licenseFile);
                if (uploadError) throw new Error("営業許可証のアップロードに失敗しました");
                licenseUrl = filePath;
            }

            const extraDocCols: Record<string, string> = {};
            for (const doc of OPTIONAL_DOCS) {
                const f = optionalFiles[doc.key];
                if (!f) continue;
                const ext = (f.name.split(".").pop() || "").toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(ext)) continue;
                const p = `${user.id}/${doc.key}_${crypto.randomUUID()}.${ext}`;
                const { error: upErr } = await supabase.storage.from("exhibitor-documents").upload(p, f);
                if (upErr) throw new Error(`${doc.label}のアップロードに失敗しました`);
                extraDocCols[doc.col] = p;
            }

            const { error: insertError } = await supabase.from("exhibitors").insert({
                user_id: user.id,
                shop_name: formData.storeName,
                name: formData.repName,
                email: formData.email,
                phone_number: formData.phone,
                prefecture: formData.prefecture,
                city_address: formData.cityAddress,
                building: formData.building || null,
                address: `${formData.prefecture}${formData.cityAddress}${formData.building || ""}`,
                description: formData.description,
                business_permit_image_url: licenseUrl,
                ...extraDocCols,
            });

            if (insertError) throw insertError;

            try { sessionStorage.removeItem(DRAFT_KEY); } catch { }
            router.push("/");
            router.refresh();
        } catch (error: any) {
            setError(error.message || "登録に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase = "w-full rounded-xl border pl-10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-500";
    const inputBaseNoIcon = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-500";
    const normalBorder = "border-slate-300 focus:ring-store-500 focus:border-store-500";
    const errorBorder = "border-red-400 focus:ring-red-500 focus:border-red-500";
    const fieldHasError = (name: string) => showErrors && !formData[name as keyof typeof formData];
    const fieldFormatError = (name: string) => {
        if (!showErrors || !formData[name as keyof typeof formData]) return false;
        if (name === "email") return !isValidEmail(formData.email);
        if (name === "phone") return !isValidPhone(formData.phone);
        return false;
    };
    const inputClassName = (name: string) => `${inputBase} ${fieldHasError(name) || fieldFormatError(name) ? errorBorder : normalBorder}`;
    const inputClassNameNoIcon = (name: string) => `${inputBaseNoIcon} ${fieldHasError(name) || fieldFormatError(name) ? errorBorder : normalBorder}`;
    const fieldErrorMsg = (name: string, label: string) => {
        if (fieldHasError(name)) return <p className="text-xs text-red-500 mb-1">{label}を入力してください</p>;
        if (fieldFormatError(name)) {
            if (name === "email") return <p className="text-xs text-red-500 mb-1">有効なメールアドレスを入力してください</p>;
            if (name === "phone") return <p className="text-xs text-red-500 mb-1">有効な電話番号を入力してください</p>;
        }
        return null;
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#f0fdf4]">
            <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
            {/* Card */}
            <div className="relative z-10 w-[520px] max-w-lg bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-8 md:px-11 py-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-6">
                    <LogoMark />
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
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
                        <h2 className="text-[22px] font-bold text-slate-900">出店者情報の登録</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">店舗名 / 屋号</label>
                            {fieldErrorMsg("storeName", "店舗名")}
                            <div className="relative">
                                <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="storeName"
                                    value={formData.storeName}
                                    onChange={handleChange}
                                    className={inputClassName("storeName")}
                                    placeholder="たこ焼き太郎"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">代表者名</label>
                            {fieldErrorMsg("repName", "代表者名")}
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="repName"
                                    value={formData.repName}
                                    onChange={handleChange}
                                    className={inputClassName("repName")}
                                    placeholder="田中 太郎"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">メールアドレス</label>
                            {fieldErrorMsg("email", "メールアドレス")}
                            {fieldErrors.email && <p className="text-xs text-red-500 mb-1">{fieldErrors.email}</p>}
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={(e) => validateField("email", e.target.value)}
                                    type="email"
                                    className={`${inputBase} ${fieldHasError("email") || fieldFormatError("email") || fieldErrors.email ? errorBorder : normalBorder}`}
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">電話番号</label>
                            {fieldErrorMsg("phone", "電話番号")}
                            {fieldErrors.phone && <p className="text-xs text-red-500 mb-1">{fieldErrors.phone}</p>}
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    onBlur={(e) => validateField("phone", e.target.value)}
                                    type="tel"
                                    className={`${inputBase} ${fieldHasError("phone") || fieldFormatError("phone") || fieldErrors.phone ? errorBorder : normalBorder}`}
                                    placeholder="090-1234-5678"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">郵便番号で住所検索</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={postalCode}
                                    onChange={e => { setPostalCode(e.target.value); setPostalCodeError(""); }}
                                    onKeyDown={e => e.key === "Enter" && lookupPostalCode()}
                                    className={`flex-1 min-w-0 rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-500 ${normalBorder}`}
                                    placeholder="1234567"
                                    maxLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={lookupPostalCode}
                                    disabled={postalCodeLoading}
                                    className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-store-500 text-white hover:bg-store-600 disabled:opacity-50 transition-colors"
                                >
                                    {postalCodeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "検索"}
                                </button>
                            </div>
                            {postalCodeError && <p className="text-xs text-red-500 mt-1">{postalCodeError}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">都道府県</label>
                            {fieldErrorMsg("prefecture", "都道府県")}
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <select
                                    name="prefecture"
                                    value={formData.prefecture}
                                    onChange={handleChange}
                                    className={`${inputClassName("prefecture")} appearance-none pr-10 cursor-pointer`}
                                >
                                    <option value="">選択してください</option>
                                    {PREFECTURES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">市区町村・番地</label>
                            {fieldErrorMsg("cityAddress", "市区町村・番地")}
                            <input
                                name="cityAddress"
                                value={formData.cityAddress}
                                onChange={handleChange}
                                className={inputClassNameNoIcon("cityAddress")}
                                placeholder="渋谷区神宮前1-2-3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">建物名 <span className="text-slate-500 font-normal">（任意）</span></label>
                            <input
                                name="building"
                                value={formData.building}
                                onChange={handleChange}
                                className={inputClassNameNoIcon("building")}
                                placeholder="〇〇ビル 3F"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">SNS・ウェブサイト URL <span className="text-slate-500 font-normal">（任意）</span></label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    type="url"
                                    className={inputClassName("website")}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">お店の紹介</label>
                            {fieldErrorMsg("description", "お店の紹介")}
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                maxLength={100}
                                className={inputClassNameNoIcon("description") + " resize-none"}
                                placeholder="お店の特徴やメニューの紹介を入力してください"
                            />
                            <p className="text-xs text-slate-500 mt-1 text-right">{formData.description.length}/100</p>
                        </div>

                        {/* 営業許可証 */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                <span className="flex items-center gap-1.5">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    営業許可証
                                </span>
                            </label>

                            {licensePreview ? (
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{licenseFile?.name}</p>
                                            {aiResult.status === "success" && (
                                                <span className="text-xs bg-store-50 text-store-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    AI確認済み
                                                </span>
                                            )}
                                            {aiResult.status === "verifying" && (
                                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    確認中...
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={removeFile}
                                            className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                                        <img src={licensePreview} alt="営業許可証" className="w-full h-36 object-contain" />
                                    </div>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-300 hover:border-store-400 hover:bg-store-50/30 transition cursor-pointer">
                                    <svg
                                        className="w-7 h-7 text-slate-300 mb-1.5"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                                        />
                                    </svg>
                                    <p className="text-sm text-slate-500">クリックしてアップロード</p>
                                    <p className="text-xs text-slate-500 mt-0.5">PNG, JPG, PDF（最大10MB）</p>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            )}
                            {showErrors && !licenseFile && (
                                <p className="text-red-500 text-xs mt-1">営業許可証のアップロードは必須です</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-bold text-slate-700 mb-1">その他の書類（任意）</p>
                        <p className="text-xs text-slate-500 mb-3">後からでも登録できますが、今登録しておくと応募がスムーズです。</p>
                        <div className="space-y-2">
                            {OPTIONAL_DOCS.map((doc) => (
                                <div key={doc.key} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                                        {optionalFiles[doc.key] && (
                                            <p className="text-xs text-slate-500 truncate">{optionalFiles[doc.key]?.name}</p>
                                        )}
                                    </div>
                                    {optionalFiles[doc.key] ? (
                                        <button
                                            type="button"
                                            onClick={() => removeOptionalFile(doc.key)}
                                            className="shrink-0 text-xs font-medium text-slate-500 hover:text-red-500"
                                        >
                                            削除
                                        </button>
                                    ) : (
                                        <label className="shrink-0 cursor-pointer text-xs font-semibold text-store-600 border border-store-200 bg-store-50 hover:bg-store-100 rounded-lg px-3 py-1.5 transition-colors">
                                            ファイルを選択
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                className="hidden"
                                                onChange={(e) => handleOptionalFile(doc.key, e.target.files?.[0] || null)}
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
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
                            <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreedTerms ? "bg-store-500 border-store-500" : readTerms ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                                {agreedTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal("terms"); setReadTerms(true); }} className="text-store-600 underline hover:text-store-700">利用規約</button>
                                に同意する
                                {!readTerms && <span className="block text-xs text-slate-500 mt-0.5">※ 内容を確認すると選択できます</span>}
                            </span>
                        </label>
                        <label className={`flex items-start gap-2.5 text-sm text-slate-600 select-none ${readPrivacy ? "cursor-pointer" : "cursor-default"}`}>
                            <input type="checkbox" checked={agreedPrivacy} disabled={!readPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="sr-only" />
                            <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreedPrivacy ? "bg-store-500 border-store-500" : readPrivacy ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                                {agreedPrivacy && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal("privacy"); setReadPrivacy(true); }} className="text-store-600 underline hover:text-store-700">プライバシーポリシー</button>
                                に同意する
                                {!readPrivacy && <span className="block text-xs text-slate-500 mt-0.5">※ 内容を確認すると選択できます</span>}
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !agreedTerms || !agreedPrivacy || !formData.storeName || !formData.repName || !formData.email || !formData.phone || !formData.prefecture || !formData.cityAddress || !formData.description}
                            className="w-full h-12 rounded-xl bg-store-500 hover:bg-store-600 text-white font-semibold text-sm shadow-lg shadow-store-500/25 transition disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
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
        </div>
    );
}
