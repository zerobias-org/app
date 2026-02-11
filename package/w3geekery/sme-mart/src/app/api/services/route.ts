import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { serviceOfferings } from '@/lib/db/schema';

/**
 * GET /api/services
 *
 * Returns all active service offerings with their provider info.
 * Optional: ?category=Assessors — filter by category.
 * Optional: ?include=provider — include full provider catalog relationships for filtering.
 */
export async function GET(request: NextRequest) {
  try {
    const include = request.nextUrl.searchParams.get('include');
    const includeProviderCatalog = include === 'provider';

    const services = await db.query.serviceOfferings.findMany({
      where: eq(serviceOfferings.isActive, true),
      with: {
        provider: includeProviderCatalog
          ? {
              with: {
                skills: true,
                roles: true,
                products: true,
                frameworks: true,
                segments: true,
              },
            }
          : true,
      },
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    const category = request.nextUrl.searchParams.get('category');
    if (category) {
      const filtered = services.filter((s) => s.category === category);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(services);
  } catch (error) {
    console.error('Services GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
