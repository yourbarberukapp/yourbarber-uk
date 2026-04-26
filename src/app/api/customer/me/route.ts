import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: {
      id: true,
      name: true,
      phone: true,
      accessCode: true,
      lastVisitAt: true,
      shop: { select: { name: true, address: true, slug: true } },
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          visitedAt: true,
          notes: true,
          cutDetails: true,
          recommendation: true,
          cutRating: true,
          barber: { select: { name: true } },
          photos: { select: { id: true, url: true, angle: true } },
        },
      },
      appointments: {
        where: {
          scheduledAt: { gte: new Date() },
          status: 'booked',
        },
        orderBy: { scheduledAt: 'asc' },
        take: 1,
        select: {
          id: true,
          scheduledAt: true,
          shop: { select: { name: true, slug: true } },
          barber: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}
