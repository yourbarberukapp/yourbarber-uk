import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { randomBytes } from 'crypto';
import { sendSetupCompleteEmail } from '@/lib/email';

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'shop';
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!(session.user as any).needsSetup) {
    return NextResponse.json({ error: 'Account already set up' }, { status: 400 });
  }

  const { shopName, yourName } = await req.json();
  if (!shopName?.trim() || !yourName?.trim()) {
    return NextResponse.json({ error: 'Shop name and your name are required' }, { status: 400 });
  }

  const email = session.user.email;

  const existing = await db.barber.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Account already exists' }, { status: 409 });
  }

  let slug = generateSlug(shopName);
  const existingShop = await db.shop.findUnique({ where: { slug } });
  if (existingShop) {
    slug = `${slug}-${randomBytes(3).toString('hex')}`;
  }

  const shop = await db.shop.create({
    data: { name: shopName.trim(), slug },
  });

  await db.barber.create({
    data: {
      shopId: shop.id,
      name: yourName.trim(),
      email,
      passwordHash: 'OAUTH',
      role: 'owner',
    },
  });

  sendSetupCompleteEmail({ name: yourName.trim(), email, shopName: shopName.trim(), shopSlug: slug }).catch(() => null);

  return NextResponse.json({ ok: true, shopSlug: slug, shopName: shopName.trim() });
}
