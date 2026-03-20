import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('[admin/update-approval] Missing Supabase environment variables');
}

const supabaseAdmin = supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: 'サーバー設定エラー' },
            { status: 500 }
        );
    }

    // Authenticate: verify the user is a logged-in admin
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: '認証が必要です' },
            { status: 401 }
        );
    }

    // Check admin email list
    const adminEmailsString = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsString
        ? adminEmailsString.split(',').map(e => e.trim().toLowerCase()).filter(e => e.length > 0)
        : [];

    if (adminEmails.length === 0) {
        console.error('[admin/update-approval] ADMIN_EMAILS is not configured');
        return NextResponse.json(
            { error: 'アクセスが拒否されました' },
            { status: 403 }
        );
    }

    const userEmail = user.email?.toLowerCase();
    if (!userEmail || !adminEmails.includes(userEmail)) {
        return NextResponse.json(
            { error: 'アクセスが拒否されました' },
            { status: 403 }
        );
    }

    try {
        const payload = await request.json();
        const { organizerId, isApproved } = payload;

        // UUID validation
        if (!organizerId || typeof organizerId !== 'string' || !UUID_REGEX.test(organizerId)) {
            return NextResponse.json(
                { error: '無効な主催者IDです' },
                { status: 400 }
            );
        }

        if (typeof isApproved !== 'boolean') {
            return NextResponse.json(
                { error: '無効なリクエストです' },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('organizers')
            .update({ is_approved: isApproved })
            .eq('id', organizerId)
            .select('id, is_approved')
            .single();

        if (error) {
            console.error('[admin/update-approval] update error', error);
            return NextResponse.json(
                { error: '主催者の更新に失敗しました' },
                { status: 500 }
            );
        }

        // 監査ログ
        const { error: logErr } = await supabaseAdmin.from('admin_audit_logs').insert({
            admin_email: userEmail,
            action: isApproved ? 'organizer_approve' : 'organizer_revoke',
            target_type: 'organizer',
            target_id: organizerId,
            details: { is_approved: isApproved },
        });
        if (logErr) console.error('[admin/audit] log insert error', logErr);

        return NextResponse.json({
            organizer: data,
            ...(logErr ? { warning: '監査ログの記録に失敗しました' } : {}),
        });
    } catch (error: any) {
        console.error('[admin/update-approval] request error', error);
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        );
    }
}
