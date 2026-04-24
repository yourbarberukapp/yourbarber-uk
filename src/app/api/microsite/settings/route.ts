import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

const daySchema = z.object({
  open: z.string(),
  close: z.string(),
  closed: z.boolean(),
});

const updateSchema = z.object({
  phone: z.string().max(20).optional(),
  about: z.string().max(1000).optional(),
  coverPhotoUrl: z.string().url().optional().or(z.literal('')),
  googleMapsUrl: z.string().url().optional().or(z.literal('')),
  bookingUrl: z.string().url().optional().or(z.literal('')),
  openingHours: z.object({
    mon: daySchema, tue: daySchema, wed: daySchema, thu: daySchema,
    fri: daySchema, sat: daySchema, sun: daySchema,
  }).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;

  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: {
      name: true, slug: true, address: true, phone: true, about: true,
      coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true,
      photos: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, caption: true, sortOrder: true } },
      services: { where: { isActive: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, price: true, duration: true, description: true, sortOrder: true } },
      barbers: { where: { isActive: true }, select: { id: true, name: true, role: true, bio: true, photoUrl: true } },
    },
  });
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const shop = await db.shop.update({
    where: { id: shopId },
    data: parsed.data,
    select: { name: true, slug: true, phone: true, about: true, coverPhotoUrl: true, googleMapsUrl: true, bookingUrl: true, openingHours: true },
  });
  return NextResponse.json(shop);
}
