import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildReminderMessage } from '@/lib/reminders';

const previewSchema = z.object({
  customerId: z.string(),
  reminderType: z.enum(['overdue', 'upcoming']).default('overdue'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { shopId, name: sessionBarberName, role } = session.user as any;
  const body = await req.json();
  const parsed = previewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { name: true, allowBarberReminders: true },
  });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  if (role === 'barber' && !shop.allowBarberReminders) {
    return NextResponse.json({ error: 'Forbidden: Barber reminders are disabled' }, { status: 403 });
  }

  const customer = await db.customer.findFirst({
    where: { id: parsed.data.customerId, shopId },
    select: {
      id: true,
      name: true,
      walletDevices: { select: { id: true }, take: 1 },
      googlePassId: true,
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 1,
        select: { barber: { select: { name: true } } },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const barberName = customer.visits[0]?.barber?.name ?? sessionBarberName ?? shop.name;
  const message = buildReminderMessage({
    name: customer.name,
    shopName: shop.name,
    barberName,
    reminderType: parsed.data.reminderType,
  });

  return NextResponse.json({
    message,
    hasWalletPass: customer.walletDevices.length > 0 || !!customer.googlePassId,
  });
}
