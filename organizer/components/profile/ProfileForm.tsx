"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2, Camera, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface ProfileFormProps {
    initialProfile: any;
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatar_url || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const initialFormData = {
        companyName: initialProfile?.company_name || "",
        repName: initialProfile?.name || "",
        email: initialProfile?.email || "",
        phone: initialProfile?.phone_number || "",
        postalCode: initialProfile?.postal_code || "",
        address: initialProfile?.address || "",
        website: initialProfile?.social_links?.website || "",
        description: initialProfile?.description || "",
    };

    const [formData, setFormData] = useState(initialFormData);
    const [showErrors, setShowErrors] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSearchingZip, setIsSearchingZip] = useState(false);

    const validateField = (name: string, value: string): string | null => {
        switch (name) {
            case "companyName":
                if (!value.trim()) return "団体名を入力してください";
                if (value.length > 200) return "団体名は200文字以内で入力してください";
                return null;
            case "repName":
                if (!value.trim()) return "代表者名を入力してください";
                if (value.length > 100) return "代表者名は100文字以内で入力してください";
                return null;
            case "phone":
                if (!value.trim()) return "電話番号を入力してください";
                if (!/^[\d\-+() ]{10,15}$/.test(value)) return "正しい電話番号を入力してください";
                return null;
            case "postalCode":
                if (!value.trim()) return null;
                if (!/^\d{3}-?\d{4}$/.test(value) && !/^\d{7}$/.test(value)) return "郵便番号は7桁の数字で入力してください";
                return null;
            case "address":
                if (!value.trim()) return null; // optional for organizer
                if (value.length > 200) return "住所は200文字以内で入力してください";
                return null;
            default:
                return null;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setSuccess("");
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        if (error) {
            setFieldErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const handlePostalCodeSearch = async () => {
        const raw = formData.postalCode.replace(/[-\s]/g, "");
        if (!/^\d{7}$/.test(raw)) {
            setFieldErrors(prev => ({ ...prev, postalCode: "郵便番号は7桁の数字で入力してください" }));
            return;
        }
        setIsSearchingZip(true);
        try {
            const res = await fetch(`/api/zipcode?zipcode=${raw}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const address = `${result.address1}${result.address2}${result.address3}`;
                setFormData(prev => ({ ...prev, address }));
                setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.postalCode;
                    delete next.address;
                    return next;
                });
            } else {
                setFieldErrors(prev => ({ ...prev, postalCode: "該当する住所が見つかりませんでした" }));
            }
        } catch {
            setFieldErrors(prev => ({ ...prev, postalCode: "住所の検索に失敗しました" }));
        } finally {
            setIsSearchingZip(false);
        }
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setError("");
        setSuccess("");
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("画像ファイルを選択してください");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("画像は5MB以内にしてください");
            return;
        }

        setIsUploadingImage(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const ext = file.name.split(".").pop();
            const filePath = `${user.id}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from("organizer-avatars")
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("organizer-avatars")
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            const { error: updateError } = await supabase
                .from("organizers")
                .update({ avatar_url: publicUrl })
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            setSuccess("プロフィール画像を更新しました");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "画像のアップロードに失敗しました");
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName || !formData.repName || !formData.phone) {
            setShowErrors(true);
            return;
        }

        // Run field validations
        const errors: Record<string, string> = {};
        for (const name of ["companyName", "repName", "phone", "postalCode", "address"] as const) {
            const err = validateField(name, formData[name]);
            if (err) errors[name] = err;
        }
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const { error: updateError } = await supabase
                .from("organizers")
                .update({
                    company_name: formData.companyName,
                    name: formData.repName,
                    email: formData.email,
                    phone_number: formData.phone,
                    postal_code: formData.postalCode.replace(/[-\s]/g, "") || null,
                    address: formData.address,
                    social_links: formData.website ? { website: formData.website } : null,
                    description: formData.description,
                })
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setSuccess("プロフィールを更新しました");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "更新に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const initials = formData.companyName
        ? formData.companyName.substring(0, 2)
        : "主";

    const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">
                    {success}
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
            />

            {/* Profile header card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="プロフィール画像"
                                className="w-20 h-20 rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 text-xl font-bold">
                                {initials}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleImageClick}
                            disabled={isUploadingImage}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-md disabled:opacity-50"
                        >
                            {isUploadingImage ? (
                                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                            ) : (
                                <Camera className="w-3.5 h-3.5 text-white" />
                            )}
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 truncate">
                            {formData.companyName || "団体名未設定"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5 mb-2">
                            @{formData.email ? formData.email.split("@")[0] : "handle"}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="h-6 inline-flex items-center justify-center px-2.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold" style={{ lineHeight: 1 }}>
                                {initialProfile?.is_approved ? "認証済み" : "承認待ち"}
                            </span>
                            <span className="h-6 inline-flex items-center justify-center px-2.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium" style={{ lineHeight: 1 }}>
                                主催者
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleImageClick}
                        disabled={isUploadingImage}
                        className="text-sm font-semibold text-orange-600 hover:text-orange-800 bg-orange-50 px-4 py-2 rounded-xl disabled:opacity-50"
                    >
                        {isUploadingImage ? "アップロード中..." : "画像を変更"}
                    </button>
                </div>
            </div>

            {/* Basic info form card */}
            <div id="basic" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <h3 className="text-base font-bold text-slate-900">基本情報</h3>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">主催団体名 / 会社名</label>
                    <input
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="株式会社イベントプロ"
                        className={(fieldErrors.companyName || (showErrors && !formData.companyName)) ? inputClass + " border-red-400 focus:ring-red-500 focus:border-red-500" : inputClass}
                    />
                    {(fieldErrors.companyName || (showErrors && !formData.companyName)) && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.companyName || "団体名を入力してください"}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">代表者名 / 担当者名</label>
                        <input
                            name="repName"
                            value={formData.repName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="山田 太郎"
                            className={(fieldErrors.repName || (showErrors && !formData.repName)) ? inputClass + " border-red-400 focus:ring-red-500 focus:border-red-500" : inputClass}
                        />
                        {(fieldErrors.repName || (showErrors && !formData.repName)) && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.repName || "代表者名を入力してください"}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">電話番号</label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            type="tel"
                            placeholder="03-1234-5678"
                            className={(fieldErrors.phone || (showErrors && !formData.phone)) ? inputClass + " border-red-400 focus:ring-red-500 focus:border-red-500" : inputClass}
                        />
                        {(fieldErrors.phone || (showErrors && !formData.phone)) && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.phone || "電話番号を入力してください"}</p>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">メールアドレス</label>
                    <input
                        name="email"
                        value={formData.email}
                        type="email"
                        readOnly
                        className={inputClass + " bg-slate-50 text-slate-500 cursor-not-allowed"}
                    />
                    <p className="text-xs text-slate-400 mt-1">メールアドレスの変更はアカウント設定から行ってください</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">郵便番号 <span className="text-slate-400 text-xs font-normal">(任意)</span></label>
                    <div className="flex gap-2">
                        <input
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="1000001"
                            maxLength={8}
                            className={(fieldErrors.postalCode ? inputClass + " border-red-400 focus:ring-red-500 focus:border-red-500" : inputClass) + " w-40"}
                        />
                        <button
                            type="button"
                            onClick={handlePostalCodeSearch}
                            disabled={isSearchingZip}
                            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                        >
                            {isSearchingZip ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            住所を検索
                        </button>
                    </div>
                    {fieldErrors.postalCode && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.postalCode}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">所在地 <span className="text-slate-400 text-xs font-normal">(任意)</span></label>
                    <input
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="東京都渋谷区..."
                        className={fieldErrors.address ? inputClass + " border-red-400 focus:ring-red-500 focus:border-red-500" : inputClass}
                    />
                    {fieldErrors.address && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.address}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        SNS・ウェブサイト URL <span className="text-slate-400 text-xs font-normal">（任意）</span>
                    </label>
                    <input
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        type="url"
                        placeholder="https://..."
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        自己紹介 / 団体概要 <span className="text-slate-400 text-xs font-normal">（任意）</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="どのようなイベントを主催しているか、簡単な説明を入力してください。"
                        className={inputClass + " resize-none"}
                    />
                </div>
            </div>

            {/* Save actions */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    最終更新: {initialProfile?.updated_at
                        ? new Date(initialProfile.updated_at).toLocaleDateString("ja-JP")
                        : "-"}
                </p>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" type="button" onClick={handleCancel} className="text-slate-600">
                        キャンセル
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                保存中...
                            </>
                        ) : (
                            "変更を保存"
                        )}
                    </Button>
                </div>
            </div>
        </form>
    );
}
