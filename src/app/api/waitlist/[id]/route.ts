import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({
  status: z.enum(['waiting', 'in_progress', 'done', 'no_show']),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

  const walkIn = await db.walkIn.findFirst({ where: { id: params.id, shopId } });
  if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status } = parsed.data;
  const updated = await db.walkIn.update({
    where: { id: params.id },
    data: {
      status,
      startedAt: status === 'in_progress' ? new Date() : undefined,
      doneAt: (status === 'done' || status === 'no_show') ? new Date() : undefined,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const walkIn = await db.walkIn.findFirst({ where: { id: params.id, shopId } });
  if (!walkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.walkIn.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
