import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import {
    Calendar,
    MapPin,
    ChevronRight,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default async function ApplicationsPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Get exhibitor profile (use .limit(1) to handle duplicates gracefully)
    const { data: exhibitors, error: exhibitorError } = await supabase
        .from("exhibitors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

    const exhibitor = exhibitors?.[0];

    if (!exhibitor) {
        redirect("/onboarding");
    }

    // Get applications with event details
    const { data: applications, error } = await supabase
        .from("event_applications")
        .select(`
            *,
            event:events (
                id,
                event_name,
                event_start_date,
                venue_name,
                main_image_url
            )
        `)
        .eq("exhibitor_id", exhibitor.id)
        .order("created_at", { ascending: false });

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "approved":
                return {
                    label: "承認済み",
                    icon: CheckCircle2,
                    className: "bg-green-50 text-green-700 border-green-100",
                    iconClass: "text-green-500"
                };
            case "rejected":
                return {
                    label: "見送り",
                    icon: XCircle,
                    className: "bg-red-50 text-red-700 border-red-100",
                    iconClass: "text-red-500"
                };
            default:
                return {
                    label: "確認中",
                    icon: Clock,
                    className: "bg-blue-50 text-blue-700 border-blue-100",
                    iconClass: "text-blue-500"
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">申込管理</h1>
                    <p className="text-slate-500 mt-1">イベントへの申込状況を確認できます。</p>
                </div>

                {applications && applications.length > 0 ? (
                    <div className="grid gap-4">
                        {applications.map((app: any) => {
                            const statusInfo = getStatusInfo(app.status);
                            const StatusIcon = statusInfo.icon;

                            return (
                                <div
                                    key={app.id}
                                    className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-6">
                                        {/* Event Image / Placeholder */}
                                        <div className="relative w-full md:w-32 h-32 md:h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                            {app.event?.main_image_url ? (
                                                <Image
                                                    src={app.event.main_image_url}
                                                    alt={app.event.event_name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 128px"
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                    <Calendar className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
                                                    statusInfo.className
                                                )}>
                                                    <StatusIcon className={cn("w-3.5 h-3.5", statusInfo.iconClass)} />
                                                    {statusInfo.label}
                                                </div>
                                                <span className="text-xs text-slate-400">
                                                    申込日: {new Date(app.created_at).toLocaleDateString('ja-JP')}
                                                </span>
                                            </div>

                                            <Link href={`/applications/${app.id}`} className="block">
                                                <h2 className="text-lg font-bold text-slate-900 truncate hover:text-store-600 transition-colors">
                                                    {app.event?.event_name}
                                                </h2>
                                            </Link>

                                            <div className="mt-2 flex flex-wrap gap-y-2 gap-x-4 text-sm text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {app.event?.event_start_date ? new Date(app.event.event_start_date).toLocaleDateString('ja-JP') : "未定"}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {app.event?.venue_name || "会場未定"}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                                            <Link href={`/events/${app.event?.id}`}>
                                                <Button variant="outline" size="sm" className="w-full">
                                                    詳細を見る
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Message snippet if any */}
                                    {app.message && (
                                        <div className="bg-slate-50 px-5 md:px-6 py-3 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 line-clamp-1 italic">
                                                " {app.message} "
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">申込済みのイベントはありません</h3>
                        <p className="text-slate-500 mt-2 mb-6">気になるイベントを探して申し込んでみましょう。</p>
                        <Link href="/">
                            <Button className="bg-store-600 hover:bg-store-700">
                                イベントを探す
                            </Button>
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
