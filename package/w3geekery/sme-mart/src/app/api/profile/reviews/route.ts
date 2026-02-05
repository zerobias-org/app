import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reviews, providerProfiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/profile/reviews?providerId=X
 *
 * Returns ALL reviews for the provider (both approved and pending).
 * Used by the profile owner for moderation.
 */
export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get('providerId');

  if (!providerId) {
    return NextResponse.json({ error: 'providerId required' }, { status: 400 });
  }

  try {
    const allReviews = await db.query.reviews.findMany({
      where: eq(reviews.providerId, providerId),
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });

    return NextResponse.json(allReviews);
  } catch (error) {
    console.error('Profile reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/reviews
 *
 * Approve or reject a review. Only the provider (or admin) should call this.
 * Body: { reviewId, approved, approvedBy }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { reviewId, approved, approvedBy, reset } = body;

    if (!reviewId) {
      return NextResponse.json({ error: 'reviewId required' }, { status: 400 });
    }

    // Reset to pending — clear approval state
    if (reset) {
      const [updated] = await db.update(reviews)
        .set({
          approved: false,
          approvedAt: null,
          approvedBy: null,
        })
        .where(eq(reviews.id, reviewId))
        .returning();

      if (!updated) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }
      return NextResponse.json(updated);
    }

    // Approve or reject
    if (typeof approved !== 'boolean' || !approvedBy) {
      return NextResponse.json({ error: 'approved (boolean) and approvedBy required' }, { status: 400 });
    }

    const [updated] = await db.update(reviews)
      .set({
        approved,
        approvedAt: new Date(),
        approvedBy,
      })
      .where(eq(reviews.id, reviewId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Profile reviews PUT error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}
