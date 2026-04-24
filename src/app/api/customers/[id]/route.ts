import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const patchSchema = z.object({
  name: z.string().max(100).optional(),
  smsOptIn: z.enum(['yes', 'no', 'not_asked']).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const customer = await db.customer.findFirst({
    where: { id: params.id, shopId },
    include: {
      visits: {
        orderBy: { visitedAt: 'desc' },
        take: 10,
        include: { photos: true, barber: { select: { name: true } } },
      },
    },
  });
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const result = await db.customer.updateMany({
    where: { id: params.id, shopId },
    data: parsed.data,
  });
  if (result.count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
