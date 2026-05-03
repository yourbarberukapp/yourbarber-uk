import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBetaSignupNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, shopName } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const existing = await db.demoLead.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyRegistered: true });
  }

  await db.demoLead.create({
    data: { name, email, shopName: shopName || '', phone: '' },
  });

  await sendBetaSignupNotification({ name, email, shopName: shopName || '' }).catch(() => null);

  return NextResponse.json({ ok: true });
}
