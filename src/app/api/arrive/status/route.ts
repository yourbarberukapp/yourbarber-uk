import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';

const schema = z.object({
  shopSlug: z.string(),
  phone: z.string().min(7).max(20),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  const shop = await db.shop.findUnique({
    where: { slug: parsed.data.shopSlug },
    include: { barbers: { where: { isActive: true }, select: { id: true } } },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customer = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId: shop.id } },
    select: { id: true, name: true },
  });
  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const walkIn = await db.walkIn.findFirst({
    where: {
      shopId: shop.id,
      customerId: customer.id,
      status: { in: ['waiting', 'in_progress'] },
      arrivedAt: { gte: today },
    },
    orderBy: { arrivedAt: 'asc' },
  });

  if (!walkIn) {
    return NextResponse.json({ active: false, customerName: customer.name });
  }

  const waitingAheadOrSelf = await db.walkIn.count({
    where: {
      shopId: shop.id,
      status: 'waiting',
      arrivedAt: { gte: today, lte: walkIn.arrivedAt },
    },
  });

  const busyCount = await db.walkIn.count({
    where: {
      shopId: shop.id,
      status: 'in_progress',
      arrivedAt: { gte: today },
    },
  });

  const barberCount = Math.max(shop.barbers.length, 1);
  const cutTime = shop.defaultCutTime ?? 20;
  const waitingAhead = walkIn.status === 'waiting' ? Math.max(waitingAheadOrSelf - 1, 0) : 0;
  const waitMinutes = walkIn.status === 'in_progress'
    ? 0
    : Math.ceil(((waitingAhead + busyCount) / barberCount) * cutTime);

  return NextResponse.json({
    active: true,
    customerName: customer.name,
    status: walkIn.status,
    position: walkIn.status === 'waiting' ? waitingAheadOrSelf : 0,
    waitMinutes,
    holdPlace: walkIn.isAway,
  });
}
