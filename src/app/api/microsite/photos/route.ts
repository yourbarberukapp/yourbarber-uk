import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const createSchema = z.object({
  url: z.string().url(),
  caption: z.string().max(150).optional(),
  sortOrder: z.number().int().default(0),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const photos = await db.shopPhoto.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(photos);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const photo = await db.shopPhoto.create({ data: { shopId, ...parsed.data } });
  return NextResponse.json(photo, { status: 201 });
}
