"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ImageCropDialog } from "@/components/ui/ImageCropDialog";
import { Loader2, Check, X, AlertCircle, Sparkles, Camera, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const GENRE_OPTIONS = ["和食", "中華", "洋食", "スイーツ", "カフェ・ドリンク", "エスニック"];
const STYLE_OPTIONS = ["キッチンカー", "テント出店", "屋台"];
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
        storeName: initialProfile?.shop_name || "",
        repName: initialProfile?.name || "",
        email: initialProfile?.email || "",
        phone: initialProfile?.phone_number || "",
        postalCode: "",
        prefecture: initialProfile?.prefecture || "",
        cityAddress: initialProfile?.city_address || "",
        building: initialProfile?.building || "",
        description: initialProfile?.description || "",
        genres: (initialProfile?.genres as string[]) || [],
        styles: (initialProfile?.business_styles as string[]) || [],
    };

    const [formData, setFormData] = useState(initialFormData);
    const [showErrors, setShowErrors] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isSearchingZip, setIsSearchingZip] = useState(false);

    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        businessLicense: null,
        vehicleInspection: null,
        plInsurance: null,
        fireLayout: null,
    });

    const [previews, setPreviews] = useState<{ [key: string]: string }>({
        businessLicense: initialProfile?.business_license_image_url || "",
        vehicleInspection: initialProfile?.vehicle_inspection_image_url || "",
        plInsurance: initialProfile?.pl_insurance_image_url || "",
        fireLayout: initialProfile?.fire_equipment_layout_image_url || "",
    });

    const [aiResults, setAiResults] = useState<{ [key: string]: { status: 'idle' | 'verifying' | 'success' | 'error', message?: string, data?: any } }>({
        businessLicense: { status: 'idle' },
        vehicleInspection: { status: 'idle' },
        plInsurance: { status: 'idle' },
        fireLayout: { status: 'idle' },
    });

    const validateField = (name: string, value: string): string | null => {
        switch (name) {
            case "storeName":
                if (!value.trim()) return "店舗名を入力してください";
                if (value.length > 200) return "店舗名は200文字以内で入力してください";
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
            case "prefecture":
                if (!value) return "都道府県を選択してください";
                return null;
            case "cityAddress":
                if (!value.trim()) return "市区町村・番地を入力してください";
                if (value.length > 200) return "市区町村・番地は200文字以内で入力してください";
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
                // address1 = prefecture, address2 = city, address3 = town
                const prefecture = result.address1;
                const cityAddress = `${result.address2}${result.address3}`;
                setFormData(prev => ({ ...prev, prefecture, cityAddress }));
                setFieldErrors(prev => {
                    const next = { ...prev };
                    delete next.postalCode;
                    delete next.prefecture;
                    delete next.cityAddress;
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

    const toggleChip = (type: "genres" | "styles", value: string) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].includes(value)
                ? prev[type].filter((v: string) => v !== value)
                : [...prev[type], value],
        }));
        setSuccess("");
    };

    const handleCancel = () => {
        setFormData(initialFormData);
        setError("");
        setSuccess("");
    };

    const [cropState, setCropState] = useState<{ src: string; aspect: number; shape: "rect" | "round"; onDone: (f: File) => void } | null>(null);
    const openCrop = (file: File, aspect: number, shape: "rect" | "round", onDone: (f: File) => void) => {
        setCropState({ src: URL.createObjectURL(file), aspect, shape, onDone });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("画像ファイルを選択してください");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("画像は10MB以内にしてください");
            return;
        }
        setError("");
        openCrop(file, 1, "round", (cropped) => uploadAvatar(cropped));
    };

    const uploadAvatar = async (file: File) => {
        setIsUploadingImage(true);
        setError("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const filePath = `${user.id}/avatar.jpg`;

            const { error: uploadError } = await supabase.storage
                .from("exhibitor-avatars")
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("exhibitor-avatars")
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            const { error: updateError } = await supabase
                .from("exhibitors")
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
        }
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement> | null, key: string) => {
        if (e && e.target.files && e.target.files[0]) {
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
            setFiles(prev => ({ ...prev, [key]: file }));

            const reader = new FileReader();
            reader.onloadend = async () => {
                const result = reader.result as string;
                setPreviews(prev => ({ ...prev, [key]: result }));

                setAiResults(prev => ({ ...prev, [key]: { status: 'verifying' } }));
                try {
                    const response = await fetch('/api/verify-document', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: result, type: key })
                    });
                    const data = await response.json();
                    if (data.success) {
                        setAiResults(prev => ({ ...prev, [key]: { status: 'success', message: data.message, data: data.extractedData } }));
                    } else {
                        setAiResults(prev => ({ ...prev, [key]: { status: 'error', message: data.message } }));
                    }
                } catch (err) {
                    setAiResults(prev => ({ ...prev, [key]: { status: 'error', message: 'AIチェックに失敗しました' } }));
                }
            };
            reader.readAsDataURL(file);
        } else if (e === null) {
            setFiles(prev => ({ ...prev, [key]: null }));
            setPreviews(prev => ({ ...prev, [key]: "" }));
            setAiResults(prev => ({ ...prev, [key]: { status: 'idle' } }));
        }
    };

    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'];

    const uploadFiles = async (userId: string) => {
        const updatedUrls: { [key: string]: string } = {};

        for (const [key, file] of Object.entries(files)) {
            if (file) {
                const fileExt = (file.name.split('.').pop() || '').toLowerCase();
                if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
                    throw new Error(`${key}: 対応していないファイル形式です（${ALLOWED_EXTENSIONS.join(', ')}のみ）`);
                }
                const fileName = `${userId}/${key}_${crypto.randomUUID()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('exhibitor-documents')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // Store file path (not public URL) for use with signed URLs
                updatedUrls[key] = fileName;
            }
        }
        return updatedUrls;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.storeName || !formData.repName || !formData.phone || !formData.prefecture || !formData.cityAddress) {
            setShowErrors(true);
            return;
        }

        // Run field validations
        const errors: Record<string, string> = {};
        for (const name of ["storeName", "repName", "phone", "prefecture", "cityAddress"] as const) {
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

            const uploadedUrls = await uploadFiles(user.id);

            // Validate input lengths
            if (formData.storeName.length > 200) throw new Error("店舗名は200文字以内で入力してください");
            if (formData.repName.length > 100) throw new Error("代表者名は100文字以内で入力してください");
            if (formData.phone.length > 20) throw new Error("電話番号の形式が正しくありません");
            if (formData.description.length > 100) throw new Error("店舗紹介は100文字以内で入力してください");

            const updateData: any = {
                shop_name: formData.storeName,
                name: formData.repName,
                email: formData.email,
                phone_number: formData.phone,
                prefecture: formData.prefecture,
                city_address: formData.cityAddress,
                building: formData.building || null,
                address: `${formData.prefecture}${formData.cityAddress}${formData.building || ""}`,
                description: formData.description,
                genres: formData.genres,
                business_styles: formData.styles,
            };

            if (uploadedUrls.businessLicense) updateData.business_license_image_url = uploadedUrls.businessLicense;
            if (uploadedUrls.vehicleInspection) updateData.vehicle_inspection_image_url = uploadedUrls.vehicleInspection;
            if (uploadedUrls.plInsurance) updateData.pl_insurance_image_url = uploadedUrls.plInsurance;
            if (uploadedUrls.fireLayout) updateData.fire_equipment_layout_image_url = uploadedUrls.fireLayout;

            const { error: updateError } = await supabase
                .from("exhibitors")
                .update(updateData)
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setSuccess("プロフィールと書類を更新しました");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "更新に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const initials = formData.storeName
        ? formData.storeName.substring(0, 2)
        : "店";

    const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500";

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {cropState && (
                <ImageCropDialog
                    imageSrc={cropState.src}
                    aspect={cropState.aspect}
                    cropShape={cropState.shape}
                    accent="#10b981"
                    title="プロフィール画像を調整"
                    maxWidth={600}
                    onCancel={() => { URL.revokeObjectURL(cropState.src); setCropState(null); }}
                    onComplete={(blob) => {
                        const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: "image/jpeg" });
                        const cb = cropState.onDone;
                        URL.revokeObjectURL(cropState.src);
                        setCropState(null);
                        cb(file);
                    }}
                />
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-store-50 border border-store-200 text-store-700 px-4 py-3 rounded-xl text-sm">
                    {success}
                </div>
            )}

            {/* Hidden file input for avatar */}
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
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-store-100 flex items-center justify-center text-store-700 text-xl font-bold">
                                {initials}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleImageClick}
                            disabled={isUploadingImage}
                            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                            {isUploadingImage ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <Camera className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-slate-900 truncate">
                            {formData.storeName || "店舗名未設定"}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            @{formData.email ? formData.email.split("@")[0] : "handle"}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="h-5 inline-flex items-center justify-center px-2 rounded-full bg-store-100 text-store-700 text-xs font-medium" style={{ lineHeight: 1 }}>
                                認証済み
                            </span>
                            <span className="h-5 inline-flex items-center justify-center px-2 rounded-full bg-slate-100 text-slate-600 text-xs font-medium" style={{ lineHeight: 1 }}>
                                出店回数 {initialProfile?.event_count ?? 0}
                            </span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleImageClick}
                        disabled={isUploadingImage}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                        {isUploadingImage ? "アップロード中..." : "画像を変更"}
                    </button>
                </div>
            </div>

            {/* Basic info form card */}
            <div id="basic" className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <h3 className="text-base font-bold text-slate-900">基本情報</h3>

                {/* Store name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        店舗名                    </label>
                    <input
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="やきとり太郎"
                        className={cn(inputClass, (fieldErrors.storeName || (showErrors && !formData.storeName)) && "border-red-400 focus:ring-red-500 focus:border-red-500")}
                    />
                    {(fieldErrors.storeName || (showErrors && !formData.storeName)) && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.storeName || "店舗名を入力してください"}</p>
                    )}
                </div>

                {/* Rep name + Phone in 2-col */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            代表者名                        </label>
                        <input
                            name="repName"
                            value={formData.repName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="山田 太郎"
                            className={cn(inputClass, (fieldErrors.repName || (showErrors && !formData.repName)) && "border-red-400 focus:ring-red-500 focus:border-red-500")}
                        />
                        {(fieldErrors.repName || (showErrors && !formData.repName)) && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.repName || "代表者名を入力してください"}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            電話番号                        </label>
                        <input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            type="tel"
                            placeholder="090-1234-5678"
                            className={cn(inputClass, (fieldErrors.phone || (showErrors && !formData.phone)) && "border-red-400 focus:ring-red-500 focus:border-red-500")}
                        />
                        {(fieldErrors.phone || (showErrors && !formData.phone)) && (
                            <p className="text-xs text-red-500 mt-1">{fieldErrors.phone || "電話番号を入力してください"}</p>
                        )}
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        メールアドレス
                    </label>
                    <input
                        name="email"
                        value={formData.email}
                        type="email"
                        readOnly
                        className={inputClass + " bg-slate-50 text-slate-500 cursor-not-allowed"}
                    />
                    <p className="text-xs text-slate-400 mt-1">メールアドレスの変更はアカウント設定から行ってください</p>
                </div>

                {/* Address section */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        郵便番号
                    </label>
                    <div className="flex gap-2">
                        <input
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="100-0001"
                            maxLength={8}
                            className={cn(inputClass, "w-40", fieldErrors.postalCode && "border-red-400 focus:ring-red-500 focus:border-red-500")}
                        />
                        <button
                            type="button"
                            onClick={handlePostalCodeSearch}
                            disabled={isSearchingZip}
                            className="px-4 py-2.5 rounded-xl bg-store-500 text-white text-sm font-medium hover:bg-store-600 transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
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
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        都道府県
                    </label>
                    <select
                        name="prefecture"
                        value={formData.prefecture}
                        onChange={(e) => {
                            setFormData(prev => ({ ...prev, prefecture: e.target.value }));
                            setSuccess("");
                            if (fieldErrors.prefecture) {
                                setFieldErrors(prev => { const next = { ...prev }; delete next.prefecture; return next; });
                            }
                        }}
                        className={cn(inputClass, "appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M2%204l4%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-8", (fieldErrors.prefecture || (showErrors && !formData.prefecture)) && "border-red-400 focus:ring-red-500 focus:border-red-500")}
                    >
                        <option value="">選択してください</option>
                        {PREFECTURES.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    {(fieldErrors.prefecture || (showErrors && !formData.prefecture)) && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.prefecture || "都道府県を選択してください"}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        市区町村・番地
                    </label>
                    <input
                        name="cityAddress"
                        value={formData.cityAddress}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="渋谷区神南1-2-3"
                        className={cn(inputClass, (fieldErrors.cityAddress || (showErrors && !formData.cityAddress)) && "border-red-400 focus:ring-red-500 focus:border-red-500")}
                    />
                    {(fieldErrors.cityAddress || (showErrors && !formData.cityAddress)) && (
                        <p className="text-xs text-red-500 mt-1">{fieldErrors.cityAddress || "市区町村・番地を入力してください"}</p>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        建物名・部屋番号 <span className="text-slate-400 text-xs font-normal">(任意)</span>
                    </label>
                    <input
                        name="building"
                        value={formData.building}
                        onChange={handleChange}
                        placeholder="ワッカビル 301号室"
                        className={inputClass}
                    />
                </div>

                {/* Genre multi-select chips */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ジャンル <span className="text-slate-400 text-xs font-normal">（複数選択可）</span></label>
                    <div className="flex flex-wrap gap-2">
                        {GENRE_OPTIONS.map(genre => (
                            <button
                                key={genre}
                                type="button"
                                onClick={() => toggleChip("genres", genre)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                    formData.genres.includes(genre)
                                        ? "bg-store-500 text-white border-store-500"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Business style multi-select chips */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">営業形態 <span className="text-slate-400 text-xs font-normal">（任意・複数選択可）</span></label>
                    <div className="flex flex-wrap gap-2">
                        {STYLE_OPTIONS.map(style => (
                            <button
                                key={style}
                                type="button"
                                onClick={() => toggleChip("styles", style)}
                                className={cn(
                                    "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                                    formData.styles.includes(style)
                                        ? "bg-store-500 text-white border-store-500"
                                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                                )}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description textarea (optional) */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        店舗紹介 <span className="text-slate-400 text-xs font-normal">（任意）</span>
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={2}
                        maxLength={100}
                        placeholder="お店の特徴やこだわりをアピールしましょう"
                        className={cn(inputClass, "resize-none")}
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">{formData.description.length}/100</p>
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
                        className="bg-store-500 hover:bg-store-600 text-white rounded-xl px-6 disabled:opacity-50 disabled:pointer-events-none"
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
