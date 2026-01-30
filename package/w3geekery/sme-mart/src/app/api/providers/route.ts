import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/providers
 *
 * Returns all provider profiles with skills and service offerings.
 * Optional: ?category=Assessors — filters by service offering category.
 */
export async function GET(request: NextRequest) {
  try {
    const providers = await db.query.providerProfiles.findMany({
      with: {
        skills: true,
        serviceOfferings: true,
      },
      orderBy: (profiles, { desc }) => [desc(profiles.ratingAverage)],
    });

    // Optional category filter — match on service offering category
    const category = request.nextUrl.searchParams.get('category');
    if (category) {
      const filtered = providers.filter((p) =>
        p.serviceOfferings.some((s) => s.category === category)
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Providers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
