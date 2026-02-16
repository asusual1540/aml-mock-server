import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/check'];
const API_PREFIX = '/api/';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow public paths
    if (PUBLIC_PATHS.some((p) => pathname === p)) {
        return NextResponse.next();
    }

    // Allow static assets and Next.js internals
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.endsWith('.ico') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js')
    ) {
        return NextResponse.next();
    }

    // Allow all API routes EXCEPT /api/config and /api/webhook/send (those need auth)
    // The data-serving APIs (/api/customer, /api/account, etc.) should work without auth
    if (
        pathname.startsWith(API_PREFIX) &&
        !pathname.startsWith('/api/config') &&
        !pathname.startsWith('/api/webhook/send')
    ) {
        return NextResponse.next();
    }

    // Verify session for protected routes
    const sessionCookie = request.cookies.get('aml_session')?.value;

    if (!sessionCookie) {
        return redirectToLogin(request);
    }

    const session = await verifySession(sessionCookie);

    if (!session) {
        const response = redirectToLogin(request);
        response.cookies.delete('aml_session');
        return response;
    }

    // If authenticated user tries to access /login, redirect to home
    if (pathname === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

function redirectToLogin(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    // For API routes, return 401 instead of redirect
    if (pathname.startsWith(API_PREFIX)) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }

    return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         */
        '/((?!_next/static|_next/image).*)',
    ],
};
