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
 * Update an engagement. Supports status changes and field edits.
 * Field edits (title, description, category, budget, timeline) only allowed in draft/open status.
 *
 * Body: { buyerZerobiasUserId, status?, title?, description?, category?,
 *         budgetType?, budgetMin?, budgetMax?, timeline? }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { buyerZerobiasUserId } = body;

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

    // Build update object
    const updates: Record<string, unknown> = {};

    // Status change is always allowed (for cancel, publish, etc.)
    if (body.status !== undefined) {
      updates.status = body.status;
    }

    // Field edits only allowed in draft or open status
    const editableFields = ['title', 'description', 'category', 'budgetType', 'budgetMin', 'budgetMax', 'timeline'];
    const hasFieldEdits = editableFields.some((f) => body[f] !== undefined);

    if (hasFieldEdits) {
      if (existing.status !== 'draft' && existing.status !== 'open') {
        return NextResponse.json(
          { error: 'Can only edit RFPs in draft or open status' },
          { status: 400 }
        );
      }

      for (const field of editableFields) {
        if (body[field] !== undefined) {
          updates[field] = body[field];
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const [updated] = await db.update(workRequests)
      .set(updates)
      .where(eq(workRequests.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Engagement PUT error:', error);
    return NextResponse.json({ error: 'Failed to update engagement' }, { status: 500 });
  }
}
