import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/** Generate a URL-friendly slug from a display name */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * GET /api/profile?zerobiasUserId=X&displayName=Y&zerobiasOrgId=Z
 *
 * Upsert: finds provider profile by zerobiasUserId.
 * - If missing, creates one with ZeroBias identity data.
 * - If found, updates identity fields (displayName, orgId) if changed.
 * - Returns profile with related skills and serviceOfferings.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const zerobiasUserId = searchParams.get('zerobiasUserId');
  const displayName = searchParams.get('displayName') || 'Unknown User';
  const zerobiasOrgId = searchParams.get('zerobiasOrgId') || null;

  if (!zerobiasUserId) {
    return NextResponse.json({ error: 'zerobiasUserId required' }, { status: 400 });
  }

  try {
    // Check if profile exists
    const existing = await db.query.providerProfiles.findFirst({
      where: eq(providerProfiles.zerobiasUserId, zerobiasUserId),
      with: {
        skills: true,
        serviceOfferings: true,
      },
    });

    if (existing) {
      // Update identity fields from ZeroBias if they changed
      if (existing.displayName !== displayName || existing.zerobiasOrgId !== zerobiasOrgId) {
        await db.update(providerProfiles)
          .set({
            displayName,
            zerobiasOrgId,
            updatedAt: new Date(),
          })
          .where(eq(providerProfiles.zerobiasUserId, zerobiasUserId));

        return NextResponse.json({ ...existing, displayName, zerobiasOrgId });
      }

      return NextResponse.json(existing);
    }

    // Create new profile seeded with ZeroBias identity data
    let slug = generateSlug(displayName);
    // Ensure slug uniqueness by appending a suffix if needed
    const slugConflict = await db.query.providerProfiles.findFirst({
      where: eq(providerProfiles.slug, slug),
    });
    if (slugConflict) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const [newProfile] = await db.insert(providerProfiles)
      .values({
        zerobiasUserId,
        zerobiasOrgId,
        slug,
        displayName,
        availabilityStatus: 'available',
      })
      .returning();

    return NextResponse.json({ ...newProfile, skills: [], serviceOfferings: [] });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * PUT /api/profile
 *
 * Updates marketplace-specific fields on the provider profile.
 * ZeroBias identity fields (displayName, orgId) are managed by the GET upsert.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { zerobiasUserId, headline, about, hourlyRate, availabilityStatus, responseTime } = body;

    if (!zerobiasUserId) {
      return NextResponse.json({ error: 'zerobiasUserId required' }, { status: 400 });
    }

    const [updated] = await db.update(providerProfiles)
      .set({
        headline: headline ?? undefined,
        about: about ?? undefined,
        hourlyRate: hourlyRate ?? undefined,
        availabilityStatus: availabilityStatus ?? undefined,
        responseTime: responseTime ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(providerProfiles.zerobiasUserId, zerobiasUserId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
