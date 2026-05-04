import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { slug, name, address, googleMapsUrl, openingHours } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Only allow updating the authenticated user's own shop
    const shop = await db.shop.findUnique({ where: { slug }, select: { id: true } });
    if (!shop || shop.id !== shopId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updatedShop = await db.shop.update({
      where: { slug },
      data: {
        name: name || undefined,
        address: address || undefined,
        googleMapsUrl: googleMapsUrl || undefined,
        openingHours: openingHours || undefined,
      },
    });

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error) {
    console.error('Failed to override shop:', error);
    return NextResponse.json({ error: 'Failed to update shop' }, { status: 500 });
  }
}
