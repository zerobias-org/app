import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { reviews, providerProfiles } from '@/lib/db/schema';

/**
 * POST /api/providers/[id]/reviews
 *
 * Submit a review for a provider (looked up by slug).
 * Reviews are moderated — saved with approved: false by default.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, reviewText, reviewerZerobiasUserId } = body;

    if (!reviewerZerobiasUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Find provider by slug
    const provider = await db.query.providerProfiles.findFirst({
      where: eq(providerProfiles.slug, id),
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Prevent self-review
    if (provider.zerobiasUserId === reviewerZerobiasUserId) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 });
    }

    const [review] = await db.insert(reviews).values({
      providerId: provider.id,
      reviewerZerobiasUserId,
      rating,
      reviewText: reviewText || null,
      approved: false,
    }).returning();

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Review POST error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
