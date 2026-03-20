import Link from "next/link";
import { UserNav } from "./UserNav";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
                        </div>
                        <span className="text-lg font-bold text-slate-900">Eventra</span>
                    </Link>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>管理者</span>
                </div>

                <nav className="flex items-center gap-1">
                    <Link href="/organizers" className="text-sm font-medium px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">主催者管理</Link>
                    <Link href="/events" className="text-sm font-medium px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">イベント管理</Link>
                    <Link href="/exhibitors" className="text-sm font-medium px-4 py-2 rounded-lg text-slate-500 hover:text-slate-700 transition-colors">出店者管理</Link>
                    <div className="w-px h-6 bg-slate-200 mx-2" />
                    <UserNav initialUser={user} />
                </nav>
            </div>
        </header>
    );
}
