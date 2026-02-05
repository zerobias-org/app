import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/providers
 *
 * Returns all provider profiles with skills and service offerings.
 *
 * Query params:
 * - category: Filter by service offering category
 * - include: 'all' to include full catalog relationships (roles, products, frameworks, segments)
 */
export async function GET(request: NextRequest) {
  try {
    const includeAll = request.nextUrl.searchParams.get('include') === 'all';

    // Build the `with` clause based on include param
    const withClause = includeAll
      ? {
          skills: true,
          roles: true,
          products: true,
          frameworks: true,
          segments: true,
          serviceOfferings: true,
        }
      : {
          skills: true,
          serviceOfferings: true,
        };

    const providers = await db.query.providerProfiles.findMany({
      with: withClause,
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
