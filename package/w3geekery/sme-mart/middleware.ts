// Vercel Edge Middleware — proxies /api/* requests to ZeroBias CI backend
// Injects API key and org ID server-side (never exposed to browser)

export const config = {
  matcher: '/api/:path*',
};

export default async function middleware(request: Request) {
  const target = process.env['ZB_TARGET_HOST'] || 'https://ci.zerobias.com';
  const apiKey = process.env['ZB_API_KEY'];
  const orgId = process.env['ZB_ORG_ID'];

  const url = new URL(request.url);
  const targetUrl = `${target}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);

  // Inject API key for authentication
  if (apiKey) {
    headers.set('Authorization', `APIKey ${apiKey}`);
  }

  // Inject org ID as cookie for multi-tenancy
  if (orgId) {
    const existing = headers.get('cookie') || '';
    if (!existing.includes('dana-org-id')) {
      headers.set(
        'cookie',
        existing ? `${existing}; dana-org-id=${orgId}` : `dana-org-id=${orgId}`,
      );
    }
  }

  // Remove host header so fetch sets it from target URL
  headers.delete('host');

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
