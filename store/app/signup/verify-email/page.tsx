"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Mail, HelpCircle, ChevronDown, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [open, setOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setResendMsg("");
    try {
      const res = await fetch("/api/auth/custom-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", email }),
      });
      if (res.ok) {
        setResendMsg("確認メールを再送信しました。");
      } else {
        const r = await res.json().catch(() => ({}));
        setResendMsg(r.error || "再送信に失敗しました。しばらくしてからお試しください。");
      }
    } catch {
      setResendMsg("再送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setResending(false);
    }
  };

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

        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          メール内のリンクをクリックして、アカウントを有効化してください。
          リンクの有効期限は24時間です。
        </p>

        <div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            メールが届かない場合
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-600 text-left leading-relaxed">
              迷惑メールフォルダもご確認ください。それでも届かない場合は、メールアドレスが正しいかご確認のうえ、下の「確認メールを再送信」をお試しください。
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="mt-6 w-full h-11 rounded-xl border border-store-200 text-sm font-semibold text-store-700 hover:bg-store-50 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {resending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              送信中...
            </>
          ) : (
            "確認メールを再送信"
          )}
        </button>
        {resendMsg && (
          <p className="mt-3 text-sm text-store-600">{resendMsg}</p>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
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
