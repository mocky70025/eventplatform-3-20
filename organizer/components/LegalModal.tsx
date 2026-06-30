"use client";

import { X } from "lucide-react";
import { TermsContent, PrivacyContent } from "@/components/legal/LegalContent";

export function LegalModal({
  type,
  onClose,
}: {
  type: "terms" | "privacy" | null;
  onClose: () => void;
}) {
  if (!type) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/80 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="overflow-y-auto px-5 sm:px-8 py-8">
          {type === "terms" ? <TermsContent /> : <PrivacyContent />}
        </div>
      </div>
    </div>
  );
}
