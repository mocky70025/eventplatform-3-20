"use client";

import { useState, useEffect } from "react";
import { LogoMark } from "@/components/LogoMark";
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
            <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4]">
                <Loader2 className="h-8 w-8 animate-spin text-store-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f0fdf4] px-4">
            {/* Card */}
            <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-7">
                    <LogoMark />
                    <span className="text-2xl font-bold text-slate-900">Wacca</span>
                </div>

                <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">新しいパスワードの設定</h2>
                <p className="text-center text-sm text-slate-500 mb-7">
                    新しいパスワードを入力してください。
                </p>

                {isSubmitted ? (
                    <div className="rounded-xl bg-store-50 border border-store-200 p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-store-500 rounded-full p-3 text-white shadow-lg shadow-store-500/25">
                                <CheckCircle2 className="h-8 w-8" />
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">更新完了</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            パスワードが正常に更新されました。新しいパスワードでログインしてください。
                        </p>
                        <button
                            className="w-full h-12 rounded-xl bg-store-500 hover:bg-store-600 text-white font-semibold text-sm shadow-lg shadow-store-500/25 transition flex items-center justify-center gap-2"
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
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 transition placeholder:text-slate-500"
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
                                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-store-500 focus:border-store-500 transition placeholder:text-slate-500"
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
                            className="w-full h-12 rounded-xl bg-store-500 hover:bg-store-600 text-white font-semibold text-sm shadow-lg shadow-store-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
                            disabled={isLoading}
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
            </div>
        </div>
    );
}
