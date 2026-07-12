"use client";

import { useState } from "react";
import { LogoMark } from "@/components/LogoMark";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
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
            const res = await fetch("/api/auth/custom-auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "signup", email, password }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.error || "アカウント作成に失敗しました。入力内容を確認してください。");
                return;
            }

            if (result.action === "signup") {
                router.push(`/signup/verify-email?email=${encodeURIComponent(email)}`);
                return;
            }

            // Existing user (cross-app) — sign in immediately
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (signInError || !signInData.user) {
                setError("認証に失敗しました。しばらくしてからお試しください。");
                return;
            }

            const { data: profiles } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", signInData.user.id)
                .limit(1);

            router.push(!profiles?.length ? "/onboarding" : "/");
        } catch {
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
        <div className="min-h-screen flex items-center justify-center bg-[#fdf8f1] px-4">
            {/* Card */}
            <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-7">
                    <LogoMark />
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
                </div>

                <h2 className="text-center text-2xl font-bold text-slate-900 mb-1.5">新規登録</h2>
                <p className="text-center text-sm text-slate-500 mb-7">主催者アカウントを作成します</p>

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
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder:text-slate-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            パスワード
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                placeholder="8文字以上で入力してください"
                                minLength={8}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder:text-slate-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                処理中...
                            </>
                        ) : (
                            "アカウントを作成"
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-3">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-500 font-medium">または</span>
                    <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Social Login */}
                <div className="space-y-3 mb-3">
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
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


                <p className="text-center text-sm text-slate-500 mt-6">
                    すでにアカウントをお持ちの方
                    <Link
                        href="/login"
                        className="text-orange-600 hover:text-orange-700 font-semibold ml-1 transition"
                    >
                        ログイン
                    </Link>
                </p>
            </div>
        </div>
    );
}
