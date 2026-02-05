import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerSegments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/profile/segments
 *
 * Add a market segment to a provider profile.
 * Body: { providerId, zerobiasSegmentId, isPrimary? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, zerobiasSegmentId, isPrimary } = body;

    if (!providerId || !zerobiasSegmentId) {
      return NextResponse.json(
        { error: 'providerId and zerobiasSegmentId required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.query.providerSegments.findFirst({
      where: and(
        eq(providerSegments.providerId, providerId),
        eq(providerSegments.zerobiasSegmentId, zerobiasSegmentId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Segment already added to profile' },
        { status: 409 }
      );
    }

    // If setting as primary, unset other primary segments
    if (isPrimary) {
      await db.update(providerSegments)
        .set({ isPrimary: false })
        .where(eq(providerSegments.providerId, providerId));
    }

    const [segment] = await db.insert(providerSegments)
      .values({
        providerId,
        zerobiasSegmentId,
        isPrimary: isPrimary || false,
      })
      .returning();

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error('Segments POST error:', error);
    return NextResponse.json({ error: 'Failed to add segment' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/segments
 *
 * Update a segment by ID.
 * Body: { segmentId, isPrimary? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { segmentId, isPrimary, providerId } = body;

    if (!segmentId) {
      return NextResponse.json({ error: 'segmentId required' }, { status: 400 });
    }

    // If setting as primary, unset other primary segments
    if (isPrimary && providerId) {
      await db.update(providerSegments)
        .set({ isPrimary: false })
        .where(eq(providerSegments.providerId, providerId));
    }

    const updateData: Record<string, unknown> = {};
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;

    const [updated] = await db.update(providerSegments)
      .set(updateData)
      .where(eq(providerSegments.id, segmentId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Segments PUT error:', error);
    return NextResponse.json({ error: 'Failed to update segment' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/segments?segmentId=X
 *
 * Remove a segment by ID.
 */
export async function DELETE(request: NextRequest) {
  const segmentId = request.nextUrl.searchParams.get('segmentId');

  if (!segmentId) {
    return NextResponse.json({ error: 'segmentId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(providerSegments)
      .where(eq(providerSegments.id, segmentId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Segments DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 });
  }
}
