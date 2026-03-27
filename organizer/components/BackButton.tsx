"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
    >
      前の画面に戻る
    </button>
  );
}
