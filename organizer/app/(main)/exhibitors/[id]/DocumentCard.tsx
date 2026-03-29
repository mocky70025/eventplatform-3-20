"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";

export default function DocumentCard({ label, imageUrl, required = false }: { 
    label: string, 
    imageUrl?: string | null, 
    required?: boolean 
}) {
    const [imageError, setImageError] = useState(false);

    if (!imageUrl || imageError) {
        return (
            <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-500 text-center">
                    {label}
                </p>
                <p className="text-xs text-slate-400 mt-1">画像がありません</p>
            </div>
        );
    }

    return (
        <div className="aspect-video bg-slate-50 rounded-xl border border-slate-200 overflow-hidden relative group">
            <Image
                src={imageUrl}
                alt={label}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
                onError={() => {
                    setImageError(true);
                }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-xs font-medium text-white">
                    {label}
                </p>
            </div>
        </div>
    );
}
