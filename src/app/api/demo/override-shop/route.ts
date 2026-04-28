import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { slug, name, address, googleMapsUrl, openingHours } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
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
