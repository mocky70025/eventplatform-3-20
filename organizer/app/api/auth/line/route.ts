import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    const origin = getOrigin(request);
    const client_id = process.env.LINE_CHANNEL_ID;
    const redirect_uri = `${origin}/api/auth/line/callback`;
    const state = crypto.randomBytes(32).toString('hex');

    if (!client_id) {
        return NextResponse.json({ error: 'LINE_CHANNEL_ID is missing' }, { status: 500 });
    }

    // LINE OAuth2 Authorization URL
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: client_id,
        redirect_uri: redirect_uri,
        state: state,
        scope: 'profile openid email',
        prompt: 'consent',
    });

    const url = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;

    const response = NextResponse.redirect(url);
    // Store state in a cookie for CSRF verification in the callback
    response.cookies.set('line_oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/api/auth',
    });

    return response;
}
