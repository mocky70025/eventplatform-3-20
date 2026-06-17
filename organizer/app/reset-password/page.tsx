"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [error, setError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check if we have a session (the callback should have established one)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError("セッションが有効ではありません。もう一度リセットメールを送信してください。");
            }
            setIsVerifying(false);
        };
        checkSession();
    }, [supabase.auth]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password.length < 8) {
            setError("パスワードは8文字以上で入力してください");
            setIsLoading(false);
            return;
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
            setError("パスワードには大文字・小文字・数字をそれぞれ含めてください");
            setIsLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError("パスワードが一致しません");
            setIsLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setIsSubmitted(true);
        } catch (error: any) {
            setError(error.message || "更新に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#fde7d2] via-[#fdf8f1] to-[#fbe0c4]">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#fde7d2] via-[#fdf8f1] to-[#fbe0c4]">
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
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>主催者</span>
                </div>

                <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">新しいパスワードの設定</h2>
                <p className="text-center text-sm text-slate-500 mb-7">
                    新しいパスワードを入力してください。
                </p>

                {isSubmitted ? (
                    <div className="rounded-xl bg-orange-50 border border-orange-200 p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-orange-500 rounded-full p-3 text-white shadow-lg shadow-orange-500/25">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">更新完了</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            パスワードが正常に更新されました。新しいパスワードでログインしてください。
                        </p>
                        <button
                            className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2"
                            onClick={() => router.push("/login")}
                        >
                            ログインへ進む <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                                新しいパスワード
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={8}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder:text-slate-400"
                                placeholder="********"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                                新しいパスワード（確認）
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={8}
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition placeholder:text-slate-400"
                                placeholder="********"
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
                            className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    更新中...
                                </>
                            ) : (
                                "パスワードを更新する"
                            )}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-slate-500 mt-6">
                    <Link
                        href="/login"
                        className="text-orange-600 hover:text-orange-700 font-semibold transition"
                    >
                        ログインに戻る
                    </Link>
                </p>
            </div>
        </div>
    );
}
