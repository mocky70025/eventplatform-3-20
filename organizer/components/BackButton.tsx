"use client";

export function BackButton() {
  return (
    <button
      onClick={() => window.history.back()}
      className="text-sm text-slate-500 hover:text-slate-700 font-medium transition"
    >
      前の画面に戻る
    </button>
  );
}
