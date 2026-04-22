import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/api/auth',
    '/events',
    '/organizers',
    '/privacy',
    '/terms',
]

function isPublicRoute(pathname: string): boolean {
    // Home page is public
    if (pathname === '/') return true
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
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
            cookieOptions: {
                name: 'sb-event-store-v1',
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
    } catch {
        const url = request.nextUrl.clone()
        url.pathname = '/signup'
        return NextResponse.redirect(url)
    }

    return response
}
