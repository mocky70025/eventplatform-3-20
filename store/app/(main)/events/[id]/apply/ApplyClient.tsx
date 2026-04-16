"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    CheckCircle2, AlertCircle, Loader2, ArrowLeft,
    Store, User, Mail, Phone, Calendar, Info, Pencil, Save, X, Upload
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const PRESET_EXHIBITOR_FIELDS: Record<string, { label: string; type: string }> = {
    menu_list: { label: "出店メニュー・商品リスト", type: "textarea" },
    price_range: { label: "販売価格帯", type: "text" },
    booth_description: { label: "ブースの装飾・外観の説明", type: "textarea" },
    power_needed: { label: "電源の要否・必要電力量", type: "text" },
    water_needed: { label: "水道の要否", type: "text" },
    gas_usage: { label: "ガス使用の有無", type: "text" },
    tent_info: { label: "テント持参の有無・サイズ", type: "text" },
    space_size: { label: "必要なスペースサイズ", type: "text" },
    vehicle_entry: { label: "車両乗り入れの有無・サイズ", type: "text" },
    loading_time_preference: { label: "搬入希望時間帯", type: "text" },
    food_safety_cert: { label: "食品衛生責任者証", type: "file" },
    business_license: { label: "営業許可証（保健所）", type: "file" },
    pl_insurance: { label: "PL保険証書", type: "file" },
    fire_equipment_layout: { label: "火器類配置図", type: "file" },
    vehicle_inspection: { label: "車検証", type: "file" },
    allergy_info: { label: "アレルギー表示", type: "file" },
    staff_count: { label: "当日のスタッフ人数", type: "text" },
    emergency_contact: { label: "当日の緊急連絡先", type: "text" },
};

interface FormField {
    key: string;
    label: string;
    type: string;
}

function parseExhibitorFormFields(event: any): FormField[] {
    const fields: FormField[] = [];
    try {
        const raw = typeof event.exhibitor_form_fields === 'string'
            ? JSON.parse(event.exhibitor_form_fields)
            : event.exhibitor_form_fields;
        if (!raw) return fields;

        // Preset fields
        if (Array.isArray(raw.preset)) {
            for (const key of raw.preset) {
                const preset = PRESET_EXHIBITOR_FIELDS[key];
                if (preset) {
                    fields.push({ key, label: preset.label, type: preset.type });
                }
            }
        }

        // Custom fields
        if (Array.isArray(raw.custom)) {
            for (const custom of raw.custom) {
                if (custom.label) {
                    fields.push({ key: custom.id || custom.label, label: custom.label, type: custom.type || "text" });
                }
            }
        }
    } catch {
        // Invalid JSON, skip
    }
    return fields;
}

