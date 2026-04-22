import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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

    // Build the response up-front so we can attach cookies directly to it.
    // Next.js 16 does not reliably propagate cookieStore.set() mutations onto
    // NextResponse.redirect() responses in Route Handlers — cookies must be set
    // on the response object itself for them to reach the browser.
    const cookieStore = await cookies();
    let response = NextResponse.redirect(`${origin}/onboarding`);

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
                response.cookies.set({ name, value: '', ...options });
            },
        },
        cookieOptions: {
            name: 'sb-event-organizer-v1',
        },
        auth: {
            storageKey: 'sb-event-organizer-auth-v1',
        },
    });

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data?.user) {
        return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    if (type === 'recovery') {
        const recoveryResponse = NextResponse.redirect(`${origin}${next}`);
        response.cookies.getAll().forEach(c => recoveryResponse.cookies.set(c));
        return recoveryResponse;
    }

    const { data: profile } = await supabase
        .from('organizers')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

    // If profile exists, redirect to `next` but carry over session cookies.
    if (profile) {
        const finalResponse = NextResponse.redirect(`${origin}${next}`);
        response.cookies.getAll().forEach(c => finalResponse.cookies.set(c));
        return finalResponse;
    }

    // No profile → already pointing at /onboarding with cookies attached.
    return response;
}
