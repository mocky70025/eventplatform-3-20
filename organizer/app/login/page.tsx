"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const { data: profile, error: profileError } = await supabase
                .from("organizers")
                .select("id")
                .eq("user_id", data.user.id)
                .single();

            if (profileError) {
                if (profileError.code === '42501') {
                    setError("データベースのアクセス権限エラーが発生しました。管理者に連絡してください。");
                    setIsLoading(false);
                    return;
                }
            }

            if (!profile) {
                router.push("/onboarding");
            } else {
                router.push("/");
            }
        } catch (error: any) {
            setError("メールアドレスまたはパスワードが正しくありません");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'line') => {
        setIsLoading(true);
        setError("");

        if (provider === 'line') {
            window.location.href = '/api/auth/line';
            return;
        }

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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50/20">
            {/* Background decorations */}
            <div className="absolute -top-[120px] -left-[60px] w-[400px] h-[400px] rounded-full bg-orange-200 opacity-15" />
            <div className="absolute -bottom-[100px] -right-[80px] w-[350px] h-[350px] rounded-full bg-orange-300 opacity-10" />
            <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] rounded-full bg-amber-200 opacity-[0.08]" />
            <div className="absolute bottom-[15%] left-[8%] w-[160px] h-[160px] rounded-full bg-pink-200 opacity-[0.08]" />

            {/* Floating dots */}
            <div className="absolute top-[10%] left-[15%] w-3.5 h-3.5 rounded-full bg-orange-400 opacity-50" />
            <div className="absolute top-[8%] right-[20%] w-2.5 h-2.5 rounded-full bg-pink-400 opacity-40" />
            <div className="absolute bottom-[12%] left-[25%] w-4 h-4 rounded-full bg-orange-400 opacity-30" />
            <div className="absolute bottom-[20%] right-[15%] w-3 h-3 rounded-full bg-purple-400 opacity-35" />
            <div className="absolute top-[40%] left-[6%] w-2.5 h-2.5 rounded-full bg-amber-400 opacity-40" />
            <div className="absolute top-[55%] right-[8%] w-3.5 h-3.5 rounded-full bg-orange-400 opacity-30" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">Eventra</span>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>主催者</span>
                </div>

                <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">おかえりなさい</h2>
                <p className="text-center text-sm text-slate-500 mb-7">主催者アカウントにログイン</p>

                {/* Social Login */}
                <div className="space-y-3 mb-6">
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
                        Googleでログイン
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('line')}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl text-white text-sm font-medium shadow-sm hover:opacity-90 transition disabled:opacity-50"
                        style={{ backgroundColor: "#06C755" }}
                    >
                        <svg className="w-5 h-5" fill="white" viewBox="0 0 24 24">
                            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596a.626.626 0 01-.199.031c-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                        </svg>
                        LINEでログイン
                    </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs text-slate-400 font-medium">または</span>
                    <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4 mb-6">
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
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder:text-slate-400"
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
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder:text-slate-400"
                        />
                    </div>

                    <div className="flex items-center justify-end pt-1">
                        <Link
                            href="/forgot-password"
                            className="text-[13px] text-orange-600 hover:text-orange-700 font-medium transition"
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
                        className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
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

                <p className="text-center text-sm text-slate-500">
                    アカウントをお持ちでない方
                    <Link
                        href="/signup"
                        className="text-orange-600 hover:text-orange-700 font-semibold ml-1 transition"
                    >
                        新規登録
                    </Link>
                </p>
            </div>
        </div>
    );
}
