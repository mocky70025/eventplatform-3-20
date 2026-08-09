"use client";

import type { ReactNode } from "react";
import { FileText, Loader2 } from "lucide-react";
import { DOC_ACCEPT } from "@/lib/exhibitorDocuments";

/** "error" renders like "idle" — the AI reader failing shouldn't block the upload. */
export type DocumentAiStatus = "idle" | "verifying" | "success" | "error";

interface DocumentUploadFieldProps {
    label: string;
    /** Renders a 「（任意）」 marker next to the label when false. */
    required?: boolean;
    desc?: string;

    /** Name shown above the preview — a File name, or the basename of a stored path. */
    fileName?: string | null;
    /** Force the filled card even with no preview (e.g. a stored doc whose URL failed to sign). */
    filled?: boolean;
    /** Data URL for a freshly picked file, or a signed URL for a stored one. */
    previewUrl?: string | null;
    /** PDFs can't render in an <img>; show a tile of the same height instead. */
    isPdf?: boolean;
    previewLoading?: boolean;
    uploading?: boolean;

    onSelect: (file: File) => void;
    /** Omit to hide the round × button (e.g. when 「更新」 replaces removal). */
    onRemove?: () => void;
    /** Extra controls placed left of the × button, e.g. 表示 / 更新. */
    actions?: ReactNode;
    /** Extra pill placed right of the file name, e.g. 確認済み / 期限間近. */
    statusBadge?: ReactNode;
    expiryText?: string | null;
    expiryTone?: "normal" | "warning";

    /** Only documents wired to the AI reader pass this. */
    aiStatus?: DocumentAiStatus;

    /** "compact" only shortens the empty drop zone; the filled card is identical. */
    size?: "default" | "compact";
    error?: string | null;
    accept?: string;
    disabled?: boolean;
}

export function DocumentUploadField({
    label,
    required = false,
    desc,
    fileName,
    filled = false,
    previewUrl,
    isPdf = false,
    previewLoading = false,
    uploading = false,
    onSelect,
    onRemove,
    actions,
    statusBadge,
    expiryText,
    expiryTone = "normal",
    aiStatus = "idle",
    size = "default",
    error,
    accept = DOC_ACCEPT,
    disabled = false,
}: DocumentUploadFieldProps) {
    const compact = size === "compact";
    const hasContent = filled || !!previewUrl || previewLoading || !!fileName;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Reset so picking the same file again after removing still fires onChange.
        e.target.value = "";
        if (file) onSelect(file);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-slate-500" />
                    {label}
                    {!required && <span className="text-xs font-normal text-slate-500">（任意）</span>}
                </span>
            </label>
            {desc && <p className="text-xs text-slate-500 -mt-1 mb-1.5">{desc}</p>}

            {hasContent ? (
                <div className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <p className="text-xs text-slate-500 truncate max-w-[200px]">{fileName}</p>
                            {aiStatus === "success" && (
                                <span className="text-xs bg-store-50 text-store-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    AI確認済み
                                </span>
                            )}
                            {aiStatus === "verifying" && (
                                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    確認中...
                                </span>
                            )}
                            {statusBadge}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {uploading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                            {actions}
                            {onRemove && (
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    disabled={disabled}
                                    aria-label={`${label}を削除`}
                                    className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 transition flex-shrink-0"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                        {previewLoading ? (
                            <div className="w-full h-36 bg-slate-100 animate-pulse" />
                        ) : isPdf || !previewUrl ? (
                            <div className="w-full h-36 flex flex-col items-center justify-center gap-1.5 text-slate-400">
                                <FileText className="w-8 h-8" />
                                <span className="text-xs">{isPdf ? "PDFファイル" : "プレビューを表示できません"}</span>
                            </div>
                        ) : (
                            <img src={previewUrl} alt={label} className="w-full h-36 object-contain" />
                        )}
                    </div>
                    {expiryText && (
                        <p className={`text-xs mt-2 ${expiryTone === "warning" ? "text-amber-600 font-medium" : "text-slate-500"}`}>
                            {expiryText}
                        </p>
                    )}
                </div>
            ) : (
                <label
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 hover:border-store-400 hover:bg-store-50/30 transition cursor-pointer ${
                        compact ? "h-16" : "h-28"
                    } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
                >
                    {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : (
                        <>
                            <svg
                                className={`text-slate-300 ${compact ? "w-5 h-5 mb-0.5" : "w-7 h-7 mb-1.5"}`}
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
                            {!compact && <p className="text-xs text-slate-500 mt-0.5">PNG, JPG, PDF（最大10MB）</p>}
                        </>
                    )}
                    <input type="file" accept={accept} className="hidden" disabled={disabled} onChange={handleChange} />
                </label>
            )}

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
}