export default function ApplyClient({ event, exhibitor }: { event: any, exhibitor: any }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
    const [fileUploading, setFileUploading] = useState<Record<string, boolean>>({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);

    const formFields = parseExhibitorFormFields(event);

    // Parse day settings for multi-day events
    const daySettings = (() => {
        const raw = event.event_day_settings;
        if (!raw) return null;
        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
        } catch { return null; }
    })();
    const [isEditing, setIsEditing] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const [profile, setProfile] = useState({
        shop_name: exhibitor.shop_name || "",
        name: exhibitor.name || "",
        email: exhibitor.email || "",
        phone_number: exhibitor.phone_number || "",
    });
    const supabase = createClient();
    const router = useRouter();

    const handleSaveProfile = async () => {
        setIsSavingProfile(true);
        try {
            // Verify current user owns this exhibitor profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("ログインセッションが見つかりません。");

            const { error: updateError } = await supabase
                .from("exhibitors")
                .update({
                    shop_name: profile.shop_name,
                    name: profile.name,
                    email: profile.email,
                    phone_number: profile.phone_number,
                })
                .eq("id", exhibitor.id)
                .eq("user_id", user.id);

            if (updateError) throw updateError;

            setIsEditing(false);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 3000);
        } catch (err: any) {
            setError(err.message || "プロフィールの更新に失敗しました");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleFileUpload = async (fieldKey: string, file: File) => {
        setFileUploading(prev => ({ ...prev, [fieldKey]: true }));
        try {
            const ext = file.name.split('.').pop();
            const filePath = `${exhibitor.id}/${fieldKey}_${Date.now()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("exhibitor-documents")
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("exhibitor-documents")
                .getPublicUrl(filePath);

            setFormAnswers(prev => ({ ...prev, [fieldKey]: publicUrl }));
        } catch (err: any) {
            setError(err.message || "ファイルのアップロードに失敗しました");
        } finally {
            setFileUploading(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    const handleApply = async () => {
        setIsLoading(true);
        setError("");

        try {
            const answers = formFields.length > 0 ? { ...formAnswers } : {};
            if (daySettings && selectedDays.length > 0) {
                (answers as Record<string, any>).selected_days = selectedDays;
            }

            const { error: insertError } = await supabase
                .from("event_applications")
                .insert({
                    event_id: event.id,
                    exhibitor_id: exhibitor.id,
                    message: message,
                    form_answers: Object.keys(answers).length > 0 ? answers : null,
                    status: 'pending'
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    throw new Error("このイベントには既に申し込み済みです。");
                }
                throw insertError;
            }

            // 主催者に通知を作成（失敗しても申し込み自体はブロックしない）
            try {
                const organizerUserId = event.organizers?.user_id;
                if (organizerUserId) {
                    await fetch("/api/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            user_id: organizerUserId,
                            user_type: "organizer",
                            type: "new_application",
                            title: "新しい出店申し込みがありました",
                            message: `「${event.event_name}」に${exhibitor.shop_name || "出店者"}から申し込みがありました。`,
                            related_event_id: event.id,
                        }),
                    });
                }
            } catch (notifErr) {
                console.error("通知作成に失敗:", notifErr);
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/applications");
                router.refresh();
            }, 3000);
        } catch (err: any) {
            setError(err.message || "申し込みに失敗しました。時間をおいて再度お試しください。");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center shadow-xl shadow-store-900/5 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-store-100 text-store-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-4">申し込みが完了しました！</h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    イベント主催者（{event.organizers?.company_name}）に申し込み情報が送信されました。<br />
                    承認されるとチャットが可能になります。
                </p>
                <Link href="/">
                    <Button variant="outline" className="h-12 px-8 rounded-xl font-bold">
                        トップページへ戻る
                    </Button>
                </Link>
                <p className="text-xs text-slate-400 mt-6">※ 3秒後に自動的に移動します</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link href={`/events/${event.id}`} className="flex items-center text-sm font-medium text-slate-500 hover:text-primary transition-colors mb-4">
                    <ArrowLeft className="w-4 h-4 mr-1" /> イベント詳細へ戻る
                </Link>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">出店を申し込む</h1>
                <p className="text-slate-500 font-medium">以下の内容で申し込みを送信します。</p>
            </div>

            {/* Event Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">申し込み先イベント</p>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{event.event_name}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-store-600" /> {event.event_start_date}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-store-600" /> {event.genre}
                    </div>
                </div>
            </div>

            {/* Profile Review Section */}
            <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" /> 登録プロフィール情報
                    </h3>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5" /> 編集
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setProfile({
                                        shop_name: exhibitor.shop_name || "",
                                        name: exhibitor.name || "",
                                        email: exhibitor.email || "",
                                        phone_number: exhibitor.phone_number || "",
                                    });
                                }}
                                className="flex items-center gap-1 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" /> キャンセル
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={isSavingProfile}
                                className="flex items-center gap-1.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                保存
                            </button>
                        </div>
                    )}
                </div>

                {profileSaved && (
                    <div className="mb-4 p-3 bg-store-50 border border-store-100 rounded-xl text-store-700 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> プロフィールを更新しました
                    </div>
                )}

                <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                        <span className="text-slate-400 font-bold">屋号 / 店舗名</span>
                        {isEditing ? (
                            <input
                                value={profile.shop_name}
                                onChange={(e) => setProfile(prev => ({ ...prev, shop_name: e.target.value }))}
                                className="text-right text-slate-900 font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-60"
                            />
                        ) : (
                            <span className="text-slate-900 font-bold">{profile.shop_name}</span>
                        )}
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                        <span className="text-slate-400 font-bold">代表者名</span>
                        {isEditing ? (
                            <input
                                value={profile.name}
                                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="text-right text-slate-900 font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-60"
                            />
                        ) : (
                            <span className="text-slate-900 font-bold">{profile.name}</span>
                        )}
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-50">
                        <span className="text-slate-400 font-bold">ジャンル</span>
                        <span className="text-slate-900 font-bold">{exhibitor.genres?.length > 0 ? exhibitor.genres.join("、") : exhibitor.genre_free_text || exhibitor.genre || "未設定"}</span>
                    </div>
                    {exhibitor.business_styles?.length > 0 && (
                        <div className="flex justify-between py-3 border-b border-slate-50">
                            <span className="text-slate-400 font-bold">営業形態</span>
                            <span className="text-slate-900 font-bold">{exhibitor.business_styles.join("、")}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                        <span className="text-slate-400 font-bold">メールアドレス</span>
                        {isEditing ? (
                            <input
                                type="email"
                                value={profile.email}
                                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                className="text-right text-slate-900 font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-60"
                            />
                        ) : (
                            <span className="text-slate-900 font-bold flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {profile.email}</span>
                        )}
                    </div>
                    <div className="flex justify-between items-center py-3">
                        <span className="text-slate-400 font-bold">電話番号</span>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={profile.phone_number}
                                onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                                className="text-right text-slate-900 font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-60"
                            />
                        ) : (
                            <span className="text-slate-900 font-bold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profile.phone_number}</span>
                        )}
                    </div>
                </div>

            </section>

            {/* Message to Organizer */}
            <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    メッセージ（任意）
                </h3>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="主催者への自己紹介や、意気込み、質問などがあれば記入してください。"
                    rows={5}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm leading-relaxed"
                />
            </section>

            {/* Exhibitor Form Fields */}
            {formFields.length > 0 && (
                <section className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5 text-store-600" /> 追加質問
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">主催者が設定した質問項目に回答してください。</p>
                    <div className="space-y-5">
                        {formFields.map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">{field.label}</label>
                                {field.type === "file" ? (
                                    <div>
                                        {formAnswers[field.key] ? (
                                            <div className="flex items-center gap-2 text-sm text-store-600">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>アップロード済み</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormAnswers(prev => {
                                                        const next = { ...prev };
                                                        delete next[field.key];
                                                        return next;
                                                    })}
                                                    className="text-xs text-slate-400 hover:text-red-500 ml-2"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 hover:border-store-300 transition-colors">
                                                {fileUploading[field.key] ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                                <span>{fileUploading[field.key] ? "アップロード中..." : "ファイルを選択"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/*,.pdf"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) handleFileUpload(field.key, file);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                ) : field.type === "textarea" ? (
                                    <textarea
                                        value={formAnswers[field.key] || ""}
                                        onChange={(e) => setFormAnswers(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        rows={3}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formAnswers[field.key] || ""}
                                        onChange={(e) => setFormAnswers(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Error Display */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="font-medium">{error}</p>
                </div>
            )}

            {/* 出店希望日（日別条件がある場合） */}
            {daySettings && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">出店希望日を選択してください</h3>
                    <div className="space-y-2">
                        {daySettings.map((day: { date: string; recruit_count: number; fee: string; notes: string }) => (
                            <label key={day.date} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-store-50/30 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={selectedDays.includes(day.date)}
                                    onChange={(e) => {
                                        setSelectedDays(prev =>
                                            e.target.checked
                                                ? [...prev, day.date]
                                                : prev.filter(d => d !== day.date)
                                        );
                                    }}
                                    className="w-4 h-4 rounded border-slate-300 text-store-600 focus:ring-store-500"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-slate-900">
                                        {new Date(day.date).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}
                                    </span>
                                    <span className="text-xs text-slate-500 ml-2">
                                        {day.recruit_count}区画 / {day.fee || "未定"}
                                    </span>
                                    {day.notes && <p className="text-xs text-slate-400 mt-0.5">{day.notes}</p>}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* 規約同意 */}
            <label className="flex items-start gap-3 cursor-pointer bg-store-50/50 border border-store-100 rounded-xl p-4">
                <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-store-600 focus:ring-store-500"
                />
                <span className="text-sm text-slate-700">
                    <Link href="/terms" target="_blank" className="text-store-600 underline hover:text-store-700">利用規約</Link>・
                    <Link href="/privacy" target="_blank" className="text-store-600 underline hover:text-store-700">プライバシーポリシー</Link>
                    を確認し、同意のうえ申し込みます
                </span>
            </label>

            {/* Apply Button */}
            <div className="pt-4">
                <Button
                    onClick={handleApply}
                    disabled={isLoading || !agreedToTerms}
                    className="w-full h-14 rounded-2xl text-lg font-extrabold shadow-lg shadow-primary/20"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" /> 送信中...
                        </div>
                    ) : (
                        "以上の内容で申し込みを確定する"
                    )}
                </Button>
                <p className="text-center text-xs text-slate-400 mt-4">
                    申し込みを確定すると、主催者にあなたのプロフィールが公開されます。
                </p>
            </div>
        </div>
    );
}
