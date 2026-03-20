"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) throw error;
            setIsSubmitted(true);
        } catch (error: any) {
            setError(error.message || "送信に失敗しました");
        } finally {
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
                {/* Back link */}
                <div className="mb-6">
                    <Link href="/login" className="inline-flex items-center text-sm text-slate-500 hover:text-store-600 transition font-medium">
                        <ArrowLeft className="h-4 w-4 mr-1" /> ログインに戻る
                    </Link>
                </div>

                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-11 h-11 bg-store-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">Eventra</span>
                </div>

                <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">パスワードをお忘れですか？</h2>
                <p className="text-center text-sm text-slate-500 mb-7">
                    ご登録のメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
                </p>

                {isSubmitted ? (
                    <div className="rounded-xl bg-store-50 border border-store-200 p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-store-500 rounded-full p-3 text-white shadow-lg shadow-store-500/25">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">メールを送信しました</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            再設定用のリンクをメールでお送りしました。メールボックスを確認し、リンクから手続きを完了させてください。
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                メールアドレス
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 transition placeholder:text-slate-400"
                                placeholder="you@example.com"
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full h-12 rounded-xl bg-store-500 hover:bg-store-600 text-white font-semibold text-sm shadow-lg shadow-store-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    送信中...
                                </>
                            ) : (
                                "送信する"
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
