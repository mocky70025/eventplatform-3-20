"use client";

import { Suspense, useState, useEffect } from "react";
import { LogoMark } from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();

    // URLパラメータからエラーメッセージを取得
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'unauthorized') {
            setError("管理者権限がありません。管理者のメールアドレスでログインしてください。");
        }
    }, [searchParams]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push("/");
            router.refresh();
        } catch (error: any) {
            setError(error.message || "ログインに失敗しました");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#eff4fb] px-4">
            {/* Card */}
            <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-7">
                    <LogoMark />
                    <span className="text-2xl font-bold text-slate-900">Wacca Admin</span>
                </div>

                <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">管理者ログイン</h2>
                <p className="text-center text-sm text-slate-500 mb-7">運営アカウントでログインしてください</p>

                <form className="space-y-4 mb-6" onSubmit={handleLogin}>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            メールアドレス
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-500"
                            placeholder="admin@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            パスワード
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition placeholder:text-slate-500"
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
                        className="w-full h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
            </div>
        </div>
    );
}

function LoginFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginForm />
        </Suspense>
    );
}
