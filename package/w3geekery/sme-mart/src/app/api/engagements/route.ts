import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workRequests } from '@/lib/db/schema';
import { getConnectedSdk } from '@/lib/zerobias-sdk';

// Default "Task" activity in ZeroBias (Software Development Lifecycle workflow)
const DEFAULT_TASK_ACTIVITY_ID = '5583de55-e303-49fb-a671-2591e6d8ced5';

/**
 * Build markdown description for the ZeroBias Task.
 * Includes a "Suggested Custom Fields" section for fields that will
 * eventually become Activity-defined custom fields.
 */
function buildTaskDescription(params: {
  title: string;
  description?: string | null;
  category: string;
  budgetType?: string | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
  timeline?: string | null;
}): string {
  const budgetRange = params.budgetMin && params.budgetMax
    ? `$${params.budgetMin} – $${params.budgetMax}`
    : params.budgetMax
      ? `Up to $${params.budgetMax}`
      : params.budgetMin
        ? `From $${params.budgetMin}`
        : 'Not specified';

  const lines = [
    '## RFP Details',
    '',
    `**Category:** ${params.category}`,
    `**Budget:** ${params.budgetType || 'Not specified'} — ${budgetRange}`,
    `**Timeline:** ${params.timeline || 'Not specified'}`,
    '',
    '## Description',
    '',
    params.description || '_No description provided._',
    '',
    '## Suggested Custom Fields',
    '',
    'These fields should become Activity-defined custom fields in a future Task Activity:',
    '',
    '- **Category** — Service category (Assessors, Advisors, Agentic, etc.)',
    '- **Budget Type** — fixed / hourly / negotiable',
    '- **Budget Min** — Minimum budget amount',
    '- **Budget Max** — Maximum budget amount',
    '- **Timeline** — Expected delivery timeline',
    '- **Engagement Tag** — BIP39 identifier (e.g., ENG-ocean-tiger)',
    '- **Engagement Status** — draft / open / in_progress / completed / cancelled',
    '- **Buyer Org** — ZeroBias org ID of the buyer',
  ];

  return lines.join('\n');
}

/**
 * GET /api/engagements
 *
 * Returns all engagements (RFPs + Engagements), newest first.
 * Includes proposals summary (id, providerId, status) for browse page filtering.
 * Optional: ?status=open&category=Assessors
 */
export async function GET(request: NextRequest) {
  try {
    const allEngagements = await db.query.workRequests.findMany({
      orderBy: (r, { desc }) => [desc(r.createdAt)],
      with: {
        proposals: {
          columns: { id: true, providerId: true, status: true },
        },
      },
    });

    let result = allEngagements;

    const status = request.nextUrl.searchParams.get('status');
    if (status) {
      result = result.filter((r) => r.status === status);
    }

    const category = request.nextUrl.searchParams.get('category');
    if (category) {
      result = result.filter((r) => r.category === category);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Engagements GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch engagements' }, { status: 500 });
  }
}

/**
 * POST /api/engagements
 *
 * Create a new RFP (Request for Proposal) with a ZeroBias Task.
 * The engagement tag and ZeroBias Tag are created later when a proposal is accepted.
 *
 * Body: { buyerZerobiasUserId, buyerZerobiasOrgId?, title, description?, category,
 *         budgetType?, budgetMin?, budgetMax?, timeline? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      buyerZerobiasUserId,
      buyerZerobiasOrgId,
      title,
      description,
      category,
      budgetType,
      budgetMin,
      budgetMax,
      timeline,
    } = body;

    if (!buyerZerobiasUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (!title || !category) {
      return NextResponse.json({ error: 'Title and category are required' }, { status: 400 });
    }

    // Attempt ZeroBias Task creation (non-blocking — RFP still creates if this fails)
    let zerobiasTaskId: string | null = null;
    const warnings: string[] = [];

    try {
      const sdk = await getConnectedSdk();

      try {
        const taskDescription = buildTaskDescription({
          title, description, category, budgetType, budgetMin, budgetMax, timeline,
        });

        const task = await sdk.platform.getTaskApi().create({
          activityId: DEFAULT_TASK_ACTIVITY_ID as unknown as import('@zerobias-org/types-core-js').UUID,
          name: `[RFP] ${title}`,
          description: taskDescription,
          approvers: [],
          notified: [],
          links: [],
        });
        zerobiasTaskId = String(task.id);
      } catch (taskError) {
        console.error('Failed to create ZeroBias task:', taskError);
        warnings.push('ZeroBias task creation failed');
      }

      await sdk.disconnect();
    } catch (sdkError) {
      console.error('Failed to connect ZeroBias SDK:', sdkError);
      warnings.push('ZeroBias SDK connection failed');
    }

    // Create RFP in Neon (always succeeds even if ZB calls failed)
    // engagementTag and zerobiasTagId stay null until a proposal is accepted
    const [created] = await db.insert(workRequests).values({
      buyerZerobiasUserId,
      buyerZerobiasOrgId: buyerZerobiasOrgId || null,
      title,
      description: description || null,
      category,
      budgetType: budgetType || null,
      budgetMin: budgetMin || null,
      budgetMax: budgetMax || null,
      timeline: timeline || null,
      status: 'open',
      zerobiasTaskId,
    }).returning();

    const response: Record<string, unknown> = { ...created };
    if (warnings.length > 0) {
      response.warnings = warnings;
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Engagements POST error:', error);
    return NextResponse.json({ error: 'Failed to create RFP' }, { status: 500 });
  }
}
