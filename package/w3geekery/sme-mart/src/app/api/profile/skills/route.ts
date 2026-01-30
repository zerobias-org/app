import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerSkills } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/profile/skills
 *
 * Add a skill to a provider profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, skillName, skillCategory, proficiencyLevel, yearsExperience } = body;

    if (!providerId || !skillName) {
      return NextResponse.json({ error: 'providerId and skillName required' }, { status: 400 });
    }

    const [skill] = await db.insert(providerSkills)
      .values({
        providerId,
        skillName,
        skillCategory: skillCategory || null,
        proficiencyLevel: proficiencyLevel || null,
        yearsExperience: yearsExperience || null,
      })
      .returning();

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Skills POST error:', error);
    return NextResponse.json({ error: 'Failed to add skill' }, { status: 500 });
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
