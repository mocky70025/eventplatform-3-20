"use client";

import { Suspense, useState, useEffect } from "react";
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
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
            {/* Background decorations */}
            <div className="absolute -top-[120px] -left-[60px] w-[400px] h-[400px] rounded-full bg-slate-300 opacity-15" />
            <div className="absolute -bottom-[100px] -right-[80px] w-[350px] h-[350px] rounded-full bg-slate-400 opacity-10" />
            <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] rounded-full bg-slate-200 opacity-[0.08]" />
            <div className="absolute bottom-[15%] left-[8%] w-[160px] h-[160px] rounded-full bg-slate-300 opacity-[0.08]" />

            {/* Floating dots */}
            <div className="absolute top-[10%] left-[15%] w-3.5 h-3.5 rounded-full bg-slate-400 opacity-50" />
            <div className="absolute top-[8%] right-[20%] w-2.5 h-2.5 rounded-full bg-slate-500 opacity-40" />
            <div className="absolute bottom-[12%] left-[25%] w-4 h-4 rounded-full bg-slate-400 opacity-30" />
            <div className="absolute bottom-[20%] right-[15%] w-3 h-3 rounded-full bg-slate-500 opacity-35" />
            <div className="absolute top-[40%] left-[6%] w-2.5 h-2.5 rounded-full bg-slate-400 opacity-40" />
            <div className="absolute top-[55%] right-[8%] w-3.5 h-3.5 rounded-full bg-slate-400 opacity-30" />

            {/* Card */}
            <div className="relative z-10 w-full max-w-[480px] mx-4 bg-white rounded-3xl shadow-[0_4px_6px_rgba(0,0,0,0.02),0_12px_40px_rgba(0,0,0,0.06)] px-6 sm:px-11 py-10 sm:py-12">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
                        </svg>
                    </div>
                    <span className="text-2xl font-bold text-slate-900">Eventra</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>管理者</span>
                </div>

                <h2 className="text-center text-[22px] font-bold text-slate-900 mb-1.5">管理画面ログイン</h2>
                <p className="text-center text-sm text-slate-500 mb-7">管理者アカウントでログインしてください</p>

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
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition placeholder:text-slate-400"
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
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800 transition placeholder:text-slate-400"
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
                        className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm shadow-lg shadow-slate-800/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
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
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
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
