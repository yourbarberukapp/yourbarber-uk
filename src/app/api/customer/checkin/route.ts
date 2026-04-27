import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function POST(req: Request) {
  try {
    const customerSession = await getCustomerSession();
    if (!customerSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { referenceVisitId, styleId, familyMemberIds, includeCustomer = true } = body;

    // Optional: look up the customer's shop to link it
    const customer = await db.customer.findUnique({
      where: { id: customerSession.customerId }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const checkIn = await db.checkIn.create({
      data: {
        customerId: customerSession.customerId,
        shopId: customer.shopId,
        referenceVisitId,
        styleId,
        groupMemberIds: familyMemberIds ? familyMemberIds.join(',') : null,
        includeCustomer,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      },
    });

    return NextResponse.json({ qrToken: checkIn.qrToken });
  } catch (error) {
    console.error('Checkin Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
