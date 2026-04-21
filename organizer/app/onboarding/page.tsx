"use client";

import { useState, useEffect } from "react";
import { Building2, User, Phone, MapPin, Globe, Loader2, Mail } from "lucide-react";
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
    const [error, setError] = useState("");
    const [showErrors, setShowErrors] = useState(false);
    const [sessionMissing, setSessionMissing] = useState(false);
    const supabase = createClient();

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
                    is_approved: false,
                });

            if (insertError) throw insertError;

            router.push("/");
        } catch (error: any) {
            setError(error.message || "プロフィール登録に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    const inputBase = "w-full rounded-xl border pl-10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-400";
    const inputBaseNoIcon = "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition placeholder:text-slate-400";
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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50/20">
            {/* Background decorations */}
            <div className="absolute -top-[120px] -left-[60px] w-[400px] h-[400px] rounded-full bg-orange-200 opacity-15" />
            <div className="absolute -bottom-[100px] -right-[80px] w-[350px] h-[350px] rounded-full bg-orange-300 opacity-10" />
            <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] rounded-full bg-amber-200 opacity-[0.08]" />
            <div className="absolute bottom-[15%] left-[8%] w-[160px] h-[160px] rounded-full bg-pink-200 opacity-[0.08]" />

            {/* Floating dots */}
            <div className="absolute top-[10%] left-[15%] w-3.5 h-3.5 rounded-full bg-orange-400 opacity-50" />
            <div className="absolute top-[8%] right-[20%] w-2.5 h-2.5 rounded-full bg-pink-400 opacity-40" />
            <div className="absolute bottom-[12%] left-[25%] w-4 h-4 rounded-full bg-orange-400 opacity-30" />
            <div className="absolute bottom-[20%] right-[15%] w-3 h-3 rounded-full bg-purple-400 opacity-35" />
            <div className="absolute top-[40%] left-[6%] w-2.5 h-2.5 rounded-full bg-amber-400 opacity-40" />
            <div className="absolute top-[55%] right-[8%] w-3.5 h-3.5 rounded-full bg-orange-400 opacity-30" />

            {/* Card */}
            <div className="relative z-10 w-[520px] max-w-lg bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-8 md:px-11 py-10">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-6">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>主催者</span>
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
                        <p className="text-sm text-slate-500 mt-1.5">
                            基本情報を入力して、アカウント設定を完了しましょう
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">主催団体名 / 会社名</label>
                            {fieldErrorMsg("companyName", "団体名")}
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
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
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
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
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
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
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">SNS・ウェブサイト URL <span className="text-slate-400 font-normal">（任意）</span></label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">都道府県</label>
                            {fieldErrorMsg("prefecture", "都道府県")}
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                                <select
                                    name="prefecture"
                                    value={formData.prefecture}
                                    onChange={handleChange}
                                    className={inputClassName("prefecture")}
                                >
                                    <option value="">選択してください</option>
                                    {PREFECTURES.map(p => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">建物名 <span className="text-slate-400 font-normal">（任意）</span></label>
                            <input
                                name="building"
                                value={formData.building}
                                onChange={handleChange}
                                className={inputClassNameNoIcon("building")}
                                placeholder="〇〇ビル 3F"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">自己紹介 / 団体概要 <span className="text-slate-400 font-normal">（任意）</span></label>
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

                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !formData.companyName || !formData.repName || !formData.email || !formData.phone || !formData.prefecture || !formData.cityAddress}
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
