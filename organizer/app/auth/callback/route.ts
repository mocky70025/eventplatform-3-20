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
    const token_hash = searchParams.get('token_hash');
    const rawNext = searchParams.get('next') ?? '/';
    // Prevent open redirect: only allow relative paths starting with /
    const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
    const type = searchParams.get('type') ?? '';
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error) {
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(error_description || '')}`);
    }

    if (!code && !token_hash) {
        return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const cookieStore = await cookies();
    let response = NextResponse.next();

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => cookieStore.set(name, value));
                response = NextResponse.next();
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                );
            },
        },
        cookieOptions: {
            name: 'sb-event-organizer-v1',
        },
    });

    const { data, error: exchangeError } = token_hash
        ? await supabase.auth.verifyOtp({ type: type as "signup" | "magiclink" | "recovery", token_hash })
        : await supabase.auth.exchangeCodeForSession(code!);

    if (exchangeError || !data?.user) {
        const desc = exchangeError?.message || 'no-user';
        return NextResponse.redirect(
            `${origin}/login?error=exchange-failed&error_description=${encodeURIComponent(desc)}`
        );
    }

    const redirectTo = `${origin}${next}`;

    const redirectResponse = NextResponse.redirect(redirectTo);
    response.cookies.getAll().forEach(({ name, value, ...options }) =>
        redirectResponse.cookies.set(name, value, options)
    );
    return redirectResponse;
}
