import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const customer = await db.customer.findUnique({
    where: { id: session.customerId },
    select: {
      smsOptIn: true,
      preferredReminderWeeks: true,
    },
  });

  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(req: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { smsOptIn, preferredReminderWeeks } = await req.json();

  const customer = await db.customer.update({
    where: { id: session.customerId },
    data: {
      smsOptIn,
      preferredReminderWeeks,
    },
  });

  return NextResponse.json({ success: true, customer });
}
