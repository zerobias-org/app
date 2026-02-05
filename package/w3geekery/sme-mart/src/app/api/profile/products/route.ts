import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerProducts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * POST /api/profile/products
 *
 * Add a product to a provider profile.
 * Body: { providerId, zerobiasProductId, proficiencyLevel?, yearsExperience?, certified?, certificationDetails? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, zerobiasProductId, proficiencyLevel, yearsExperience, certified, certificationDetails } = body;

    if (!providerId || !zerobiasProductId) {
      return NextResponse.json(
        { error: 'providerId and zerobiasProductId required' },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await db.query.providerProducts.findFirst({
      where: and(
        eq(providerProducts.providerId, providerId),
        eq(providerProducts.zerobiasProductId, zerobiasProductId)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Product already added to profile' },
        { status: 409 }
      );
    }

    const [product] = await db.insert(providerProducts)
      .values({
        providerId,
        zerobiasProductId,
        proficiencyLevel: proficiencyLevel || null,
        yearsExperience: yearsExperience || null,
        certified: certified || false,
        certificationDetails: certificationDetails || null,
      })
      .returning();

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/products
 *
 * Update a product by ID.
 * Body: { productId, proficiencyLevel?, yearsExperience?, certified?, certificationDetails? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, proficiencyLevel, yearsExperience, certified, certificationDetails } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (proficiencyLevel !== undefined) updateData.proficiencyLevel = proficiencyLevel || null;
    if (yearsExperience !== undefined) updateData.yearsExperience = yearsExperience || null;
    if (certified !== undefined) updateData.certified = certified;
    if (certificationDetails !== undefined) updateData.certificationDetails = certificationDetails || null;

    const [updated] = await db.update(providerProducts)
      .set(updateData)
      .where(eq(providerProducts.id, productId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Products PUT error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/products?productId=X
 *
 * Remove a product by ID.
 */
export async function DELETE(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'productId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(providerProducts)
      .where(eq(providerProducts.id, productId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
