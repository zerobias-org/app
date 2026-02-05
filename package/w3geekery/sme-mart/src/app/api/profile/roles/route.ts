import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerRoles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/profile/roles
 *
 * Add a role to provider profile.
 * Body: { providerId, zerobiasRoleId, isPrimary?, yearsInRole? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, zerobiasRoleId, isPrimary, yearsInRole } = body;

    if (!providerId || !zerobiasRoleId) {
      return NextResponse.json(
        { error: 'providerId and zerobiasRoleId required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.query.providerRoles.findFirst({
      where: and(
        eq(providerRoles.providerId, providerId),
        eq(providerRoles.zerobiasRoleId, zerobiasRoleId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Role already added to profile' },
        { status: 409 }
      );
    }

    // If setting as primary, unset other primary roles first
    if (isPrimary) {
      await db.update(providerRoles)
        .set({ isPrimary: false })
        .where(eq(providerRoles.providerId, providerId));
    }

    const [newRole] = await db.insert(providerRoles)
      .values({
        providerId,
        zerobiasRoleId,
        isPrimary: isPrimary ?? false,
        yearsInRole: yearsInRole ?? null,
      })
      .returning();

    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    console.error('Role POST error:', error);
    return NextResponse.json({ error: 'Failed to add role' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/roles
 *
 * Update a role on provider profile.
 * Body: { roleId, isPrimary?, yearsInRole? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roleId, isPrimary, yearsInRole, providerId } = body;

    if (!roleId) {
      return NextResponse.json({ error: 'roleId required' }, { status: 400 });
    }

    // If setting as primary, unset other primary roles first
    if (isPrimary && providerId) {
      await db.update(providerRoles)
        .set({ isPrimary: false })
        .where(eq(providerRoles.providerId, providerId));
    }

    const [updated] = await db.update(providerRoles)
      .set({
        isPrimary: isPrimary ?? undefined,
        yearsInRole: yearsInRole ?? undefined,
      })
      .where(eq(providerRoles.id, roleId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Role PUT error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/roles?roleId=X
 *
 * Remove a role from provider profile.
 */
export async function DELETE(request: NextRequest) {
  const roleId = request.nextUrl.searchParams.get('roleId');

  if (!roleId) {
    return NextResponse.json({ error: 'roleId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(providerRoles)
      .where(eq(providerRoles.id, roleId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Role DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
