import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/admin-auth';

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * GET /api/admin/categories
 *
 * Returns all categories ordered by sortOrder.
 * Flat array — client builds the tree from parentId.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: [asc(categories.sortOrder)],
    });

    return NextResponse.json(allCategories);
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

/**
 * POST /api/admin/categories
 *
 * Create a new category.
 * Body: { name, slug?, description?, parentId?, icon?, sortOrder? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { name, slug, description, parentId, icon, sortOrder } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const [created] = await db.insert(categories).values({
      name,
      slug: slug || generateSlug(name),
      description: description || null,
      parentId: parentId || null,
      icon: icon || null,
      sortOrder: sortOrder ?? 0,
    }).returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
