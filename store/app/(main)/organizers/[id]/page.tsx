import { Button } from "@/components/ui/Button";
import {
    ArrowLeft, Building2, User, Mail, Phone, Globe, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function OrganizerDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Get organizer details
    const { data: organizer, error } = await supabase
        .from("organizers")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !organizer) {
        return notFound();
    }

    // Parse social links if available (only allow http/https URLs)
    let socialLinks: Record<string, string> = {};
    if (organizer.social_links && typeof organizer.social_links === 'object') {
        const raw = organizer.social_links as Record<string, string>;
        for (const [key, value] of Object.entries(raw)) {
            if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
                socialLinks[key] = value;
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">

            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Back Button */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm text-slate-500 hover:text-store-600 transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4 mr-1" /> イベント一覧へ戻る
                    </Link>
                </div>

                {/* Organizer Profile Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-50 to-store-50 px-8 py-12 border-b border-slate-100">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-3xl shadow-lg">
                                {organizer.company_name?.[0] || '?'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                                    {organizer.company_name || '主催者名未設定'}
                                </h1>
                                <p className="text-slate-600 font-medium">
                                    {organizer.name || '担当者名未設定'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Contact Information */}
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                連絡先情報
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {organizer.email && (
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-store-100 flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-store-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">メールアドレス</p>
                                            <a 
                                                href={`mailto:${organizer.email}`}
                                                className="text-store-600 hover:text-store-700 font-medium break-all"
                                            >
                                                {organizer.email}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {organizer.phone_number && (
                                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                            <Phone className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">電話番号</p>
                                            <a 
                                                href={`tel:${organizer.phone_number}`}
                                                className="text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                {organizer.phone_number}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Social Links */}
                        {Object.keys(socialLinks).length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                    SNS・ウェブサイト
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(socialLinks).map(([platform, url]) => (
                                        <a
                                            key={platform}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                                <Globe className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{platform}</p>
                                                <p className="text-purple-600 hover:text-purple-700 font-medium break-all">
                                                    {url}
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Additional Info */}
                        {(organizer.gender || organizer.age) && (
                            <section>
                                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
                                    その他の情報
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {organizer.gender && (
                                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5 text-pink-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">性別</p>
                                                <p className="text-slate-900 font-medium">{organizer.gender}</p>
                                            </div>
                                        </div>
                                    )}

                                    {organizer.age && (
                                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                <Building2 className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">年齢</p>
                                                <p className="text-slate-900 font-medium">{organizer.age}歳</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* No Additional Info Message */}
                        {!organizer.email && !organizer.phone_number && Object.keys(socialLinks).length === 0 && !organizer.gender && !organizer.age && (
                            <div className="p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
                                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-400 text-sm">追加情報は登録されていません</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
