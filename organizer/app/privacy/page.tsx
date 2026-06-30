import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { PrivacyContent } from "@/components/legal/LegalContent";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f1]">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-[#fdf8f1]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-orange-500 rounded-full" />
            <span className="text-lg font-bold text-slate-900">Wacca</span>
          </Link>
          <BackButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-12">
        <PrivacyContent />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
          <p>Wacca</p>
          <Link href="/terms" className="hover:text-slate-600 transition">
            利用規約
          </Link>
        </div>
      </main>
    </div>
  );
}
