import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * App Setting type with parsed value
 */
interface AppSetting {
  key: string;
  value: unknown;
  description: string | null;
  category: string | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}

/**
 * Parse stored JSON value safely
 */
function parseValue(rawValue: string): unknown {
  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue;
  }
}

/**
 * GET /api/admin/settings
 *
 * Returns all app settings with parsed values.
 * Optionally filter by category: ?category=marketplace
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let settings;
    if (category) {
      settings = await db.query.appSettings.findMany({
        where: eq(appSettings.category, category),
      });
    } else {
      settings = await db.query.appSettings.findMany();
    }

    // Parse JSON values
    const parsed: AppSetting[] = settings.map((s) => ({
      key: s.key,
      value: parseValue(s.value),
      description: s.description,
      category: s.category,
      updatedAt: s.updatedAt,
      updatedBy: s.updatedBy,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Admin settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings
 *
 * Update one or more settings.
 * Body: { settings: [{ key: string, value: any }] }
 */
export async function PUT(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { settings: updates } = body as { settings: { key: string; value: unknown }[] };

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Missing settings array' }, { status: 400 });
    }

    const userId = request.headers.get('x-zerobias-user-id') || 'unknown';
    const results: AppSetting[] = [];

    for (const update of updates) {
      const { key, value } = update;
      if (!key) continue;

      // Upsert: update if exists, insert if not
      const existing = await db.query.appSettings.findFirst({
        where: eq(appSettings.key, key),
      });

      const stringValue = JSON.stringify(value);

      if (existing) {
        const [updated] = await db
          .update(appSettings)
          .set({
            value: stringValue,
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(appSettings.key, key))
          .returning();

        results.push({
          ...updated,
          value: parseValue(updated.value),
        });
      } else {
        const [inserted] = await db
          .insert(appSettings)
          .values({
            key,
            value: stringValue,
            updatedBy: userId,
          })
          .returning();

        results.push({
          ...inserted,
          value: parseValue(inserted.value),
        });
      }
    }

    return NextResponse.json({ updated: results });
  } catch (error) {
    console.error('Admin settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
