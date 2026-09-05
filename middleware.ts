import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('gym_session')?.value;
  const { pathname } = request.nextUrl;

  let session: { userId: string; role: 'MEMBER' | 'ADMIN'; email: string } | null = null;

  if (token) {
    try {
      // Decode JWT payload in Edge runtime using atob
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        session = JSON.parse(decodedJson);
      }
    } catch {
      session = null;
    }
  }

  // 1. Logged-in user trying to access public landing, login, or register pages
  if (session && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    if (session.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. Unauthenticated user trying to access protected routes
  const protectedRoutes = ['/dashboard', '/admin', '/book-slot', '/my-bookings', '/attendance', '/profile'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Regular member trying to access admin control center
  if (session && session.role !== 'ADMIN' && (pathname === '/admin' || pathname.startsWith('/admin/'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/admin/:path*',
    '/book-slot/:path*',
    '/my-bookings/:path*',
    '/attendance/:path*',
    '/profile/:path*',
  ],
};
