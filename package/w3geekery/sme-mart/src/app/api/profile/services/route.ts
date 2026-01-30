import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { serviceOfferings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/profile/services
 *
 * Add a service offering to a provider profile.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, title, description, category, subcategory, pricingType, price, deliveryTime, includes, requirements } = body;

    if (!providerId || !title || !category || !pricingType) {
      return NextResponse.json({ error: 'providerId, title, category, and pricingType required' }, { status: 400 });
    }

    const [service] = await db.insert(serviceOfferings)
      .values({
        providerId,
        title,
        description: description || null,
        category,
        subcategory: subcategory || null,
        pricingType,
        price: price || null,
        deliveryTime: deliveryTime || null,
        includes: includes || null,
        requirements: requirements || null,
      })
      .returning();

    return NextResponse.json(service);
  } catch (error) {
    console.error('Services POST error:', error);
    return NextResponse.json({ error: 'Failed to add service' }, { status: 500 });
  }
}

/**
 * PUT /api/profile/services
 *
 * Update a service offering.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, title, description, category, subcategory, pricingType, price, deliveryTime, includes, requirements, isActive } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'serviceId required' }, { status: 400 });
    }

    const [updated] = await db.update(serviceOfferings)
      .set({
        title: title ?? undefined,
        description: description ?? undefined,
        category: category ?? undefined,
        subcategory: subcategory ?? undefined,
        pricingType: pricingType ?? undefined,
        price: price ?? undefined,
        deliveryTime: deliveryTime ?? undefined,
        includes: includes ?? undefined,
        requirements: requirements ?? undefined,
        isActive: isActive ?? undefined,
      })
      .where(eq(serviceOfferings.id, serviceId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Services PUT error:', error);
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/services?serviceId=X
 *
 * Remove a service offering by ID.
 */
export async function DELETE(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get('serviceId');

  if (!serviceId) {
    return NextResponse.json({ error: 'serviceId required' }, { status: 400 });
  }

  try {
    const [deleted] = await db.delete(serviceOfferings)
      .where(eq(serviceOfferings.id, serviceId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Services DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
  }
}
