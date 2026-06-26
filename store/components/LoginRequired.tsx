import Link from "next/link";
import { Lock } from "lucide-react";

export function LoginRequired({ label }: { label?: string }) {
    return (
        <div className="min-h-screen bg-[#f0fdf4] flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <div className="w-16 h-16 rounded-2xl bg-store-50 flex items-center justify-center mx-auto mb-5">
                    <Lock className="w-8 h-8 text-store-500" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">ログインが必要です</h1>
                <p className="text-sm text-slate-500 leading-relaxed mb-7">
                    {label ? `${label}を表示するには、ログインしてください。` : "このページを表示するには、ログインしてください。"}
                    <br />
                    アカウントをお持ちでない方は、無料で登録できます。
                </p>
                <div className="space-y-3">
                    <Link
                        href="/login"
                        className="block w-full bg-store-500 hover:bg-store-600 text-white font-bold rounded-xl py-3 transition-colors"
                    >
                        ログイン
                    </Link>
                    <Link
                        href="/signup"
                        className="block w-full border border-slate-200 text-slate-700 font-bold rounded-xl py-3 hover:bg-slate-50 transition-colors"
                    >
                        新規登録
                    </Link>
                </div>
                <Link href="/" className="inline-block mt-6 text-sm text-slate-400 hover:text-slate-600">
                    ホームに戻る
                </Link>
            </div>
        </div>
    );
}
