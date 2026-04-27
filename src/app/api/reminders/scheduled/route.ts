import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDueForReminder, buildSmsMessage } from '@/lib/reminders';
import { sendSms } from '@/lib/twilio';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const shops = await db.shop.findMany({
    where: { subscriptionStatus: 'active' },
    select: { id: true, name: true },
  });

  let totalSent = 0, totalFailed = 0;

  for (const shop of shops) {
    const customers = await db.customer.findMany({
      where: { shopId: shop.id, smsOptIn: 'yes', lastVisitAt: { not: null } },
      select: {
        id: true, phone: true, name: true, lastVisitAt: true, accessCode: true,
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 1,
          select: { barber: { select: { name: true } } },
        },
      },
    });

    for (const customer of customers.filter(c => isDueForReminder(c.lastVisitAt, 'yes'))) {
      const recentLog = await db.smsLog.findFirst({
        where: {
          customerId: customer.id,
          shopId: shop.id,
          sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });
      if (recentLog) continue;

      try {
        const barberName = customer.visits[0]?.barber?.name ?? shop.name;
        const message = buildSmsMessage({ name: customer.name, shopName: shop.name, barberName, accessCode: customer.accessCode });
        const { messageId, status } = await sendSms(customer.phone, message);
        await db.smsLog.create({ data: { shopId: shop.id, customerId: customer.id, message, twilioSid: messageId, status } });
        totalSent++;
      } catch { totalFailed++; }
    }
  }

  return NextResponse.json({ sent: totalSent, failed: totalFailed });
}
