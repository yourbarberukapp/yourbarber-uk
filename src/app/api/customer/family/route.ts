import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Members owned by this customer
    const ownedMembers = await db.familyMember.findMany({
      where: { customerId: session.customerId },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Members shared with this customer's phone number
    const me = await db.customer.findUnique({
      where: { id: session.customerId },
      select: { phone: true, shopId: true },
    });

    let sharedMembers: any[] = [];
    if (me) {
      const sharings = await db.familySharing.findMany({
        where: {
          sharedWithPhone: me.phone,
          owner: { shopId: me.shopId }, // Only share within the same shop
        },
        include: {
          owner: {
            include: {
              familyMembers: true,
            },
          },
        },
      });

      sharedMembers = sharings.flatMap((s) =>
        s.owner.familyMembers.map((m) => ({
          ...m,
          isShared: true,
          sharedBy: s.owner.name || s.owner.phone,
        }))
      );
    }

    return NextResponse.json([...ownedMembers, ...sharedMembers]);
  } catch (error) {
    console.error('Customer family GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name } = await req.json();
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    const member = await db.familyMember.create({
      data: {
        customerId: session.customerId,
        name: name.trim(),
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Customer family POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
