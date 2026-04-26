import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await db.shopStyle.findUnique({ where: { id: params.id } });
  if (!existing || existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const style = await db.shopStyle.update({
    where: { id: params.id },
    data: {
      ...(typeof body.active === 'boolean' && { active: body.active }),
      ...(typeof body.name === 'string' && { name: body.name }),
      ...(typeof body.imageUrl === 'string' && { imageUrl: body.imageUrl }),
    },
  });

  return NextResponse.json({ style });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await db.shopStyle.findUnique({ where: { id: params.id } });
  if (!existing || existing.shopId !== shopId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await db.shopStyle.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
