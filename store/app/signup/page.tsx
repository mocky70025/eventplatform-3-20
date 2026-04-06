"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isEmailSent, setIsEmailSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Call server API to create user and send confirmation email via Resend
      const res = await fetch("/api/auth/custom-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password }),
      });

      const result = await res.json();

      if (res.ok) {
        // New user created, confirmation email sent via Resend
        setIsEmailSent(true);
        return;
      }

      // User already exists in another app → cross-app signup
      if (res.status === 409 && result.userId) {
        const crossRes = await fetch("/api/auth/custom-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "cross-signup", email, password, userId: result.userId }),
        });

        if (!crossRes.ok) {
          setError("登録に失敗しました。しばらくしてからお試しください。");
          return;
        }

        const { token_hash } = await crossRes.json();
        const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash, type: "magiclink" });

        if (verifyError) {
          setError("認証に失敗しました。しばらくしてからお試しください。");
          return;
        }

        router.push("/onboarding");
        return;
      }

      setError(result.error || "アカウント作成に失敗しました。入力内容を確認してください。");
    } catch (error: any) {
      console.error("Signup error:", error);
      setError("アカウント作成に失敗しました。入力内容を確認してください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    setIsLoading(true);
    setError("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || "ログインに失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-store-50 to-amber-50/20">
      {/* Background decorations */}
      <div className="absolute -top-[120px] -left-[60px] w-[400px] h-[400px] rounded-full bg-store-200 opacity-15" />
      <div className="absolute -bottom-[100px] -right-[80px] w-[350px] h-[350px] rounded-full bg-store-300 opacity-10" />
      <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] rounded-full bg-amber-200 opacity-[0.08]" />
      <div className="absolute bottom-[15%] left-[8%] w-[160px] h-[160px] rounded-full bg-pink-200 opacity-[0.08]" />

      {/* Floating dots */}
      <div className="absolute top-[10%] left-[15%] w-3.5 h-3.5 rounded-full bg-orange-400 opacity-50" />
      <div className="absolute top-[8%] right-[20%] w-2.5 h-2.5 rounded-full bg-pink-400 opacity-40" />
      <div className="absolute bottom-[12%] left-[25%] w-4 h-4 rounded-full bg-store-400 opacity-30" />
      <div className="absolute bottom-[20%] right-[15%] w-3 h-3 rounded-full bg-purple-400 opacity-35" />
      <div className="absolute top-[40%] left-[6%] w-2.5 h-2.5 rounded-full bg-amber-400 opacity-40" />
      <div className="absolute top-[55%] right-[8%] w-3.5 h-3.5 rounded-full bg-orange-400 opacity-30" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
        {isEmailSent ? (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-store-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-store-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">確認メールを送信しました</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              登録したメールアドレスに確認メールを送信しました。<br />
              メール内のリンクをクリックして、<br />アカウントを有効化してください。
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition"
            >
              ログイン画面へ戻る
            </Link>
          </div>
        ) : (
          <>
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-11 h-11 bg-store-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-slate-900">Wacca</span>
              <span className="text-[10px] bg-store-100 text-store-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>出店者</span>
            </div>

            <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">アカウント作成</h2>
            <p className="text-center text-sm text-slate-500 mb-7">出店者として無料で登録</p>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  メールアドレス
                </label>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 transition placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  パスワード
                </label>
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  placeholder="8文字以上で入力してください"
                  minLength={8}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 transition placeholder:text-slate-400"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-store-500 hover:bg-store-600 text-white font-semibold text-sm shadow-lg shadow-store-500/25 transition mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    アカウント作成中...
                  </>
                ) : (
                  "アカウントを作成"
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">または</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Social Login */}
            <div className="space-y-3 mb-3">
              <button
                type="button"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 transition text-sm font-medium text-slate-700 shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Googleで登録
              </button>
            </div>

            <p className="text-xs text-center text-slate-400 mt-3">
              登録することで、<a href="/terms" className="underline hover:text-slate-600">利用規約</a>と<a href="/privacy" className="underline hover:text-slate-600">プライバシーポリシー</a>に同意したことになります。
            </p>

            <p className="text-center text-sm text-slate-500 mt-6">
              すでにアカウントをお持ちの方
              <Link
                href="/login"
                className="text-store-600 hover:text-store-700 font-semibold ml-1 transition"
              >
                ログイン
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
