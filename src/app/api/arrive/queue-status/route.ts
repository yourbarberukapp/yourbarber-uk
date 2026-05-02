import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const shopSlug = searchParams.get('shopSlug');
  if (!shopSlug) return NextResponse.json({ error: 'shopSlug required' }, { status: 400 });

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true, defaultCutTime: true },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const waitingCount = await db.walkIn.count({
    where: {
      shopId: shop.id,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
  });

  const cutTime = shop.defaultCutTime ?? 20;
  const waitMinutes = waitingCount * cutTime;

  return NextResponse.json(
    { waitingCount, waitMinutes },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
