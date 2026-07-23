import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code missing' }, { status: 400 });

  // Look up customer by accessCode or id suffix
  const customer = await db.customer.findFirst({
    where: {
      shopId,
      OR: [
        { accessCode: code },
        { id: { endsWith: code } },
        { phone: code },
      ],
    },
    select: { id: true, name: true, phone: true, loyaltyStamps: true },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  // Increment loyaltyStamps automatically on scan
  const updatedCustomer = await db.customer.update({
    where: { id: customer.id },
    data: {
      loyaltyStamps: { increment: 1 },
      lastVisitAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    customer: updatedCustomer,
    redirectUrl: `/customers/${customer.id}`,
  });
}
