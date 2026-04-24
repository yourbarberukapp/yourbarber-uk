import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role, id: currentId } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (params.id === currentId) return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });

  await db.barber.updateMany({ where: { id: params.id, shopId }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
