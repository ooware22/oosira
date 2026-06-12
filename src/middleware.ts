import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * F-13 · Server-side route protection middleware
 * 
 * Ensures /admin and /dashboard are protected at the Edge (server-side),
 * NOT just via client-side redirects. This prevents unauthenticated users
 * from accessing protected HTML even if JS is disabled or intercepted.
 */

const PROTECTED_ROUTES = ['/admin', '/dashboard'];
const AUTH_COOKIE_NAME = 'oosira_session'; // adjust to your actual cookie name
const LOGIN_URL = '/login';

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Check if the route requires authentication ──
  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    // Check for session cookie (server-side, not localStorage)
    const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!sessionToken) {
      // Redirect to login with return URL
      const loginUrl = new URL(LOGIN_URL, request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Optional: validate token structure (basic check — full validation
    // should happen in API routes or backend)
    // For now, presence of cookie is sufficient for the middleware layer.
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
