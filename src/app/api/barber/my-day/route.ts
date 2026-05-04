import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: barberId, shopId } = session.user as any;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [appointments, barber] = await Promise.all([
    db.appointment.findMany({
      where: {
        shopId,
        barberId,
        scheduledAt: { gte: todayStart, lte: todayEnd },
        status: { not: 'cancelled' },
      },
      orderBy: { scheduledAt: 'asc' },
      select: {
        scheduledAt: true,
        duration: true,
        notes: true,
        customer: { select: { id: true, name: true } },
        service: { select: { name: true } },
      },
    }),
    db.barber.findUnique({
      where: { id: barberId },
      select: { name: true, shop: { select: { name: true } } },
    }),
  ]);

  if (!barber) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const customerIds = [...new Set(appointments.map(a => a.customer.id))];
  const lastVisits = await db.visit.findMany({
    where: { customerId: { in: customerIds }, barberId },
    orderBy: { visitedAt: 'desc' },
    distinct: ['customerId'],
    select: { customerId: true, cutDetails: true, notes: true },
  });
  const passportMap = new Map(lastVisits.map(v => [v.customerId, v]));

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const lines: string[] = [
    `📋 *${barber.name}'s Day — ${today}*`,
    `📍 ${barber.shop.name}`,
    `━━━━━━━━━━━━━━━━`,
  ];

  if (appointments.length === 0) {
    lines.push('No appointments booked today.');
  } else {
    appointments.forEach((a, i) => {
      const time = new Date(a.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      const client = a.customer.name || 'Client';
      const service = a.service?.name || 'Cut';
      const passport = passportMap.get(a.customer.id);
      const details = passport?.cutDetails as Record<string, string> | null;
      const passportLine = details?.style
        ? `   ✂️ Last: ${[details.style, details.top && `Top ${details.top}`, details.sides && `Sides ${details.sides}`].filter(Boolean).join(', ')}`
        : passport
          ? `   ✂️ ${passport.notes || 'No passport notes'}`
          : `   🆕 First visit`;

      lines.push(`\n*${i + 1}. ${time} — ${client}*`);
      lines.push(`   ${service} · ${a.duration} min`);
      lines.push(passportLine);
      if (a.notes) lines.push(`   📝 Note: ${a.notes}`);
    });
    lines.push(`\n━━━━━━━━━━━━━━━━`);
    lines.push(`${appointments.length} appointment${appointments.length !== 1 ? 's' : ''} total`);
  }

  return NextResponse.json({ text: lines.join('\n') });
}
