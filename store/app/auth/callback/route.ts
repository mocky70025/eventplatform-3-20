import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function getOrigin(request: Request): string {
    // Use NEXT_PUBLIC_APP_URL if available (for Vercel) - trusted source
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Fallback to request URL origin (do not trust x-forwarded-host without allowlist)
    const url = new URL(request.url);
    return url.origin;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const origin = getOrigin(request);
    const code = searchParams.get('code');
    const rawNext = searchParams.get('next') ?? '/';
    // Prevent open redirect: only allow relative paths starting with /
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
    const type = searchParams.get('type') ?? '';
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error) {
        console.error('Auth error:', error, error_description);
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`);
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    const supabase = await createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
        console.error('Exchange error:', exchangeError);
        return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    if (type === 'recovery') {
        return NextResponse.redirect(`${origin}${next}`);
    }

    const { data: profile } = await supabase
        .from('exhibitors')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

    if (!profile) {
        return NextResponse.redirect(`${origin}/onboarding`);
    }

    return NextResponse.redirect(`${origin}${next}`);
}
