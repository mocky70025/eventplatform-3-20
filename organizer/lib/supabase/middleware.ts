import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/terms',
    '/privacy',
    '/auth/callback',
    '/api/auth',
]

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route =>
        pathname === route || pathname.startsWith(route + '/')
    )
}

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        if (!isPublicRoute(request.nextUrl.pathname)) {
            const url = request.nextUrl.clone()
            url.pathname = '/signup'
            return NextResponse.redirect(url)
        }
        return response;
    }

    const pathname = request.nextUrl.pathname

    // Skip auth check entirely for public routes
    if (isPublicRoute(pathname)) {
        return response
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
            cookieOptions: {
                name: 'sb-event-organizer-v1',
            },
            auth: {
                storageKey: 'sb-event-organizer-auth-v1',
            },
        }
    )

    try {
        const { data: { user } } = await supabase.auth.getUser()

        // Redirect unauthenticated users from protected routes to signup
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/signup'
            url.searchParams.set('next', pathname)
            return NextResponse.redirect(url)
        }

        // Redirect authenticated users away from login/signup pages
        if (pathname === '/login' || pathname === '/signup') {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }
    } catch (error) {
        const url = request.nextUrl.clone()
        url.pathname = '/signup'
        return NextResponse.redirect(url)
    }

    return response
}
