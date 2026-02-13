import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { marketplaceUsers, providerProfiles, workRequests } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * GET /api/users
 *
 * Returns all marketplace users with role indicators (provider/buyer).
 */
export async function GET() {
  try {
    const users = await db
      .select({
        id: marketplaceUsers.id,
        zerobiasUserId: marketplaceUsers.zerobiasUserId,
        zerobiasOrgId: marketplaceUsers.zerobiasOrgId,
        displayName: marketplaceUsers.displayName,
        email: marketplaceUsers.email,
        avatarUrl: marketplaceUsers.avatarUrl,
        isProvider: sql<boolean>`EXISTS (
          SELECT 1 FROM provider_profiles pp WHERE pp.user_id = ${marketplaceUsers.id}
        )`,
        isBuyer: sql<boolean>`EXISTS (
          SELECT 1 FROM work_requests wr WHERE wr.buyer_user_id = ${marketplaceUsers.id}
        )`,
        hourlyRate: providerProfiles.hourlyRate,
        headline: providerProfiles.headline,
      })
      .from(marketplaceUsers)
      .leftJoin(providerProfiles, eq(providerProfiles.userId, marketplaceUsers.id))
      .orderBy(marketplaceUsers.displayName);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
