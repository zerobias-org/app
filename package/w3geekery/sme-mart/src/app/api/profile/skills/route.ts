import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerSkills } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/profile/skills
 *
 * Add a skill to a provider profile.
 * Body: { providerId, zerobiasSkillId, skillName, proficiencyLevel?, yearsExperience? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, zerobiasSkillId, skillName, proficiencyLevel, yearsExperience } = body;

    if (!providerId || !zerobiasSkillId || !skillName) {
      return NextResponse.json(
        { error: 'providerId, zerobiasSkillId, and skillName required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.query.providerSkills.findFirst({
      where: and(
        eq(providerSkills.providerId, providerId),
        eq(providerSkills.zerobiasSkillId, zerobiasSkillId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Skill already added to profile' },
        { status: 409 }
      );
    }

    const [skill] = await db.insert(providerSkills)
      .values({
        providerId,
        zerobiasSkillId,
        skillName,
        proficiencyLevel: proficiencyLevel || null,
        yearsExperience: yearsExperience || null,
      })
      .returning();

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error('Skills POST error:', error);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/skills
 *
 * Update a skill by ID.
 * Body: { skillId, zerobiasSkillId?, skillName?, proficiencyLevel?, yearsExperience? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { skillId, zerobiasSkillId, skillName, proficiencyLevel, yearsExperience } = body;

    if (!skillId) {
      return NextResponse.json({ error: 'skillId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (zerobiasSkillId !== undefined) updateData.zerobiasSkillId = zerobiasSkillId;
    if (skillName !== undefined) updateData.skillName = skillName;
    if (proficiencyLevel !== undefined) updateData.proficiencyLevel = proficiencyLevel || null;
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience || null;

    const [updated] = await db.update(providerSkills)
      .set(updateData)
      .where(eq(providerSkills.id, skillId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Skills PUT error:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/skills?skillId=X
 *
 * Remove a skill by ID.
 */
export async function DELETE(request: NextRequest) {
  const skillId = request.nextUrl.searchParams.get('skillId');

  if (!skillId) {
    return NextResponse.json({ error: 'skillId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(providerSkills)
      .where(eq(providerSkills.id, skillId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Skills DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
