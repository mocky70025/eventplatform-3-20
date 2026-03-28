"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function DocumentCard({ label, imageUrl, required = false }: { label: string, imageUrl?: string, required?: boolean }) {
    const [imageError, setImageError] = useState(false);

    if (!imageUrl) {
        return (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-400">{label}</p>
                    <p className="text-[10px] text-slate-400 mt-1">未提出</p>
                </div>
                {required && <AlertTriangle className="w-4 h-4 text-orange-400" />}
            </div>
        );
    }

    return (
        <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-xl border border-slate-100 hover:border-orange-200 transition-all hover:shadow-md bg-white group block"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{label}</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">画像あり / クリックで確認</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-110 transition-transform">
                    {!imageError ? (
                        <img 
                            src={imageUrl} 
                            alt={label} 
                            className="w-full h-full object-cover"
                            onError={() => {
                                console.error(`Failed to load image for ${label}:`, imageUrl);
                                setImageError(true);
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <AlertTriangle className="w-5 h-5 text-slate-400" />
                        </div>
                    )}
                </div>
            </div>
        </a>
    );
}
