import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerServiceSegments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/profile/service-segments
 *
 * Add a service segment (professional service category) to a provider profile.
 * Body: { providerId, zerobiasServiceSegmentId, isPrimary? }
 *
 * Service segments come from ZeroBias tags API: GET /platform/tags?tagTypes=service-segment
 * Examples: soc, pentesting, compliance, risk, training, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, zerobiasServiceSegmentId, isPrimary } = body;

    if (!providerId || !zerobiasServiceSegmentId) {
      return NextResponse.json(
        { error: 'providerId and zerobiasServiceSegmentId required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.query.providerServiceSegments.findFirst({
      where: and(
        eq(providerServiceSegments.providerId, providerId),
        eq(providerServiceSegments.zerobiasServiceSegmentId, zerobiasServiceSegmentId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Service segment already added to profile' },
        { status: 409 }
      );
    }

    // If setting as primary, unset other primary service segments
    if (isPrimary) {
      await db.update(providerServiceSegments)
        .set({ isPrimary: false })
        .where(eq(providerServiceSegments.providerId, providerId));
    }

    const [serviceSegment] = await db.insert(providerServiceSegments)
      .values({
        providerId,
        zerobiasServiceSegmentId,
        isPrimary: isPrimary || false,
      })
      .returning();

    return NextResponse.json(serviceSegment, { status: 201 });
  } catch (error) {
    console.error('Service Segments POST error:', error);
    return NextResponse.json({ error: 'Failed to add service segment' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/service-segments
 *
 * Update a service segment by ID.
 * Body: { serviceSegmentId, isPrimary? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceSegmentId, isPrimary, providerId } = body;

    if (!serviceSegmentId) {
      return NextResponse.json({ error: 'serviceSegmentId required' }, { status: 400 });
    }

    // If setting as primary, unset other primary service segments
    if (isPrimary && providerId) {
      await db.update(providerServiceSegments)
        .set({ isPrimary: false })
        .where(eq(providerServiceSegments.providerId, providerId));
    }

    const updateData: Record<string, unknown> = {};
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

    const [updated] = await db.update(providerServiceSegments)
      .set(updateData)
      .where(eq(providerServiceSegments.id, serviceSegmentId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Service segment not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Service Segments PUT error:', error);
    return NextResponse.json({ error: 'Failed to update service segment' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/service-segments?serviceSegmentId=X
 *
 * Remove a service segment by ID.
 */
export async function DELETE(request: NextRequest) {
  const serviceSegmentId = request.nextUrl.searchParams.get('serviceSegmentId');

  if (!serviceSegmentId) {
    return NextResponse.json({ error: 'serviceSegmentId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(providerServiceSegments)
      .where(eq(providerServiceSegments.id, serviceSegmentId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Service segment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Service Segments DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service segment' }, { status: 500 });
  }
}
