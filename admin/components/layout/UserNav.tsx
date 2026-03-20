"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, Shield } from "lucide-react";

export function UserNav({ initialUser }: { initialUser?: any }) {
    const [user, setUser] = useState<any>(initialUser);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    };

    if (isLoading) return <div className="w-20 h-8 bg-slate-100 animate-pulse rounded-lg" />;

    if (!user) return null;

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                <Shield className="h-4 w-4" />
                <span>管理者</span>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-8 gap-2 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
            >
                <LogOut className="h-4 w-4" />
                ログアウト
            </Button>
        </div>
    );
}
