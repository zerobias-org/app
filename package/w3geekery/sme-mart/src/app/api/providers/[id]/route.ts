import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { providerProfiles } from '@/lib/db/schema';

/**
 * GET /api/providers/[id]
 *
 * Returns a single provider profile with skills, service offerings, and approved reviews.
 * Looks up by slug (e.g. "james-okafor") for friendly URLs.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const provider = await db.query.providerProfiles.findFirst({
      where: eq(providerProfiles.slug, id),
      with: {
        skills: true,
        serviceOfferings: true,
        reviews: true,
      },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Only return approved reviews to public viewers
    const approvedReviews = provider.reviews.filter((r) => r.approved);

    return NextResponse.json({
      ...provider,
      reviews: approvedReviews,
    });
  } catch (error) {
    console.error('Provider GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}
