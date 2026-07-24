import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { generateUniqueOwnerPasscode } from '@/lib/ownerPasscode';
import { checkRateLimit } from '@/lib/rateLimit';

function getClientIp(): string {
  const h = headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return h.get('x-real-ip') || 'unknown';
}

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'shop';
}

export async function POST(req: NextRequest) {
  // Open, unauthenticated by design — throttle against scripted shop creation.
  const rl = await checkRateLimit('signup', getClientIp(), { windowMs: 60 * 60 * 1000, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many signups from this network. Try again later.' }, { status: 429 });
  }

  const { shopName, yourName } = await req.json();
  if (!shopName?.trim() || !yourName?.trim()) {
    return NextResponse.json({ error: 'Shop name and your name are required' }, { status: 400 });
  }

  let slug = generateSlug(shopName);
  const existingShop = await db.shop.findUnique({ where: { slug } });
  if (existingShop) {
    slug = `${slug}-${randomBytes(3).toString('hex')}`;
  }

  const passcode = await generateUniqueOwnerPasscode();

  const shop = await db.shop.create({
    data: { name: shopName.trim(), slug },
  });

  await db.barber.create({
    data: {
      shopId: shop.id,
      name: yourName.trim(),
      email: `${slug}-owner@yourbarber.uk`, // placeholder — no email captured, kept unique for the schema's email/shop constraint
      passwordHash: 'PASSCODE',
      role: 'owner',
      ownerPasscode: passcode,
    },
  });

  return NextResponse.json({ ok: true, shopSlug: slug, shopName: shopName.trim(), passcode });
}
