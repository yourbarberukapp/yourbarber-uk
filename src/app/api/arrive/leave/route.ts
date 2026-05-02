import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';

const schema = z.object({
  shopSlug: z.string(),
  phone: z.string().min(7),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { shopSlug, phone: rawPhone } = parsed.data;
  const phone = normalizePhone(rawPhone);

  const shop = await db.shop.findUnique({
    where: { slug: shopSlug },
    select: { id: true },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customer = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId: shop.id } },
    select: { id: true },
  });
  if (!customer) return NextResponse.json({ ok: true }); // nothing to delete

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await db.walkIn.deleteMany({
    where: {
      shopId: shop.id,
      customerId: customer.id,
      arrivedAt: { gte: today },
      status: { in: ['waiting', 'in_progress'] },
    },
  });

  return NextResponse.json({ ok: true });
}
