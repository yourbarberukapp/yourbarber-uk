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
  const shop = await db.shop.findUnique({ where: { slug: parsed.data.shopSlug }, select: { id: true } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customer = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId: shop.id } },
    select: { id: true },
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
    orderBy: { arrivedAt: 'desc' },
  });
  if (!walkIn) return NextResponse.json({ error: 'Walk-in not found' }, { status: 404 });

  const updated = await db.walkIn.update({
    where: { id: walkIn.id },
    data: {
      isAway: true,
      returnByMinutes: 20,
    },
  });

  return NextResponse.json({ success: true, walkIn: updated });
}
