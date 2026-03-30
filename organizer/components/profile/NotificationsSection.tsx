"use client";

import { useState } from "react";
import { Loader2, Mail, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NotificationsSectionProps {
    initialProfile: any;
}

export function NotificationsSection({ initialProfile }: NotificationsSectionProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const defaultSettings = initialProfile?.notification_settings || {};

    const initialChannels = {
        email: defaultSettings.email ?? true,
        push: defaultSettings.push ?? false,
    };

    const initialTypes = {
        newApplication: defaultSettings.newApplication ?? true,
        chatMessage: defaultSettings.chatMessage ?? true,
        accountApproval: defaultSettings.accountApproval ?? true,
        eventReminder: defaultSettings.eventReminder ?? true,
        campaign: defaultSettings.campaign ?? false,
    };

    const [channels, setChannels] = useState(initialChannels);
    const [types, setTypes] = useState(initialTypes);

    const toggleChannel = (key: keyof typeof channels) => {
        setChannels(prev => ({ ...prev, [key]: !prev[key] }));
        setSuccess("");
    };

    const toggleType = (key: keyof typeof types) => {
        setTypes(prev => ({ ...prev, [key]: !prev[key] }));
        setSuccess("");
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("セッションがありません");

            const { error: updateError } = await supabase
                .from("organizers")
                .update({ notification_settings: { ...channels, ...types } })
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setSuccess("通知設定を保存しました");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "保存に失敗しました");
        } finally {
            setIsSaving(false);
        }
    };

    const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
        <button
            type="button"
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                checked ? "bg-orange-500" : "bg-slate-200"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    checked ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    );

    const channelItems = [
        { key: "email" as const, icon: Mail, label: "メール通知", desc: initialProfile?.email || "メールアドレス未設定" },
        { key: "push" as const, icon: Bell, label: "プッシュ通知", desc: "ブラウザ通知" },
    ];

    const typeItems = [
        { key: "newApplication" as const, label: "新規出店申込", desc: "出店者からの新しい申込を受け取った時" },
        { key: "chatMessage" as const, label: "出店者からのメッセージ", desc: "チャットで新しいメッセージが届いた時" },
        { key: "accountApproval" as const, label: "アカウント承認", desc: "管理者からの承認・却下通知" },
        { key: "eventReminder" as const, label: "イベントリマインダー", desc: "イベント開催日前のリマインダー" },
        { key: "campaign" as const, label: "お知らせ・キャンペーン", desc: "Eventraからのお得な情報" },
    ];

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            {success && (
                <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl text-sm">{success}</div>
            )}

            {/* 通知チャネル */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-1">通知チャネル</h3>
                <p className="text-sm text-slate-500 mb-5">通知の受け取り方法を選択してください</p>

                <div className="space-y-0 divide-y divide-slate-100">
                    {channelItems.map(item => (
                        <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                    <item.icon className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                    <p className="text-xs text-slate-500">{item.desc}</p>
                                </div>
                            </div>
                            <ToggleSwitch checked={channels[item.key]} onChange={() => toggleChannel(item.key)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* 通知タイプ */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 className="text-base font-bold text-slate-900 mb-1">通知タイプ</h3>
                <p className="text-sm text-slate-500 mb-5">受け取る通知の種類を選択してください</p>

                <div className="space-y-0 divide-y divide-slate-100">
                    {typeItems.map(item => (
                        <div key={item.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                            <div>
                                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                                <p className="text-xs text-slate-500">{item.desc}</p>
                            </div>
                            <ToggleSwitch checked={types[item.key]} onChange={() => toggleType(item.key)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    最終更新: {initialProfile?.updated_at
                        ? new Date(initialProfile.updated_at).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "/") + " " + new Date(initialProfile.updated_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                </p>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        type="button"
                        className="text-slate-600"
                        onClick={() => {
                            setChannels(initialChannels);
                            setTypes(initialTypes);
                            setSuccess("");
                            setError("");
                        }}
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                保存中...
                            </>
                        ) : (
                            "変更を保存"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
