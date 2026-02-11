/**
 * Server-side ZeroBias SDK connection helper.
 *
 * Creates a connected SDK instance using environment variables.
 * Use in API routes only (requires NEXT_PUBLIC_API_HOSTNAME, ZEROBIAS_API_KEY, NEXT_PUBLIC_DEFAULT_ORG_ID).
 *
 * IMPORTANT: Always call sdk.disconnect() when done.
 */

import { newZerobiasSdk } from '@zerobias-com/zerobias-sdk';
import { SdkConnectionProfile, URL as ZbURL, UUID } from '@zerobias-org/types-core-js';

const API_HOSTNAME = process.env.NEXT_PUBLIC_API_HOSTNAME;
const API_KEY = process.env.ZEROBIAS_API_KEY || process.env.NEXT_PUBLIC_API_KEY;
const ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

export async function getConnectedSdk() {
  if (!API_HOSTNAME || !API_KEY || !ORG_ID) {
    throw new Error('Missing API configuration (NEXT_PUBLIC_API_HOSTNAME, ZEROBIAS_API_KEY, or NEXT_PUBLIC_DEFAULT_ORG_ID)');
  }

  const sdk = newZerobiasSdk();
  const url = new ZbURL(API_HOSTNAME);
  const connectionProfile = new SdkConnectionProfile(
    url,
    API_KEY,
    undefined, // jwt
    ORG_ID as unknown as UUID
  );

  await sdk.connect(connectionProfile);
  return sdk;
}
