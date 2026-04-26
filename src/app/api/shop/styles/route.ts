import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId } = session.user as any;

  const includeInactive = req.nextUrl.searchParams.get('all') === '1';

  const styles = await db.shopStyle.findMany({
    where: { shopId, ...(includeInactive ? {} : { active: true }) },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    select: { id: true, name: true, category: true, sortOrder: true, active: true, imageUrl: true },
  });

  return NextResponse.json({ styles });
}

const addSchema = z.object({
  name: z.string().min(1).max(80),
  category: z.enum(['fade', 'taper', 'classic', 'natural', 'beard']),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = addSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const maxOrder = await db.shopStyle.aggregate({
    where: { shopId, category: parsed.data.category },
    _max: { sortOrder: true },
  });

  const style = await db.shopStyle.upsert({
    where: { shopId_name: { shopId, name: parsed.data.name } },
    update: { active: true, category: parsed.data.category },
    create: {
      shopId,
      name: parsed.data.name,
      category: parsed.data.category,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      active: true,
    },
  });

  return NextResponse.json({ style }, { status: 201 });
}
