import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

function getOrigin(request: NextRequest): string {
    // Use NEXT_PUBLIC_APP_URL if available (for Vercel) - trusted source
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Fallback to request URL origin (do not trust x-forwarded-host without allowlist)
    const url = new URL(request.url);
    return url.origin;
}

function clearStateCookie(response: NextResponse): NextResponse {
    response.cookies.set('line_oauth_state', '', { maxAge: 0, path: '/api/auth' });
    return response;
}

function errorRedirect(origin: string, error: string): NextResponse {
    return clearStateCookie(NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`));
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const origin = getOrigin(request);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // Verify CSRF state parameter
    const storedState = request.cookies.get('line_oauth_state')?.value ?? null;

    if (!state || !storedState || state !== storedState) {
        return errorRedirect(origin, 'invalid-state');
    }

    if (!code) {
        return errorRedirect(origin, 'no-code');
    }

    const client_id = process.env.LINE_CHANNEL_ID;
    const client_secret = process.env.LINE_CHANNEL_SECRET;
    const redirect_uri = `${origin}/api/auth/line/callback`;

    if (!client_id || !client_secret) {
        return clearStateCookie(
            NextResponse.json({ error: 'LINE credentials missing' }, { status: 500 })
        );
    }

    try {
        // 1. Exchange code for access token (and ID Token)
        const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirect_uri,
                client_id: client_id,
                client_secret: client_secret,
            }),
            signal: AbortSignal.timeout(30000),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('LINE Token Error:', tokenResponse.status, tokenData);
            return errorRedirect(origin, 'line-token-error');
        }

        const { id_token } = tokenData;
        if (!id_token) {
            console.error('No ID token in response. Keys:', Object.keys(tokenData));
            return errorRedirect(origin, 'no-id-token');
        }

        // 2. Decode ID Token to get user email
        const verifyResponse = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_token: id_token,
                client_id: client_id,
            }),
            signal: AbortSignal.timeout(30000),
        });

        const claims = await verifyResponse.json();

        if (!verifyResponse.ok) {
            console.error('ID Token Verification Error:', verifyResponse.status, claims);
            return errorRedirect(origin, 'token-verification-failed');
        }

        if (!claims.email) {
            console.error('Email not found in LINE claims. Make sure you have requested email permission.');
            return errorRedirect(origin, 'email-not-found-in-line');
        }

        const email = claims.email;
        const metadata = { full_name: claims.name, picture: claims.picture };
        const supabaseAdmin = createAdminClient();

        // 3. Find or Create User in Supabase (Service Role)
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: metadata,
        });

        let userId: string;

        if (createError && createError.status === 422) {
            // User already exists — look up by email and update metadata
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
                filter: { email: email },
                page: 1,
                perPage: 1,
            } as any);
            const existingUser = users?.[0];
            if (!existingUser || existingUser.email !== email) {
                console.error('User exists but could not be found:', email);
                return errorRedirect(origin, 'auth-failed');
            }
            userId = existingUser.id;

            // Update user_metadata with latest LINE profile
            await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: { ...existingUser.user_metadata, ...metadata },
            });
        } else if (createError) {
            console.error('Supabase Create User Error:', createError.message, createError.status);
            return errorRedirect(origin, 'auth-failed');
        } else {
            userId = createdUser.user!.id;
        }

        // 4. Generate Magic Link and verify server-side to create session directly
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        });

        if (linkError || !linkData.properties?.action_link) {
            console.error('Supabase Magic Link Error:', linkError?.message);
            return errorRedirect(origin, 'magic-link-failed');
        }

        // 5. Exchange the token server-side instead of redirecting to the action link
        //    This avoids exposing the token in browser history / Referer headers
        const actionUrl = new URL(linkData.properties.action_link);
        const token_hash = actionUrl.searchParams.get('token_hash') ?? actionUrl.hash?.replace('#', '') ?? null;
        const tokenType = actionUrl.searchParams.get('type') ?? 'magiclink';

        if (!token_hash) {
            console.error('Could not extract token_hash from action link:', linkData.properties.action_link);
            return errorRedirect(origin, 'magic-link-failed');
        }

        const supabase = await createClient();
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
            type: tokenType as 'magiclink',
            token_hash: token_hash,
        });

        if (sessionError || !sessionData.user) {
            console.error('Session creation error:', sessionError?.message);
            return errorRedirect(origin, 'session-failed');
        }

        // 6. Check if profile exists to decide redirect destination
        const { data: profile } = await supabase
            .from('exhibitors')
            .select('id')
            .eq('user_id', sessionData.user.id)
            .maybeSingle();

        const destination = profile ? '/' : '/onboarding';
        return clearStateCookie(NextResponse.redirect(`${origin}${destination}`));

    } catch (err: any) {
        console.error('Unexpected Auth Error:', err.message);
        return errorRedirect(origin, 'server-error');
    }
}
