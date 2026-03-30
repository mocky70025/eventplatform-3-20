"use client";

import { useState, useRef } from "react";
import { Loader2, Check, AlertTriangle, Plus, Info, Eye, RefreshCw, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const documentTypes = [
    { key: "businessLicense", dbKey: "business_license_image_url", expiryDbKey: "business_license_expiry", label: "食品衛生責任者証", required: true },
    { key: "businessPermit", dbKey: "business_permit_image_url", expiryDbKey: "business_permit_expiry", label: "営業許可証", required: true },
    { key: "plInsurance", dbKey: "pl_insurance_image_url", expiryDbKey: "pl_insurance_expiry", label: "PL保険証書", required: false },
    { key: "vehicleInspection", dbKey: "vehicle_inspection_image_url", expiryDbKey: "vehicle_inspection_expiry", label: "自動車検査証", required: false, desc: "キッチンカーの車検証をアップロードしてください" },
    { key: "fireManager", dbKey: "fire_equipment_layout_image_url", expiryDbKey: "fire_manager_expiry", label: "防火管理者証", required: false, desc: "火気を使用する場合に必要です" },
];

interface DocumentsSectionProps {
    initialProfile: any;
}

function getDocStatus(profile: any, doc: typeof documentTypes[0]): { status: "verified" | "expiring" | "none"; expiryDate?: string; daysLeft?: number } {
    const url = profile?.[doc.dbKey];
    if (!url) return { status: "none" };

    const expiry = profile?.[doc.expiryDbKey];
    if (expiry) {
        const expiryDate = new Date(expiry);
        const now = new Date();
        const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 60) {
            return { status: "expiring", expiryDate: expiry, daysLeft: diffDays };
        }
        return { status: "verified", expiryDate: expiry };
    }
    return { status: "verified" };
}

