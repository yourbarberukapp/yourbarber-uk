import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/vonage';
import { buildSmsMessage } from '@/lib/reminders';

const sendSchema = z.object({
  customerIds: z.array(z.string()).min(1).max(200),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, name: barberName } = session.user as any;

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.findUnique({ where: { id: shopId }, select: { name: true } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customers = await db.customer.findMany({
    where: { id: { in: parsed.data.customerIds }, shopId, smsOptIn: 'yes' },
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

  const results = await Promise.allSettled(
    customers.map(async customer => {
      const recentBarberName = customer.visits[0]?.barber?.name ?? barberName;
      const message = buildSmsMessage({
        name: customer.name,
        shopName: shop.name,
        barberName: recentBarberName,
        accessCode: customer.accessCode,
      });
      const { messageId, status } = await sendSms(customer.phone, message);
      await db.smsLog.create({
        data: { shopId, customerId: customer.id, message, twilioSid: messageId, status },
      });
      return { customerId: customer.id };
    })
  );

  return NextResponse.json({
    sent: results.filter(r => r.status === 'fulfilled').length,
    failed: results.filter(r => r.status === 'rejected').length,
  });
}
