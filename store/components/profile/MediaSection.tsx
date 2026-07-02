"use client";

import { useState } from "react";
import { Loader2, X, ImagePlus, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageCropDialog } from "@/components/ui/ImageCropDialog";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface MediaSectionProps {
    initialProfile: any;
}

export function MediaSection({ initialProfile }: MediaSectionProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const existingPhotos: string[] = initialProfile?.gallery_images || [];
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string>(initialProfile?.cover_image || "");
    const [allowPhotoUsage, setAllowPhotoUsage] = useState<boolean>(initialProfile?.allow_photo_usage ?? true);

    const [cropState, setCropState] = useState<{ src: string; aspect: number; onDone: (f: File) => void } | null>(null);
    const openCrop = (file: File, aspect: number, onDone: (f: File) => void) => {
        setCropState({ src: URL.createObjectURL(file), aspect, onDone });
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const MAX_PHOTOS = 10;

    const validateFile = (file: File): boolean => {
        if (file.size > MAX_FILE_SIZE) {
            setError("ファイルサイズが大きすぎます（最大10MB）");
            return false;
        }
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("対応していないファイル形式です（JPEG, PNG, GIF, WebPのみ）");
            return false;
        }
        return true;
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        e.target.value = "";
        if (!validateFile(file)) return;
        setError("");
        openCrop(file, 16 / 9, (cropped) => {
            setCoverFile(cropped);
            setCoverPreview(URL.createObjectURL(cropped));
        });
    };

    // Crop selected gallery photos one by one (square 1:1), then queue them.
    const cropGalleryQueue = (files: File[]) => {
        if (files.length === 0) return;
        const [first, ...rest] = files;
        openCrop(first, 1, (cropped) => {
            setNewFiles(prev => [...prev, cropped]);
            setNewPreviews(prev => [...prev, URL.createObjectURL(cropped)]);
            cropGalleryQueue(rest);
        });
    };

    const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const selectedFiles = Array.from(e.target.files);
        e.target.value = "";
        const totalCount = existingPhotos.length + newFiles.length + selectedFiles.length;
        if (totalCount > MAX_PHOTOS) {
            setError(`写真は最大${MAX_PHOTOS}枚までです`);
            return;
        }
        const validFiles = selectedFiles.filter((file) => validateFile(file));
        if (validFiles.length === 0) return;
        setError("");
        cropGalleryQueue(validFiles);
    };

    const removeNewPhoto = (index: number) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setNewPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (newFiles.length === 0 && !coverFile && allowPhotoUsage === (initialProfile?.allow_photo_usage ?? true)) return;
        setIsSaving(true);
        setError("");
        setSuccess("");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const updateData: any = { allow_photo_usage: allowPhotoUsage };

            // Upload cover
            if (coverFile) {
                const fileExt = (coverFile.name.split(".").pop() || "").toLowerCase();
                const filePath = `${user.id}/cover_${crypto.randomUUID()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from("exhibitor-documents").upload(filePath, coverFile);
                if (uploadError) throw new Error("カバー写真のアップロードに失敗しました");
                updateData.cover_image = filePath;
            }

            // Upload gallery photos
            if (newFiles.length > 0) {
                const uploadedUrls: string[] = [];
                for (const file of newFiles) {
                    const fileExt = (file.name.split(".").pop() || "").toLowerCase();
                    const filePath = `${user.id}/gallery_${crypto.randomUUID()}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from("exhibitor-documents").upload(filePath, file);
                    if (uploadError) throw new Error("写真のアップロードに失敗しました");
                    uploadedUrls.push(filePath);
                }
                updateData.gallery_images = [...existingPhotos, ...uploadedUrls];
            }

            const { error: updateError } = await supabase
                .from("exhibitors")
                .update(updateData)
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setSuccess("変更を保存しました");
            setNewFiles([]);
            setNewPreviews([]);
            setCoverFile(null);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const totalPhotos = existingPhotos.length + newPreviews.length;
    const hasChanges = newFiles.length > 0 || coverFile !== null || allowPhotoUsage !== (initialProfile?.allow_photo_usage ?? true);

    const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? "bg-store-500" : "bg-slate-200"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );

    return (
        <div className="space-y-6">
            {cropState && (
                <ImageCropDialog
                    imageSrc={cropState.src}
                    aspect={cropState.aspect}
                    accent="#10b981"
                    onCancel={() => { URL.revokeObjectURL(cropState.src); setCropState(null); }}
                    onComplete={(blob) => {
                        const file = new File([blob], `crop_${Date.now()}.jpg`, { type: "image/jpeg" });
                        const cb = cropState.onDone;
                        URL.revokeObjectURL(cropState.src);
                        setCropState(null);
                        cb(file);
                    }}
                />
            )}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            {success && (
                <div className="bg-store-50 border border-store-200 text-store-700 px-4 py-3 rounded-xl text-sm">{success}</div>
            )}

            {/* Cover photo */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-4">カバー写真</h3>

                <div className="relative">
                    {coverPreview ? (
                        <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={coverPreview} alt="カバー写真" className="w-full h-48 object-cover" />
                            <label className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-sm font-medium text-slate-700 hover:bg-white cursor-pointer transition shadow-sm">
                                変更
                                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                            </label>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center h-48 rounded-xl bg-store-50/50 border-2 border-dashed border-store-200 hover:border-store-400 transition cursor-pointer">
                            <ImageIcon className="w-8 h-8 text-store-300 mb-2" />
                            <p className="text-sm text-slate-500">1200 x 400px 推奨</p>
                            <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                        </label>
                    )}
                </div>
            </div>

            {/* Gallery */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-bold text-slate-900">ギャラリー</h3>
                    {totalPhotos < MAX_PHOTOS && (
                        <label className="inline-flex items-center gap-1.5 text-sm font-medium text-store-600 hover:text-store-700 cursor-pointer transition-colors">
                            <ImagePlus className="w-4 h-4" />
                            写真を追加
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleAddPhotos}
                            />
                        </label>
                    )}
                </div>
                <p className="text-sm text-slate-500 mb-5">最大{MAX_PHOTOS}枚までアップロードできます ({totalPhotos}/{MAX_PHOTOS})</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Existing photos */}
                    {existingPhotos.map((url, i) => (
                        <div key={`existing-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                            <img src={url} alt={`写真 ${i + 1}`} className="w-full h-full object-cover" />
                            {i === 0 && (
                                <span className="absolute top-2 left-2 h-5 inline-flex items-center justify-center px-2 rounded bg-store-500 text-white text-xs font-bold" style={{ lineHeight: 1 }}>
                                    メイン
                                </span>
                            )}
                        </div>
                    ))}

                    {/* New previews */}
                    {newPreviews.map((preview, i) => (
                        <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 border-store-300">
                            <img src={preview} alt={`新規写真 ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                                onClick={() => removeNewPhoto(i)}
                                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-500 transition"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            {existingPhotos.length === 0 && i === 0 && (
                                <span className="absolute top-2 left-2 h-5 inline-flex items-center justify-center px-2 rounded bg-store-500 text-white text-xs font-bold" style={{ lineHeight: 1 }}>
                                    メイン
                                </span>
                            )}
                        </div>
                    ))}

                    {/* Add button */}
                    {totalPhotos < MAX_PHOTOS && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-store-400 hover:bg-store-50/30 transition cursor-pointer flex flex-col items-center justify-center gap-1.5">
                            <ImagePlus className="w-6 h-6 text-slate-300" />
                            <span className="text-xs text-slate-500">追加</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleAddPhotos}
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* Photo usage permission */}
            <div className="bg-store-50/50 rounded-2xl border border-store-200 px-5 py-4 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-900">ギャラリーの写真をイベント告知に使用することを許可する</p>
                    <p className="text-xs text-slate-500 mt-0.5">主催者がイベントページやSNSでの告知にあなたの写真を使用できるようになります</p>
                </div>
                <ToggleSwitch checked={allowPhotoUsage} onChange={() => setAllowPhotoUsage(!allowPhotoUsage)} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                    最終更新: {initialProfile?.updated_at
                        ? new Date(initialProfile.updated_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "/") + " " + new Date(initialProfile.updated_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                </p>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        type="button"
                        className="text-slate-600"
                        onClick={() => {
                            setNewFiles([]);
                            setNewPreviews([]);
                            setCoverFile(null);
                            setCoverPreview(initialProfile?.cover_image || "");
                            setAllowPhotoUsage(initialProfile?.allow_photo_usage ?? true);
                            setError("");
                            setSuccess("");
                        }}
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !hasChanges}
                        className="bg-store-500 hover:bg-store-600 text-white rounded-xl px-6"
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
        </div>
    );
}
