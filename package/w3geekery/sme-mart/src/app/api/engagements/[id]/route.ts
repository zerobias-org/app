import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/engagements/[id]
 *
 * Returns a single engagement by UUID with proposals.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const engagement = await db.query.workRequests.findFirst({
      where: eq(workRequests.id, id),
      with: {
        proposals: {
          with: {
            provider: true,
          },
        },
      },
    });

    if (!engagement) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

    return NextResponse.json(engagement);
  } catch (error) {
    console.error('Engagement GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 });
  }
}

/**
 * PUT /api/engagements/[id]
 *
 * Update an engagement (status change).
 * Body: { status, buyerZerobiasUserId }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, buyerZerobiasUserId } = body;

    if (!buyerZerobiasUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify ownership
    const existing = await db.query.workRequests.findFirst({
      where: eq(workRequests.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }

    if (existing.buyerZerobiasUserId !== buyerZerobiasUserId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [updated] = await db.update(workRequests)
      .set({ status })
      .where(eq(workRequests.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Engagement PUT error:', error);
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 });
  }
}
