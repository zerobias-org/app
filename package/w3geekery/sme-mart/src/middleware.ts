import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js middleware that injects ZeroBias auth headers server-side.
 *
 * In proxy mode, the browser sends requests to /dana/* and /session/* which
 * Next.js rewrites proxy to the ZeroBias host. This middleware adds the
 * Authorization header using a server-only env var (ZEROBIAS_API_KEY) so
 * the API key never reaches the browser bundle.
 *
 * If ZEROBIAS_API_KEY is not set (e.g., production/session mode), passes through.
 */
export function middleware(request: NextRequest) {
  const apiKey = process.env.ZEROBIAS_API_KEY;

  // No API key configured — pass through (production uses session cookies)
  if (!apiKey) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Authorization', `APIKey ${apiKey}`);

  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
  if (orgId && !requestHeaders.has('dana-org-id')) {
    requestHeaders.set('dana-org-id', orgId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/dana/:path*', '/session/:path*'],
};
