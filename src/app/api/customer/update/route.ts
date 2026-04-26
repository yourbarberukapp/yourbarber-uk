import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is too short' }, { status: 400 });
    }

    await db.customer.update({
      where: { id: session.customerId },
      data: { name: name.trim() }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Customer Update Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
