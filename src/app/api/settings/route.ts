import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isTrustedAssetUrl } from '@/lib/s3';

const select = {
  name: true, address: true, logoUrl: true, slug: true,
  shopType: true, allowBarberReminders: true, defaultCutTime: true, googleReviewUrl: true,
  passStripUrl: true, passAccentColor: true, passLabelColor: true,
};

// logoUrl/passStripUrl are later fetched server-side (Wallet pass artwork
// generation, colour extraction) — restricting them to our own S3 bucket
// host at write time stops this endpoint being used to plant an internal
// or arbitrary URL that gets fetched (SSRF) further down the line.
const trustedAssetUrl = z.string().url().refine(isTrustedAssetUrl, { message: 'Image must be hosted on our storage' });

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(200).optional(),
  logoUrl: trustedAssetUrl.optional().or(z.literal('')),
  shopType: z.string().optional(),
  allowBarberReminders: z.boolean().optional(),
  defaultCutTime: z.number().int().min(5).max(120).optional(),
  googleReviewUrl: z.string().url().optional().or(z.literal('')),
  passStripUrl: trustedAssetUrl.optional().or(z.literal('')),
  passAccentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  passLabelColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const shopId = (session.user as any).shopId as string;
  const shop = await db.shop.findUnique({ where: { id: shopId }, select });
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { shopId, role } = session.user as any;
  if (role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data = {
    ...parsed.data,
    googleReviewUrl: parsed.data.googleReviewUrl || null,
    passStripUrl: parsed.data.passStripUrl === '' ? null : parsed.data.passStripUrl,
  };
  const shop = await db.shop.update({ where: { id: shopId }, data, select });
  return NextResponse.json(shop);
}
