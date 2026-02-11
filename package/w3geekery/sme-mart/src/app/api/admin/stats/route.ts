import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerProfiles, categories, reviews } from '@/lib/db/schema';
import { isNull, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/stats
 *
 * Returns admin dashboard statistics:
 * - totalProviders: count of provider profiles
 * - totalCategories: count of categories
 * - pendingReviews: count of reviews where approvedBy IS NULL
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const [providerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(providerProfiles);

    const [categoryCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);

    const [pendingCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(isNull(reviews.approvedBy));

    return NextResponse.json({
      totalProviders: Number(providerCount.count),
      totalCategories: Number(categoryCount.count),
      pendingReviews: Number(pendingCount.count),
    });
  } catch (error) {
    console.error('Admin stats GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
