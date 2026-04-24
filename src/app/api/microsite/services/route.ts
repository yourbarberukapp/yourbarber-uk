import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.string().max(20).optional(),
  duration: z.number().int().positive().optional(),
  description: z.string().max(300).optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const services = await db.shopService.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(services);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const service = await db.shopService.create({ data: { shopId, ...parsed.data } });
  return NextResponse.json(service, { status: 201 });
}