export function DocumentsSection({ initialProfile }: DocumentsSectionProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isUploading, setIsUploading] = useState<string | null>(null);
    const [isViewing, setIsViewing] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    const handleView = async (docKey: string, dbKey: string) => {
        const path = initialProfile?.[dbKey];
        if (!path) return;

        setIsViewing(docKey);
        setError("");

        try {
            let url: string;
            if (path.startsWith("http://") || path.startsWith("https://")) {
                url = path;
            } else {
                const { data, error: signError } = await supabase.storage
                    .from("exhibitor-documents")
                    .createSignedUrl(path, 3600);
                if (signError) throw signError;
                url = data.signedUrl;
            }
            window.open(url, "_blank", "noopener,noreferrer");
        } catch (err: any) {
            setError("書類の表示に失敗しました");
        } finally {
            setIsViewing(null);
        }
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];

    const handleUpload = async (file: File, docKey: string, dbKey: string) => {
        if (file.size > MAX_FILE_SIZE) {
            setError("ファイルサイズが大きすぎます（最大10MB）");
            return;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("対応していないファイル形式です（JPEG, PNG, GIF, WebP, PDFのみ）");
            return;
        }

        setIsUploading(docKey);
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const fileExt = (file.name.split(".").pop() || "").toLowerCase();
            const filePath = `${user.id}/${docKey}_${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("exhibitor-documents")
                .upload(filePath, file);
            if (uploadError) throw new Error("アップロードに失敗しました");

            const { error: updateError } = await supabase
                .from("exhibitors")
                .update({ [dbKey]: filePath })
                .eq("user_id", user.id);
            if (updateError) throw updateError;

            setSuccess("書類をアップロードしました");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "アップロードに失敗しました");
        } finally {
            setIsUploading(null);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docKey: string, dbKey: string) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0], docKey, dbKey);
            e.target.value = "";
        }
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            {success && (
                <div className="bg-store-50 border border-store-200 text-store-700 px-4 py-3 rounded-xl text-sm">{success}</div>
            )}

            {/* Info banner */}
            <div className="bg-store-50 border border-store-200 rounded-2xl px-5 py-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-store-600 mt-0.5 shrink-0" />
                <div>
                    <p className="text-sm font-medium text-store-800">書類はイベント申込時に主催者へ提示されます</p>
                    <p className="text-xs text-store-600 mt-0.5">有効期限が切れた書類は自動で通知されます。常に最新の状態に保ってください。</p>
                </div>
            </div>

            {/* Documents list */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-base font-bold text-slate-900">登録書類</h3>
                    <label className="inline-flex items-center gap-1.5 text-sm font-medium text-store-600 hover:text-store-700 cursor-pointer transition-colors">
                        <Plus className="w-4 h-4" />
                        書類を追加
                        <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                            // Default to first unregistered doc
                            const unregistered = documentTypes.find(d => !initialProfile?.[d.dbKey]);
                            if (unregistered && e.target.files?.[0]) {
                                handleUpload(e.target.files[0], unregistered.key, unregistered.dbKey);
                            }
                            e.target.value = "";
                        }} />
                    </label>
                </div>

                <div className="divide-y divide-slate-100">
                    {documentTypes.map(doc => {
                        const { status, expiryDate, daysLeft } = getDocStatus(initialProfile, doc);
                        const isLoading = isUploading === doc.key;

                        return (
                            <div
                                key={doc.key}
                                className={`flex items-center justify-between py-4 first:pt-0 last:pb-0 ${
                                    status === "expiring" ? "bg-amber-50/50 -mx-3 px-3 rounded-lg" : ""
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        status === "verified" ? "bg-store-50" :
                                        status === "expiring" ? "bg-amber-50" :
                                        "bg-slate-50"
                                    }`}>
                                        {status === "verified" && <Check className="w-5 h-5 text-store-500" />}
                                        {status === "expiring" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                                        {status === "none" && <Plus className="w-5 h-5 text-slate-300" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-sm font-medium ${
                                                status === "expiring" ? "text-amber-700" : "text-slate-900"
                                            }`}>{doc.label}</p>
                                            {status === "verified" && (
                                                <span className="h-5 inline-flex items-center justify-center px-2 rounded-full bg-store-50 text-store-700 text-[11px] font-medium" style={{ lineHeight: 1 }}>
                                                    確認済み
                                                </span>
                                            )}
                                            {status === "expiring" && (
                                                <span className="h-5 inline-flex items-center justify-center px-2 rounded-full bg-amber-100 text-amber-700 text-[11px] font-medium" style={{ lineHeight: 1 }}>
                                                    期限間近
                                                </span>
                                            )}
                                            {status === "none" && !doc.required && (
                                                <span className="text-xs text-slate-400">（任意）</span>
                                            )}
                                        </div>
                                        {status !== "none" && expiryDate && (
                                            <p className={`text-xs mt-0.5 ${
                                                status === "expiring"
                                                    ? "text-amber-600 font-medium"
                                                    : "text-slate-500"
                                            }`}>
                                                有効期限: {formatDate(expiryDate)}
                                                {status === "expiring" && daysLeft !== undefined && ` (残り${daysLeft}日)`}
                                            </p>
                                        )}
                                        {status === "none" && doc.desc && (
                                            <p className="text-xs text-slate-500 mt-0.5">{doc.desc}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={el => { fileInputRefs.current[doc.key] = el; }}
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => handleFileSelect(e, doc.key, doc.dbKey)}
                                    />
                                    {isLoading ? (
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            アップロード中...
                                        </div>
                                    ) : status !== "none" ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                onClick={() => handleView(doc.key, doc.dbKey)}
                                                disabled={isViewing === doc.key}
                                                className="text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 h-auto"
                                            >
                                                {isViewing === doc.key ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    "表示"
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                type="button"
                                                onClick={() => fileInputRefs.current[doc.key]?.click()}
                                                className={`text-sm rounded-lg px-3 py-1.5 h-auto ${
                                                    status === "expiring"
                                                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                                }`}
                                            >
                                                更新
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => fileInputRefs.current[doc.key]?.click()}
                                            className="text-sm text-store-600 border border-store-200 hover:bg-store-50 rounded-lg px-3 py-1.5 h-auto"
                                        >
                                            アップロード
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
