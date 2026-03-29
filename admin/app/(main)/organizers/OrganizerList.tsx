"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Organizer {
    id: string;
    company_name: string;
    name: string;
    email: string;
    phone_number: string;
    is_approved: boolean;
    created_at: string;
}

export function OrganizerRow({ organizer: initialOrganizer }: { organizer: Organizer }) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [organizer, setOrganizer] = useState(initialOrganizer);
    const [errorMessage, setErrorMessage] = useState("");
    const [isStaleGuard, setIsStaleGuard] = useState(false);
    const router = useRouter();

    // Sync with props when they change, but skip during stale guard window
    useEffect(() => {
        if (!isStaleGuard) {
            setOrganizer(initialOrganizer);
        }
    }, [initialOrganizer, isStaleGuard]);

    const handleToggleApproval = async () => {
        setIsUpdating(true);
        setErrorMessage("");
        const previousState = organizer.is_approved;
        try {
            const newApprovalStatus = !organizer.is_approved;

            // Optimistic update
            setOrganizer(prev => ({ ...prev, is_approved: newApprovalStatus }));
            setIsStaleGuard(true);

            const response = await fetch('/api/organizers/update-approval', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizerId: organizer.id,
                    isApproved: newApprovalStatus,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || '更新に失敗しました');
            }

            // Confirm with server response
            if (result.organizer) {
                setOrganizer(prev => ({ ...prev, is_approved: result.organizer.is_approved }));
            }

            // Refresh server data, then release stale guard
            router.refresh();
            setTimeout(() => setIsStaleGuard(false), 1500);
        } catch (err: any) {
            setErrorMessage(err.message || "不明なエラー");
            // Revert on error
            setOrganizer(prev => ({ ...prev, is_approved: previousState }));
            setIsStaleGuard(false);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <tr id={`org-${organizer.id}`} className="hover:bg-slate-50/50 transition-colors scroll-mt-20">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{organizer.company_name || "個人"}</span>
                    <span className="text-xs text-slate-500">{organizer.name}</span>
                    {errorMessage && (
                        <span className="text-xs text-red-600 mt-1">{errorMessage}</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col text-xs text-slate-600">
                    <span>{organizer.email}</span>
                    <span>{organizer.phone_number}</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                {new Date(organizer.created_at).toLocaleDateString('ja-JP')}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${organizer.is_approved
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                    }`}>
                    {organizer.is_approved ? "承認済み" : "未承認"}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                    size="sm"
                    variant={organizer.is_approved ? "outline" : "primary"}
                    onClick={handleToggleApproval}
                    disabled={isUpdating}
                    className={!organizer.is_approved ? "bg-slate-900 text-white hover:bg-slate-800 h-8 text-xs" : "h-8 text-xs"}
                >
                    {isUpdating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : organizer.is_approved ? (
                        "承認解除"
                    ) : (
                        <span className="flex items-center gap-1"><Check className="w-3 h-3" /> 承認する</span>
                    )}
                </Button>
            </td>
        </tr>
    );
}

export default function OrganizerList({ organizers }: { organizers: Organizer[] }) {
    if (!organizers || organizers.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400">主催者がまだ登録されていません</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-50">
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">会社名 / 担当者</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">連絡先</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">登録日</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">ステータス</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {organizers.map((org) => (
                            <OrganizerRow key={org.id} organizer={org} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
