import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildSmsMessage } from '@/lib/reminders';

const previewSchema = z.object({
  customerId: z.string(),
  reminderType: z.enum(['overdue', 'upcoming']).default('overdue'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shopId, name: sessionBarberName } = session.user as any;
  const body = await req.json();
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { name: true },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customer = await db.customer.findFirst({
    where: { id: parsed.data.customerId, shopId },
    select: {
      id: true,
      phone: true,
      name: true,
      accessCode: true,
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 1,
        select: { barber: { select: { name: true } } },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const barberName = customer.visits[0]?.barber?.name ?? sessionBarberName ?? shop.name;
  const message = buildSmsMessage({
    name: customer.name,
    shopName: shop.name,
    barberName,
    accessCode: customer.accessCode,
    reminderType: parsed.data.reminderType,
  });

  const previewUrl = customer.accessCode
    ? `${req.nextUrl.origin}/c?code=${customer.accessCode}`
    : null;

  return NextResponse.json({
    message,
    wouldSendToPhone: customer.phone,
    previewUrl,
  });
}
