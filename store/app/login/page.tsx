"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Show any error returned by /auth/callback so OAuth failures are visible
  useEffect(() => {
    const err = searchParams?.get("error");
    const desc = searchParams?.get("error_description");
    if (err) setError(desc ? `${err}: ${decodeURIComponent(desc)}` : err);
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Try normal Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data.user) {
        const { data: profiles } = await supabase
          .from("exhibitors")
          .select("id")
          .eq("user_id", data.user.id)
          .limit(1);

        router.push(!profiles?.length ? "/onboarding" : "/");
        return;
      }

      // Fallback: try app-specific password (syncs Supabase native password)
      const res = await fetch("/api/auth/custom-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });

      if (!res.ok) throw new Error("login failed");

      // API synced the password — now sign in normally
      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (retryError || !retryData.user) throw new Error("login failed");

      const { data: profiles } = await supabase
        .from("exhibitors")
        .select("id")
        .eq("user_id", retryData.user.id)
        .limit(1);

      router.push(!profiles?.length ? "/onboarding" : "/");
    } catch (error: any) {
      setError("メールアドレスまたはパスワードが正しくありません");
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
    <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] px-4">
      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-7 h-7 bg-store-500 rounded-full" />
          <span className="text-2xl font-bold text-slate-900">Wacca</span>
        </div>

        <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">ログイン</h2>
        <p className="text-center text-sm text-slate-500 mb-7">出店者アカウントでログインしてください</p>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 mb-3">
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
              autoComplete="current-password"
              required
              placeholder="********"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 transition placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-[13px] text-store-600 hover:text-store-700 font-medium transition"
            >
              パスワードを忘れた方
            </Link>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-store-500 hover:bg-store-600 text-white font-semibold text-sm shadow-lg shadow-store-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                ログイン中...
              </>
            ) : (
              "ログイン"
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
            Googleでログイン
          </button>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          アカウントをお持ちでない方
          <Link
            href="/signup"
            className="text-store-600 hover:text-store-700 font-semibold ml-1 transition"
          >
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
