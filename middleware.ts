import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Webhook routes - always allow (no auth)
  if (pathname.startsWith('/api/msg91-webhook') || pathname.startsWith('/api/chatwoot-webhook') || pathname.startsWith('/api/widget-chat')) {
    return NextResponse.next();
  }

  // Public routes (SaaS: no manual approval needed)
  if (pathname === '/login' || pathname === '/not-authorized' || pathname.startsWith('/onboarding') || pathname.startsWith('/pricing')) {
    return NextResponse.next();
  }

  // Static assets
  if (pathname.startsWith('/logo') || pathname.startsWith('/ai-nexus') || pathname === '/manifest.json' || pathname === '/widget.js') {
    return NextResponse.next();
  }

  // Protected routes: require firebase-token cookie
  const token = request.cookies.get('firebase-token')?.value;
  if (!token && !pathname.startsWith('/api/')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
