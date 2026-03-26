import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl.pathname;

    const userToken = request.cookies.get('auth_token')?.value;
    const publicProtectedPaths = ['/user', '/sesizari/nou'];
    const isPublicProtectedRoute = publicProtectedPaths.some((path) => url.startsWith(path));

    if (isPublicProtectedRoute && !userToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (url.startsWith('/admin/login')) {
        return NextResponse.next();
    }

    const adminToken = request.cookies.get('admin_token')?.value;
    const adminProtectedPaths = ['/admin'];
    const isAdminProtectedRoute = adminProtectedPaths.some((path) => url.startsWith(path));

    if (isAdminProtectedRoute && !adminToken) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'],
};