import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;

  // Ensure the member belongs to the session customer
  const member = await db.familyMember.findUnique({
    where: { id },
  });

  if (!member || member.customerId !== session.customerId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.familyMember.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
