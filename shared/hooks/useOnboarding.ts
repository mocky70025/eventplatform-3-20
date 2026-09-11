"use client";

import { useState, useEffect, useRef } from "react";
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

export function useOnboardingDraft<T extends Record<string, string>>(
    draftKey: string,
    initialData: T
) {
    const [formData, setFormData] = useState<T>(initialData);
    const [agreedTerms, setAgreedTerms] = useState(false);
    const [agreedPrivacy, setAgreedPrivacy] = useState(false);

    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(draftKey);
            if (saved) {
                const d = JSON.parse(saved);
                if (d.formData) setFormData((prev: T) => ({ ...prev, ...d.formData }));
                if (typeof d.agreedTerms === "boolean") setAgreedTerms(d.agreedTerms);
                if (typeof d.agreedPrivacy === "boolean") setAgreedPrivacy(d.agreedPrivacy);
            }
        } catch { }
    }, [draftKey]);

    useEffect(() => {
        try {
            sessionStorage.setItem(draftKey, JSON.stringify({ formData, agreedTerms, agreedPrivacy }));
        } catch { }
    }, [formData, agreedTerms, agreedPrivacy, draftKey]);

    return { formData, setFormData, agreedTerms, setAgreedTerms, agreedPrivacy, setAgreedPrivacy };
}

export function useUserSession() {
    const [sessionMissing, setSessionMissing] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const checkUser = async (retry = false) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setSessionMissing(false);
                return user;
            }
            if (!retry) {
                await new Promise((r) => setTimeout(r, 600));
                return checkUser(true);
            }
            setSessionMissing(true);
            return null;
        };
        checkUser();
    }, [supabase]);

    return { sessionMissing, supabase };
}

export function usePostalCodeLookup() {
    const [postalCode, setPostalCode] = useState("");
    const [postalCodeLoading, setPostalCodeLoading] = useState(false);
    const [postalCodeError, setPostalCodeError] = useState("");

    const lookupPostalCode = async () => {
        const code = postalCode.replace(/-/g, "");
        if (code.length !== 7) {
            setPostalCodeError("7桁の郵便番号を入力してください");
            return null;
        }
        setPostalCodeLoading(true);
        setPostalCodeError("");
        try {
            const res = await fetch(`/api/zipcode?zipcode=${code}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const r = data.results[0];
                setPostalCodeLoading(false);
                return r;
            } else {
                setPostalCodeError("住所が見つかりませんでした");
                setPostalCodeLoading(false);
                return null;
            }
        } catch {
            setPostalCodeError("検索に失敗しました");
            setPostalCodeLoading(false);
            return null;
        }
    };

    return { postalCode, setPostalCode, postalCodeLoading, postalCodeError, setPostalCodeError, lookupPostalCode };
}

export function useAvatarUpload(
    bucket: "exhibitor-avatars" | "organizer-avatars",
    table: "exhibitors" | "organizers",
    onSuccess?: (url: string) => void
) {
    const [avatarUrl, setAvatarUrl] = useState("");
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [cropState, setCropState] = useState<{ src: string; aspect: number; onDone: (f: File) => void } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const openCrop = (file: File, aspect: number, onDone: (f: File) => void) => {
        setCropState({ src: URL.createObjectURL(file), aspect, onDone });
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        openCrop(file, 1, (cropped) => uploadAvatar(cropped));
    };

    const uploadAvatar = async (file: File) => {
        setIsUploadingImage(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const filePath = `${user.id}/avatar.jpg`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, { upsert: true, metadata: { user_id: user.id } });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
            const publicUrl = urlData.publicUrl;

            const { error: updateError } = await supabase
                .from(table)
                .update({ avatar_url: publicUrl })
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
            onSuccess?.(publicUrl);
        } catch (err: any) {
            console.error("Avatar upload error:", err);
        } finally {
            setIsUploadingImage(false);
            setCropState(null);
        }
    };

    return {
        avatarUrl,
        setAvatarUrl,
        isUploadingImage,
        cropState,
        setCropState,
        fileInputRef,
        openCrop,
        handleImageClick,
        handleFileSelect,
    };
}

export function useFormValidation<T extends Record<string, string>>(
    formData: T,
    requiredFields: (keyof T)[],
    customValidators?: Record<keyof T, (value: string) => string | null>
) {
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showErrors, setShowErrors] = useState(false);

    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isValidPhone = (phone: string) => /^[\d\-+() ]{10,15}$/.test(phone.replace(/\s/g, ''));

    const validateField = (name: keyof T, value: string): string | null => {
        if (name === "email" && value && !isValidEmail(value)) return "有効なメールアドレスを入力してください";
        if (name === "phone" && value && !isValidPhone(value)) return "有効な電話番号を入力してください（半角数字・ハイフン、10〜15桁）";
        return null;
    };

    const validateAll = (data: T): Record<string, string> => {
        const errors: Record<string, string> = {};
        for (const field of requiredFields) {
            const err = validateField(field, data[field]);
            if (err) errors[field as string] = err;
        }
        return errors;
    };

    const validateOnBlur = (name: keyof T, value: string) => {
        const err = validateField(name, value);
        if (err) setFieldErrors(prev => ({ ...prev, [name]: err }));
        else setFieldErrors(prev => { const next = { ...prev }; delete next[name]; return next; });
    };

    const checkMissingRequired = (data: T) => requiredFields.some(f => !data[f]);

    return { fieldErrors, setFieldErrors, showErrors, setShowErrors, validateField, validateAll, validateOnBlur, checkMissingRequired };
}

export { PREFECTURES };
export { createClient } from "@/lib/supabase/client";