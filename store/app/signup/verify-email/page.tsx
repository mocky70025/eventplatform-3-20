"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] px-4">
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-7 h-7 bg-store-500 rounded-full" />
          <span className="text-2xl font-bold text-slate-900">Wacca</span>
        </div>

        <div className="w-16 h-16 bg-store-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-store-500" />
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
          <Link href="/login" className="text-store-600 hover:text-store-700 font-semibold transition">
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
