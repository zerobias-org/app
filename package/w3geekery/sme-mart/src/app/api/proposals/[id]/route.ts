import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { proposals, workRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateEngagementTag } from '@/lib/bip39-tags';
import { getConnectedSdk } from '@/lib/zerobias-sdk';

/**
 * PUT /api/proposals/[id]
 *
 * Update proposal status.
 * - Buyer accepts/rejects: { status: 'accepted' | 'rejected', buyerZerobiasUserId }
 * - Provider withdraws: { status: 'withdrawn', providerId }
 *
 * When a proposal is accepted:
 * 1. Generate BIP39 engagement tag (ENG-word-word)
 * 2. Create ZeroBias Tag (graduates RFP → Engagement)
 * 3. Set engagement status to 'in_progress'
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, buyerZerobiasUserId, providerId } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
      with: { request: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Provider withdrawing their own proposal
    if (status === 'withdrawn') {
      if (!providerId || proposal.providerId !== providerId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      if (proposal.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending proposals can be withdrawn' },
          { status: 400 }
        );
      }

      const [updated] = await db.update(proposals)
        .set({ status: 'withdrawn' })
        .where(eq(proposals.id, id))
        .returning();

      return NextResponse.json(updated);
    }

    // Buyer accepting or rejecting
    if (status === 'accepted' || status === 'rejected') {
      if (!buyerZerobiasUserId) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Verify buyer owns the engagement
      if (!proposal.request || proposal.request.buyerZerobiasUserId !== buyerZerobiasUserId) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      if (proposal.status !== 'pending') {
        return NextResponse.json(
          { error: 'Only pending proposals can be accepted or rejected' },
          { status: 400 }
        );
      }

      const [updated] = await db.update(proposals)
        .set({ status })
        .where(eq(proposals.id, id))
        .returning();

      // When accepted: generate engagement tag, create ZeroBias Tag, graduate RFP → Engagement
      if (status === 'accepted' && proposal.requestId) {
        const engagementTag = generateEngagementTag();
        let zerobiasTagId: string | null = null;

        try {
          const sdk = await getConnectedSdk();
          // STANDUP: discuss adding 'engagement' tag type (currently using 'other')
          // STANDUP: discuss org-scoped vs user-scoped tags
          const tag = await sdk.danaOld.getTagApi().createTag({
            name: engagementTag,
            description: `Engagement: ${proposal.request?.title || 'Untitled'}`,
            type: 'other' as unknown as import('@zerobias-org/types-core-js').Nmtoken,
          });
          zerobiasTagId = String(tag.id);
          await sdk.disconnect();
        } catch (err) {
          console.error('Failed to create ZeroBias tag on acceptance:', err);
        }

        await db.update(workRequests)
          .set({ status: 'in_progress', engagementTag, zerobiasTagId })
          .where(eq(workRequests.id, proposal.requestId));
      }

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  } catch (error) {
    console.error('Proposal PUT error:', error);
    return NextResponse.json({ error: 'Failed to update proposal' }, { status: 500 });
  }
}

/**
 * DELETE /api/proposals/[id]
 *
 * Provider deletes their own pending proposal.
 * Query: ?providerId=xxx
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const providerId = request.nextUrl.searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'providerId is required' }, { status: 400 });
    }

    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.providerId !== providerId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (proposal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending proposals can be deleted' },
        { status: 400 }
      );
    }

    await db.delete(proposals).where(eq(proposals.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Proposal DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete proposal' }, { status: 500 });
  }
}
