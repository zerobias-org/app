import { NextRequest, NextResponse } from 'next/server';
import { newZerobiasSdk } from '@zerobias-com/zerobias-sdk';
import { SdkConnectionProfile, URL as ZbURL, UUID } from '@zerobias-org/types-core-js';

const API_HOSTNAME = process.env.NEXT_PUBLIC_API_HOSTNAME;
const API_KEY = process.env.ZEROBIAS_API_KEY || process.env.NEXT_PUBLIC_API_KEY;
const ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

/**
 * Server-side admin authorization guard.
 *
 * Verifies the caller is an org admin by calling the ZeroBias dana API
 * using the SDK:
 *   danaClient.getOrgApi().getRequestOrgMember(userId)
 *
 * The client must send the `x-zerobias-user-id` header with the user's ID.
 * The server validates against the dana API using the API key.
 *
 * Returns the userId if authorized, or a NextResponse error to send back.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ userId: string } | NextResponse> {
  const userId = request.headers.get('x-zerobias-user-id');

  if (!userId) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // In mock mode, skip the dana API call
  if (process.env.NEXT_PUBLIC_AUTH_MODE === 'mock') {
    return { userId };
  }

  if (!API_HOSTNAME || !API_KEY) {
    console.error('Admin auth: NEXT_PUBLIC_API_HOSTNAME or ZEROBIAS_API_KEY not configured');
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  try {
    // Create and connect SDK
    const sdk = newZerobiasSdk();

    // Create URL instance from string - SDK requires ZbURL, not a plain string
    const url = new ZbURL(API_HOSTNAME!);

    // Create connection profile with proper types
    const connectionProfile = new SdkConnectionProfile(
      url,
      API_KEY,
      undefined, // jwt
      ORG_ID ? (ORG_ID as unknown as UUID) : undefined
    );

    await sdk.connect(connectionProfile);

    try {
      // Get org member info using SDK
      const orgMember = await sdk.dana.getOrgApi().getRequestOrgMember(userId as unknown as UUID);

      if (!orgMember.admin) {
        await sdk.disconnect();
        return NextResponse.json(
          { error: 'Forbidden: not an org admin' },
          { status: 403 }
        );
      }

      await sdk.disconnect();
      return { userId };
    } catch (apiError) {
      await sdk.disconnect();
      console.warn(`Admin auth: dana API error for user ${userId}:`, apiError);
      return NextResponse.json(
        { error: 'Forbidden: not an org admin' },
        { status: 403 }
      );
    }
  } catch (err) {
    console.error('Admin auth: failed to verify admin status:', err);
    return NextResponse.json(
      { error: 'Failed to verify admin status' },
      { status: 500 }
    );
  }
}
