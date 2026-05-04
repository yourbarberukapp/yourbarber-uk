import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

function generateSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'shop';
}

export async function POST(req: NextRequest) {
  const { email, password, name, shopName } = await req.json();

  if (!email || !password || !name || !shopName) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  // Must be on the approved beta list
  const lead = await db.demoLead.findFirst({ where: { email, approved: true } });
  if (!lead) {
    return NextResponse.json({ error: 'This email is not on the approved beta list. Apply at yourbarber.uk first.' }, { status: 403 });
  }

  const existing = await db.barber.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

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
      name: name.trim(),
      email,
      passwordHash,
      role: 'owner',
    },
  });

  return NextResponse.json({ ok: true });
}
