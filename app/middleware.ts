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

    const staffToken = request.cookies.get('staff_token')?.value;
    const staffProtectedPaths = ['/dashboard'];
    const isStaffProtectedRoute = staffProtectedPaths.some((path) => url.startsWith(path));

    if (isStaffProtectedRoute && !staffToken && !url.startsWith('/dashboard/login')) {
        return NextResponse.redirect(new URL('/dashboard/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$).*)'],
};