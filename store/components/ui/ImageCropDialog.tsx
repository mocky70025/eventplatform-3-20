"use client";

import { useCallback, useState, type ComponentType } from "react";
import CropperRaw, { Area } from "react-easy-crop";
import { Minus, Plus, Loader2 } from "lucide-react";
import { getCroppedImg } from "@/lib/cropImage";

// react-easy-crop ships class-component types incompatible with React 19's JSX types
const Cropper = CropperRaw as unknown as ComponentType<any>;

interface ImageCropDialogProps {
    imageSrc: string;
    aspect: number;
    cropShape?: "rect" | "round";
    accent?: string;
    title?: string;
    maxWidth?: number;
    onCancel: () => void;
    onComplete: (blob: Blob) => void | Promise<void>;
}

export function ImageCropDialog({
    imageSrc,
    aspect,
    cropShape = "rect",
    accent = "#10b981",
    title = "画像を調整",
    maxWidth = 1600,
    onCancel,
    onComplete,
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [areaPixels, setAreaPixels] = useState<Area | null>(null);
    const [saving, setSaving] = useState(false);

    const onCropComplete = useCallback((_: Area, pixels: Area) => setAreaPixels(pixels), []);

    const handleApply = async () => {
        if (!areaPixels) return;
        setSaving(true);
        try {
            const blob = await getCroppedImg(imageSrc, areaPixels, maxWidth);
            await onComplete(blob);
        } finally {
            setSaving(false);
        }
    };

    const fillPct = ((zoom - 1) / 2) * 100;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-2xl p-7">
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="text-[13px] text-slate-500 mt-1">ドラッグで位置を調整、スライダーで拡大できます</p>

                <div
                    className="relative w-full mt-5 rounded-xl overflow-hidden bg-slate-900"
                    style={{ aspectRatio: String(aspect) }}
                >
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        cropShape={cropShape}
                        showGrid={cropShape === "rect"}
                        restrictPosition
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="flex items-center gap-3 mt-5">
                    <Minus className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        aria-label="ズーム"
                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, ${accent} ${fillPct}%, #e2e8f0 ${fillPct}%)`,
                            accentColor: accent,
                        }}
                    />
                    <Plus className="w-4 h-4 text-slate-400 shrink-0" />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={saving}
                        className="px-5 h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={saving || !areaPixels}
                        className="px-6 h-11 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 flex items-center gap-2"
                        style={{ backgroundColor: accent }}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                処理中...
                            </>
                        ) : (
                            "適用する"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
