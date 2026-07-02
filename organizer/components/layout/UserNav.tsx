"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UserNav() {
    const [user, setUser] = useState<unknown>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        supabase.auth.getUser().then(({ data: { user: u }, error }) => {
            if (error) {
                setUser(null);
            } else {
                setUser(u ?? null);
            }
            setIsLoading(false);
        }).catch((err) => {
            setUser(null);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    };

    if (!mounted || isLoading) {
        return <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-lg" />;
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Link href="/login">
                    <Button variant="ghost" size="sm">ログイン</Button>
                </Link>
                <Link href="/signup">
                    <Button size="sm">新規登録</Button>
                </Link>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogout}
            className="text-sm text-slate-500 hover:text-red-500 px-3 py-2 transition-colors"
        >
            ログアウト
        </button>
    );
}
