import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerFrameworks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/profile/frameworks
 *
 * Add a framework to a provider profile.
 * Body: { providerId, zerobiasFrameworkId, proficiencyLevel?, yearsExperience?, assessorCertified?, implementationExperience?, auditExperience? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      zerobiasFrameworkId,
      proficiencyLevel,
      yearsExperience,
      assessorCertified,
      implementationExperience,
      auditExperience,
    } = body;

    if (!providerId || !zerobiasFrameworkId) {
      return NextResponse.json(
        { error: 'providerId and zerobiasFrameworkId required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.query.providerFrameworks.findFirst({
      where: and(
        eq(providerFrameworks.providerId, providerId),
        eq(providerFrameworks.zerobiasFrameworkId, zerobiasFrameworkId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Framework already added to profile' },
        { status: 409 }
      );
    }

    const [framework] = await db.insert(providerFrameworks)
      .values({
        providerId,
        zerobiasFrameworkId,
        proficiencyLevel: proficiencyLevel || null,
        yearsExperience: yearsExperience || null,
        assessorCertified: assessorCertified || false,
        implementationExperience: implementationExperience || false,
        auditExperience: auditExperience || false,
      })
      .returning();

    return NextResponse.json(framework, { status: 201 });
  } catch (error) {
    console.error('Frameworks POST error:', error);
    return NextResponse.json({ error: 'Failed to add framework' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/frameworks
 *
 * Update a framework by ID.
 * Body: { frameworkId, proficiencyLevel?, yearsExperience?, assessorCertified?, implementationExperience?, auditExperience? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      frameworkId,
      proficiencyLevel,
      yearsExperience,
      assessorCertified,
      implementationExperience,
      auditExperience,
    } = body;

    if (!frameworkId) {
      return NextResponse.json({ error: 'frameworkId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (proficiencyLevel !== undefined) updateData.proficiencyLevel = proficiencyLevel || null;
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience || null;
    if (assessorCertified !== undefined) updateData.assessorCertified = assessorCertified;
    if (implementationExperience !== undefined) updateData.implementationExperience = implementationExperience;
    if (auditExperience !== undefined) updateData.auditExperience = auditExperience;

    const [updated] = await db.update(providerFrameworks)
      .set(updateData)
      .where(eq(providerFrameworks.id, frameworkId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Frameworks PUT error:', error);
    return NextResponse.json({ error: 'Failed to update framework' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/frameworks?frameworkId=X
 *
 * Remove a framework by ID.
 */
export async function DELETE(request: NextRequest) {
  const frameworkId = request.nextUrl.searchParams.get('frameworkId');

  if (!frameworkId) {
    return NextResponse.json({ error: 'frameworkId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(providerFrameworks)
      .where(eq(providerFrameworks.id, frameworkId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Frameworks DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete framework' }, { status: 500 });
  }
}
