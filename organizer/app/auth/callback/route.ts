import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`);
    }

    if (!code) {
        return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Collect every cookie Supabase wants to set during exchangeCodeForSession,
    // then attach them to the final redirect response. Using the modern
    // getAll/setAll adapter is required for correct handling of Supabase's
    // chunked session cookies (name.0, name.1, …).
    const cookieStore = await cookies();
    const pending: { name: string; value: string; options: any }[] = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                pending.push(...cookiesToSet);
            },
        },
        cookieOptions: {
            name: 'sb-event-organizer-v1',
        },
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
        return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    let redirectTo: string;
    if (type === 'recovery') {
        redirectTo = `${origin}${next}`;
    } else {
        const { data: profile } = await supabase
            .from('organizers')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();
        redirectTo = profile ? `${origin}${next}` : `${origin}/onboarding`;
    }

    const response = NextResponse.redirect(redirectTo);
    pending.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
    return response;
}
