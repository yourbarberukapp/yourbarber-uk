import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(200).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  shopType: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const shop = await db.shop.findUnique({ where: { id: shopId }, select: { name: true, address: true, logoUrl: true, slug: true, shopType: true } });
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.update({ where: { id: shopId }, data: parsed.data, select: { name: true, address: true, logoUrl: true, slug: true, shopType: true } });
  return NextResponse.json(shop);
}
