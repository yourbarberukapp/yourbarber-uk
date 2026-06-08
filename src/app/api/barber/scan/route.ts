import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.shopId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const customer = await db.customer.findFirst({
    where: {
      accessCode: code,
      shopId: session.shopId,
    },
    select: { id: true, name: true },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({ customerId: customer.id, customerName: customer.name });
}
