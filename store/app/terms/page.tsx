import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { BackButton } from "@/components/BackButton";
import { TermsContent } from "@/components/legal/LegalContent";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#f0fdf4]">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-[#f0fdf4]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold text-slate-900">Wacca</span>
          </Link>
          <BackButton />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-12">
        <TermsContent />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between text-sm text-slate-400">
          <p>Wacca</p>
          <Link href="/privacy" className="hover:text-slate-600 transition">
            プライバシーポリシー
          </Link>
        </div>
      </main>
    </div>
  );
}
