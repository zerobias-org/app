import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/reviews
 *
 * Returns ALL reviews across all providers, newest first.
 * Includes provider info via relation.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const allReviews = await db.query.reviews.findMany({
      with: {
        provider: true,
      },
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });

    return NextResponse.json(allReviews);
  } catch (error) {
    console.error('Admin reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/reviews
 *
 * Bulk approve or reject reviews.
 * Body: { reviewIds: string[], action: 'approve' | 'reject', approvedBy: string }
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { reviewIds, action, approvedBy } = body;

    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json({ error: 'reviewIds array is required' }, { status: 400 });
    }
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }
    if (!approvedBy) {
      return NextResponse.json({ error: 'approvedBy is required' }, { status: 400 });
    }

    const updated = [];
    for (const reviewId of reviewIds) {
      const [result] = await db.update(reviews)
        .set({
          approved: action === 'approve',
          approvedAt: new Date(),
          approvedBy,
        })
        .where(eq(reviews.id, reviewId))
        .returning();

      if (result) {
        updated.push(result);
      }
    }

    return NextResponse.json({ updated: updated.length, reviews: updated });
  } catch (error) {
    console.error('Admin reviews PUT error:', error);
    return NextResponse.json({ error: 'Failed to update reviews' }, { status: 500 });
  }
}
