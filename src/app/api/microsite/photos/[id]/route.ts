import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const photo = await db.shopPhoto.findFirst({ where: { id: params.id, shopId } });
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.shopPhoto.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
