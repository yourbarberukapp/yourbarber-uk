import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';
import { generateUniqueAccessCode } from '@/lib/accessCode';

const schema = z.object({
  shopSlug: z.string(),
  phone: z.string().min(7).max(20),
  name: z.string().max(100).optional(),
  note: z.string().max(300).optional(),
  preferredStyle: z.string().max(500).optional(),
  final: z.boolean().optional(), // true on the submit call, absent on the lookup call
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { shopSlug, phone: rawPhone, name, note, preferredStyle, final: isFinal } = parsed.data;
  const phone = normalizePhone(rawPhone);

  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  let customer = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId: shop.id } },
  });

  if (!customer) {
    if (!name) return NextResponse.json({ needsName: true });
    const accessCode = await generateUniqueAccessCode();
    customer = await db.customer.create({
      data: { shopId: shop.id, phone, name, accessCode },
    });
  }

  // Lookup call (first step) — just identify the customer, don't create WalkIn yet
  if (!isFinal) {
    if (!customer) return NextResponse.json({ needsName: true });
    return NextResponse.json({ proceedToStyle: true, customerName: customer.name });
  }

  // Don't double-add if already on the active list today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const existing = await db.walkIn.findFirst({
    where: {
      shopId: shop.id,
      customerId: customer.id,
      status: { in: ['waiting', 'in_progress'] },
      arrivedAt: { gte: today },
    },
  });

  if (existing) {
    const position = await db.walkIn.count({
      where: {
        shopId: shop.id,
        status: { in: ['waiting', 'in_progress'] },
        arrivedAt: { lte: existing.arrivedAt },
      },
    });
    return NextResponse.json({ customerName: customer.name, position, alreadyWaiting: true });
  }

  const walkIn = await db.walkIn.create({
    data: {
      shopId: shop.id,
      customerId: customer.id,
      note: note || null,
      preferredStyle: preferredStyle || null,
    },
  });

  const position = await db.walkIn.count({
    where: {
      shopId: shop.id,
      status: { in: ['waiting', 'in_progress'] },
      arrivedAt: { lte: walkIn.arrivedAt },
    },
  });

  return NextResponse.json({ customerName: customer.name, position });
}
