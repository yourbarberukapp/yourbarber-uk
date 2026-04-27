import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { normalizePhone } from '@/lib/customerHelpers';
import { z } from 'zod';

const schema = z.object({
  phone: z.string().min(7).max(20),
  action: z.enum(['add', 'remove']),
});

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sharings = await db.familySharing.findMany({
    where: { ownerId: session.customerId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(sharings);
}

export async function POST(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { phone: rawPhone, action } = parsed.data;
  const phone = normalizePhone(rawPhone);

  const customerId = session.customerId;

  if (action === 'add') {
    // Don't share with self
    const owner = await db.customer.findUnique({ where: { id: customerId } });
    if (owner?.phone === phone) {
      return NextResponse.json({ error: 'Cannot share with yourself' }, { status: 400 });
    }

    const sharing = await db.familySharing.upsert({
      where: { ownerId_sharedWithPhone: { ownerId: customerId, sharedWithPhone: phone } },
      create: { ownerId: customerId, sharedWithPhone: phone },
      update: {},
    });
    return NextResponse.json(sharing);
  } else {
    await db.familySharing.deleteMany({
      where: { ownerId: customerId, sharedWithPhone: phone },
    });
    return NextResponse.json({ success: true });
  }
}
