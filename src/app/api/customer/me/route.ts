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
      shop: { select: { name: true, address: true } },
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          visitedAt: true,
          notes: true,
          cutDetails: true,
          recommendation: true,
          barber: { select: { name: true } },
          photos: { select: { id: true, url: true, angle: true } },
        },
      },
    },
  });

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}
