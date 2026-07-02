"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UserNav() {
  const [user, setUser] = useState<any>(null);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (!mounted || isLoading) {
    return (
      <>
        <div className="w-px h-6 bg-slate-200 mx-2" />
        <div className="w-16 h-8 bg-slate-100 animate-pulse rounded-lg" />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className="w-px h-6 bg-slate-200 mx-2" />
        <Link
          href="/login"
          className="text-sm font-medium text-slate-500 hover:text-slate-700 px-3 py-2"
        >
          ログイン
        </Link>
        <Link
          href="/signup"
          className="text-sm font-semibold text-white bg-store-500 hover:bg-store-600 px-4 py-2 rounded-xl transition-colors"
        >
          新規登録
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="w-px h-6 bg-slate-200 mx-2" />
      <button
        onClick={handleLogout}
        className="text-sm text-slate-500 hover:text-red-500 px-3 py-2 transition-colors"
      >
        ログアウト
      </button>
    </>
  );
}
