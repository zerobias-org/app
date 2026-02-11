import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { proposals, providerProfiles, workRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/proposals
 *
 * Create a new proposal on an open engagement.
 * Body: { requestId, providerId, coverLetter, proposedPrice, proposedTimeline }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, providerId, coverLetter, proposedPrice, proposedTimeline } = body;

    if (!requestId || !providerId) {
      return NextResponse.json(
        { error: 'requestId and providerId are required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await db.query.providerProfiles.findFirst({
      where: eq(providerProfiles.id, providerId),
    });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Verify request exists and is open
    const workRequest = await db.query.workRequests.findFirst({
      where: eq(workRequests.id, requestId),
    });
    if (!workRequest) {
      return NextResponse.json({ error: 'Engagement not found' }, { status: 404 });
    }
    if (workRequest.status !== 'open') {
      return NextResponse.json(
        { error: 'This engagement is no longer accepting proposals' },
        { status: 400 }
      );
    }

    // Check for duplicate — one proposal per provider per request
    const existing = await db.query.proposals.findFirst({
      where: and(
        eq(proposals.requestId, requestId),
        eq(proposals.providerId, providerId)
      ),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted a proposal for this engagement' },
        { status: 409 }
      );
    }

    const [created] = await db.insert(proposals).values({
      requestId,
      providerId,
      coverLetter: coverLetter || null,
      proposedPrice: proposedPrice || null,
      proposedTimeline: proposedTimeline || null,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Proposal POST error:', error);
    return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
  }
}
