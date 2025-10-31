import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy to avoid CORS issues in local development
 * Forwards requests to the Zerobias API server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'DELETE');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest(request, params.path, 'PATCH');
}

async function proxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  const API_BASE = process.env.NEXT_PUBLIC_API_HOSTNAME || 'https://ci.zerobias.com/api';
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  // Reconstruct the path
  const path = pathSegments.join('/');

  // Preserve query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${API_BASE}/${path}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[Proxy] ${method} ${url}`);

  try {
    // Get request body if present
    let body = null;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.json();
      } catch {
        // No body or invalid JSON
      }
    }

    // Forward the request
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY ? `APIKey ${API_KEY}` : '',
        // Forward other relevant headers
        ...(request.headers.get('dana-org-id') && {
          'dana-org-id': request.headers.get('dana-org-id')!
        })
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  } catch (error: any) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Proxy request failed' },
      { status: 500 }
    );
  }
}
