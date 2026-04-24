import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  price: z.string().max(20).optional(),
  duration: z.number().int().positive().optional(),
  description: z.string().max(300).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = await db.shopService.findFirst({ where: { id: params.id, shopId } });
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await db.shopService.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = await db.shopService.findFirst({ where: { id: params.id, shopId } });
  if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.shopService.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
