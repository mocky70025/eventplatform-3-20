"use client";

import { useState, useEffect } from "react";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DocumentUploadField } from "@/components/ui/DocumentUploadField";
import {
    EXHIBITOR_DOCUMENTS,
    validateDocumentFile,
    isPdfLike,
    type ExhibitorDocDef,
} from "@/lib/exhibitorDocuments";
import { createClient } from "@/lib/supabase/client";
import { signExhibitorDocumentUrl, signExhibitorDocumentUrls } from "@/lib/supabase/documents";
import { useRouter } from "next/navigation";

interface DocumentsSectionProps {
    initialProfile: any;
}

function getDocStatus(profile: any, doc: ExhibitorDocDef): { status: "verified" | "expiring" | "none"; expiryDate?: string; daysLeft?: number } {
    const url = profile?.[doc.urlCol];
    if (!url) return { status: "none" };

    const expiry = doc.expiryCol ? profile?.[doc.expiryCol] : null;
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
    const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
    const [previewsLoading, setPreviewsLoading] = useState(true);

    // Stored documents live in a private bucket, so thumbnails need signed URLs.
    // Sign every registered document in one request rather than one per card.
    useEffect(() => {
        let cancelled = false;
        const registered = EXHIBITOR_DOCUMENTS.filter((d) => initialProfile?.[d.urlCol]);
        if (registered.length === 0) {
            setPreviewsLoading(false);
            return;
        }
        (async () => {
            const urls = await signExhibitorDocumentUrls(
                supabase,
                registered.map((d) => initialProfile[d.urlCol])
            );
            if (cancelled) return;
            const next: Record<string, string> = {};
            registered.forEach((d, i) => {
                const u = urls[i];
                if (u) next[d.key] = u;
            });
            setPreviewUrls(next);
            setPreviewsLoading(false);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialProfile]);

    const handleView = async (docKey: string, urlCol: string) => {
        const path = initialProfile?.[urlCol];
        if (!path) return;

        setIsViewing(docKey);
        setError("");

        try {
            const url = await signExhibitorDocumentUrl(supabase, path);
            if (!url) throw new Error("signing failed");
            window.open(url, "_blank", "noopener,noreferrer");
        } catch {
            setError("書類の表示に失敗しました");
        } finally {
            setIsViewing(null);
        }
    };

    const handleUpload = async (file: File, doc: ExhibitorDocDef) => {
        const validationError = validateDocumentFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsUploading(doc.key);
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const fileExt = (file.name.split(".").pop() || "").toLowerCase();
            const filePath = `${user.id}/${doc.key}_${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("exhibitor-documents")
                .upload(filePath, file);
            if (uploadError) throw new Error("アップロードに失敗しました");

            const { error: updateError } = await supabase
                .from("exhibitors")
                .update({ [doc.urlCol]: filePath })
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
                <div className="mb-5">
                    <h3 className="text-base font-bold text-slate-900">登録書類</h3>
                </div>

                <div className="space-y-5">
                    {EXHIBITOR_DOCUMENTS.map((doc) => {
                        const { status, expiryDate, daysLeft } = getDocStatus(initialProfile, doc);
                        const registered = status !== "none";
                        const storedPath: string | undefined = initialProfile?.[doc.urlCol];

                        return (
                            <DocumentUploadField
                                key={doc.key}
                                label={doc.label}
                                required={doc.required}
                                desc={!registered ? doc.desc : undefined}
                                size={doc.required ? "default" : "compact"}
                                filled={registered}
                                previewUrl={previewUrls[doc.key] || null}
                                previewLoading={registered && previewsLoading}
                                isPdf={isPdfLike(storedPath)}
                                uploading={isUploading === doc.key}
                                onSelect={(file) => handleUpload(file, doc)}
                                statusBadge={
                                    status === "verified" ? (
                                        <span className="h-5 inline-flex items-center justify-center px-2 rounded-full bg-store-50 text-store-700 text-xs font-medium" style={{ lineHeight: 1 }}>
                                            確認済み
                                        </span>
                                    ) : status === "expiring" ? (
                                        <span className="h-5 inline-flex items-center justify-center px-2 rounded-full bg-amber-100 text-amber-700 text-xs font-medium" style={{ lineHeight: 1 }}>
                                            期限間近
                                        </span>
                                    ) : null
                                }
                                expiryText={
                                    registered && expiryDate
                                        ? `有効期限: ${formatDate(expiryDate)}${status === "expiring" && daysLeft !== undefined ? ` (残り${daysLeft}日)` : ""}`
                                        : null
                                }
                                expiryTone={status === "expiring" ? "warning" : "normal"}
                                actions={
                                    registered ? (
                                        <>
                                            <Button
                                                variant="ghost"
                                                type="button"
                                                onClick={() => handleView(doc.key, doc.urlCol)}
                                                disabled={isViewing === doc.key}
                                                className="text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-1.5 h-auto"
                                            >
                                                {isViewing === doc.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "表示"}
                                            </Button>
                                            <label
                                                className={`cursor-pointer text-sm rounded-lg px-3 py-1.5 border inline-flex items-center ${
                                                    status === "expiring"
                                                        ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                                }`}
                                            >
                                                更新
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const f = e.target.files?.[0];
                                                        e.target.value = "";
                                                        if (f) handleUpload(f, doc);
                                                    }}
                                                />
                                            </label>
                                        </>
                                    ) : null
                                }
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
