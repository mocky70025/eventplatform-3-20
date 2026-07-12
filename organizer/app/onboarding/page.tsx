"use client";

import { useState, useEffect } from "react";
import { LogoMark } from "@/components/LogoMark";
import { Building2, User, Phone, MapPin, Globe, Loader2, Mail, ChevronDown, Check } from "lucide-react";
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
    const [postalCode, setPostalCode] = useState("");
    const [postalCodeLoading, setPostalCodeLoading] = useState(false);
    const [postalCodeError, setPostalCodeError] = useState("");
    const supabase = createClient();

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

    const [formData, setFormData] = useState({
        companyName: "",
        repName: "",
        email: "",
        phone: "",
        prefecture: "",
        cityAddress: "",
        building: "",
        website: "",
        description: "",
    });

    // Persist the draft so leaving for 利用規約/プライバシー and coming back keeps inputs
    const DRAFT_KEY = "organizer-onboarding-draft";
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
            // No user: after redirect from OAuth, cookies may not be ready yet
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

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone: string) => /^[\d\-+() ]{10,15}$/.test(phone.replace(/\s/g, ''));

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!agreedTerms || !agreedPrivacy) {
            setError("利用規約とプライバシーポリシーに同意してください。");
            return;
        }

        const missingRequired = !formData.companyName || !formData.repName || !formData.email || !formData.phone || !formData.prefecture || !formData.cityAddress;
        const emailInvalid = formData.email && !isValidEmail(formData.email);
        const phoneInvalid = formData.phone && !isValidPhone(formData.phone);

        if (missingRequired || emailInvalid || phoneInvalid) {
            setShowErrors(true);
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("ログインしていません。サインアップ後、自動的にログインされているはずですが、セッションが見つかりません。");
            }

            const { error: insertError } = await supabase
                .from("organizers")
                .insert({
                    user_id: user.id,
                    company_name: formData.companyName,
                    name: formData.repName,
                    email: formData.email,
                    phone_number: formData.phone,
                    prefecture: formData.prefecture,
                    city_address: formData.cityAddress,
                    building: formData.building || null,
                    address: `${formData.prefecture}${formData.cityAddress}${formData.building || ""}`,
                    description: formData.description || null,
                    social_links: formData.website ? { website: formData.website } : null,
                    is_approved: true,
                });

            if (insertError) throw insertError;

            try { sessionStorage.removeItem(DRAFT_KEY); } catch { }

            router.push("/");
        } catch (error: any) {
            setError(error.message || "プロフィール登録に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase = "w-full rounded-xl border pl-10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-500";
    const inputBaseNoIcon = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-500";
    const normalBorder = "border-slate-300 focus:ring-orange-500 focus:border-orange-500";
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
        <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-[#fdf8f1]">
            <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
            {/* Background decorations */}

            {/* Floating dots */}

            {/* Card */}
            <div className="relative z-10 w-[520px] max-w-lg bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-8 md:px-11 py-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <LogoMark />
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>主催者</span>
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
                        <h2 className="text-[22px] font-bold text-slate-900">主催者情報の登録</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">主催団体名 / 会社名</label>
                            {fieldErrorMsg("companyName", "団体名")}
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className={inputClassName("companyName")}
                                    placeholder="株式会社イベントプロ"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">代表者名 / 担当者名</label>
                            {fieldErrorMsg("repName", "代表者名")}
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="repName"
                                    value={formData.repName}
                                    onChange={handleChange}
                                    className={inputClassName("repName")}
                                    placeholder="山田 太郎"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">メールアドレス</label>
                            {fieldErrorMsg("email", "メールアドレス")}
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    type="email"
                                    className={inputClassName("email")}
                                    placeholder="contact@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">電話番号</label>
                            {fieldErrorMsg("phone", "電話番号")}
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    type="tel"
                                    className={inputClassName("phone")}
                                    placeholder="03-1234-5678"
                                />
                            </div>
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
                                    className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">自己紹介 / 団体概要 <span className="text-slate-500 font-normal">（任意）</span></label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className={inputClassNameNoIcon("description") + " resize-none"}
                                placeholder="どのようなイベントを主催しているか、簡単な説明を入力してください。"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-200 text-left">
                            <p className="font-bold mb-1">エラーが発生しました</p>
                            <p>{error}</p>
                            <div className="mt-2 pt-2 border-t border-red-100 text-xs text-red-500">
                                Supabase Dashboard &rarr; Authentication &rarr; Providers &rarr; Email &rarr; <b>Confirm email</b> を OFF に設定して、新しいアカウントでやり直してください。
                            </div>
                        </div>
                    )}

                    <div className="space-y-2.5 pt-1">
                        <label className={`flex items-start gap-2.5 text-sm text-slate-600 select-none ${readTerms ? "cursor-pointer" : "cursor-default"}`}>
                            <input type="checkbox" checked={agreedTerms} disabled={!readTerms} onChange={(e) => setAgreedTerms(e.target.checked)} className="sr-only" />
                            <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreedTerms ? "bg-orange-500 border-orange-500" : readTerms ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                                {agreedTerms && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal("terms"); setReadTerms(true); }} className="text-orange-600 underline hover:text-orange-700">利用規約</button>
                                に同意する
                                {!readTerms && <span className="block text-xs text-slate-500 mt-0.5">※ 内容を確認すると選択できます</span>}
                            </span>
                        </label>
                        <label className={`flex items-start gap-2.5 text-sm text-slate-600 select-none ${readPrivacy ? "cursor-pointer" : "cursor-default"}`}>
                            <input type="checkbox" checked={agreedPrivacy} disabled={!readPrivacy} onChange={(e) => setAgreedPrivacy(e.target.checked)} className="sr-only" />
                            <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${agreedPrivacy ? "bg-orange-500 border-orange-500" : readPrivacy ? "bg-white border-slate-300" : "bg-slate-100 border-slate-200"}`}>
                                {agreedPrivacy && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                            </span>
                            <span>
                                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLegalModal("privacy"); setReadPrivacy(true); }} className="text-orange-600 underline hover:text-orange-700">プライバシーポリシー</button>
                                に同意する
                                {!readPrivacy && <span className="block text-xs text-slate-500 mt-0.5">※ 内容を確認すると選択できます</span>}
                            </span>
                        </label>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !agreedTerms || !agreedPrivacy || !formData.companyName || !formData.repName || !formData.email || !formData.phone || !formData.prefecture || !formData.cityAddress}
                            className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
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
