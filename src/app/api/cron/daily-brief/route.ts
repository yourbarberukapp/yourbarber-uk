import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendDailyBriefEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Find all barbers across active shops who have appointments today
  const barbers = await db.barber.findMany({
    where: {
      isActive: true,
      shop: { subscriptionStatus: 'active' },
      appointments: {
        some: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { not: 'cancelled' },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      shop: { select: { name: true } },
      appointments: {
        where: {
          scheduledAt: { gte: todayStart, lte: todayEnd },
          status: { not: 'cancelled' },
        },
        orderBy: { scheduledAt: 'asc' },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
          notes: true,
          status: true,
          customer: { select: { id: true, name: true, phone: true } },
          service: { select: { name: true } },
        },
      },
    },
  });

  if (barbers.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No appointments today' });
  }

  // For each barber, fetch last cut passport per customer
  const results = await Promise.allSettled(
    barbers.map(async (barber) => {
      const customerIds = Array.from(new Set(barber.appointments.map(a => a.customer.id)));

      const lastVisits = await db.visit.findMany({
        where: {
          customerId: { in: customerIds },
          barberId: barber.id,
        },
        orderBy: { visitedAt: 'desc' },
        distinct: ['customerId'],
        select: {
          customerId: true,
          visitedAt: true,
          cutDetails: true,
          notes: true,
        },
      });

      const passportMap = new Map(lastVisits.map(v => [v.customerId, v]));

      const appointmentsWithPassport = barber.appointments.map(appt => ({
        ...appt,
        lastCut: passportMap.get(appt.customer.id) ?? null,
      }));

      await sendDailyBriefEmail({
        barberName: barber.name,
        barberEmail: barber.email,
        shopName: barber.shop.name,
        appointments: appointmentsWithPassport,
      });

      return barber.email;
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return NextResponse.json({ sent, failed });
}
