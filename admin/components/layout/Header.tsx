import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";
import { UserNav } from "./UserNav";
import { createClient } from "@/lib/supabase/server";

export async function Header() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
            <div className="max-w-7xl mx-auto grid grid-cols-[1fr_auto_1fr] h-16 items-center px-6">
                <Link href="/" className="flex items-center gap-2 justify-self-start">
                    <LogoMark />
                    <span className="text-lg font-bold text-slate-900">Wacca</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 rounded-full font-semibold inline-flex items-center justify-center h-5" style={{ lineHeight: 1 }}>ADMIN</span>
                </Link>

                <nav className="flex items-center gap-2 justify-self-center">
                    <Link href="/organizers" className="text-sm font-medium px-3 py-2 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">主催者管理</Link>
                    <Link href="/events" className="text-sm font-medium px-3 py-2 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">イベント管理</Link>
                    <Link href="/exhibitors" className="text-sm font-medium px-3 py-2 rounded-lg text-slate-500 hover:text-blue-600 transition-colors">出店者管理</Link>
                </nav>

                <div className="justify-self-end">
                    <UserNav initialUser={user} />
                </div>
            </div>
        </header>
    );
}
