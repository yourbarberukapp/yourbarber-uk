import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isDueForReminder, buildReminderMessage } from '@/lib/reminders';
import { notifyCustomer } from '@/lib/wallet/notify';

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
        id: true, name: true, lastVisitAt: true, passUpdatedAt: true,
        visits: {
          orderBy: { visitedAt: 'desc' },
          take: 1,
          select: { barber: { select: { name: true } } },
        },
      },
    });

    for (const customer of customers.filter(c => isDueForReminder(c.lastVisitAt, 'yes'))) {
      if (customer.passUpdatedAt && customer.passUpdatedAt.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
        continue; // Already nudged within the last week
      }

      try {
        const barberName = customer.visits[0]?.barber?.name ?? shop.name;
        const message = buildReminderMessage({ name: customer.name, shopName: shop.name, barberName });
        await notifyCustomer(customer.id, message);
        totalSent++;
      } catch { totalFailed++; }
    }
  }

  return NextResponse.json({ sent: totalSent, failed: totalFailed });
}
