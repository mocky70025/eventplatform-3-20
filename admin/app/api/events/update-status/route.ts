import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
    : null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Allowed state transitions: from -> [allowed targets]
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    draft: ['pending', 'published'],
    pending: ['published', 'rejected'],
    published: ['draft', 'closed', 'ended'],
    rejected: ['pending', 'draft'],
    closed: ['ended'],
    ended: [],
    deleted: [], // Cannot transition from deleted
};

export async function POST(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: 'サーバー設定エラー' },
            { status: 500 }
        );
    }

    // Authenticate
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // Check admin email list
    const adminEmailsString = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsString
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0);

    if (adminEmails.length === 0) {
        console.error('[admin/events/update-status] ADMIN_EMAILS is not configured');
        return NextResponse.json({ error: 'アクセスが拒否されました' }, { status: 403 });
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail || !adminEmails.includes(userEmail)) {
        return NextResponse.json({ error: 'アクセスが拒否されました' }, { status: 403 });
    }

    try {
        const { eventId, action } = await request.json();

        // UUID validation
        if (!eventId || typeof eventId !== 'string' || !UUID_REGEX.test(eventId)) {
            return NextResponse.json({ error: '無効なイベントIDです' }, { status: 400 });
        }

        // Fetch current event status for transition validation
        const { data: currentEvent, error: fetchError } = await supabaseAdmin
            .from('events')
            .select('id, status')
            .eq('id', eventId)
            .single();

        if (fetchError || !currentEvent) {
            return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
        }

        if (action === 'delete') {
            // Cannot delete already deleted events
            if (currentEvent.status === 'deleted') {
                return NextResponse.json({ error: 'このイベントは既に削除されています' }, { status: 400 });
            }

            const { data, error } = await supabaseAdmin
                .from('events')
                .update({ status: 'deleted' })
                .eq('id', eventId)
                .select('id, status')
                .single();

            if (error) {
                console.error('[admin/events/update-status] soft-delete error', error);
                return NextResponse.json({ error: 'イベントの削除に失敗しました' }, { status: 500 });
            }

            // 監査ログ (failure is logged and returned as warning)
            const { error: logErr } = await supabaseAdmin.from('admin_audit_logs').insert({
                admin_email: userEmail,
                action: 'event_delete',
                target_type: 'event',
                target_id: eventId,
                details: { previous_status: currentEvent.status, new_status: 'deleted' },
            });
            if (logErr) console.error('[admin/audit] log insert error', logErr);

            return NextResponse.json({
                event: data,
                success: true,
                ...(logErr ? { warning: '監査ログの記録に失敗しました' } : {}),
            });
        }

        // Status update with transition validation
        const validStatuses = ['draft', 'pending', 'published', 'rejected', 'closed', 'ended'];
        if (!validStatuses.includes(action)) {
            return NextResponse.json({ error: '無効なステータスです' }, { status: 400 });
        }

        const allowedTargets = ALLOWED_TRANSITIONS[currentEvent.status] || [];
        if (!allowedTargets.includes(action)) {
            return NextResponse.json({
                error: `${currentEvent.status} から ${action} への遷移は許可されていません`,
            }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('events')
            .update({ status: action })
            .eq('id', eventId)
            .select('id, status')
            .single();

        if (error) {
            console.error('[admin/events/update-status] update error', error);
            return NextResponse.json({ error: 'ステータスの更新に失敗しました' }, { status: 500 });
        }

        const { error: logErr } = await supabaseAdmin.from('admin_audit_logs').insert({
            admin_email: userEmail,
            action: 'event_status_update',
            target_type: 'event',
            target_id: eventId,
            details: { previous_status: currentEvent.status, new_status: action },
        });
        if (logErr) console.error('[admin/audit] log insert error', logErr);

        return NextResponse.json({
            event: data,
            ...(logErr ? { warning: '監査ログの記録に失敗しました' } : {}),
        });
    } catch (error: any) {
        console.error('[admin/events/update-status] request error', error);
        return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 });
    }
}
