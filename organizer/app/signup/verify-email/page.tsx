"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50/20">
      <div className="absolute -top-[120px] -left-[60px] w-[400px] h-[400px] rounded-full bg-orange-200 opacity-15" />
      <div className="absolute -bottom-[100px] -right-[80px] w-[350px] h-[350px] rounded-full bg-orange-300 opacity-10" />

      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-slate-900">Wacca</span>
        </div>

        <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-orange-500" />
        </div>

        <h2 className="text-[22px] font-bold text-slate-900 mb-2">確認メールを送信しました</h2>
        <p className="text-sm text-slate-500 mb-2 leading-relaxed">
          以下のアドレスに確認メールをお送りしました。
        </p>
        {email && (
          <p className="text-sm font-semibold text-slate-700 mb-6 bg-slate-50 rounded-xl px-4 py-2.5">
            {email}
          </p>
        )}

        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          メール内のリンクをクリックして、アカウントを有効化してください。
          リンクの有効期限は24時間です。
        </p>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-700 text-left leading-relaxed">
          メールが届かない場合は、迷惑メールフォルダをご確認ください。
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          <Link href="/login" className="text-orange-600 hover:text-orange-700 font-semibold transition">
            ログインページへ戻る
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
