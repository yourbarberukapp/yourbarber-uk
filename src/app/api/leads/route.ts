import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBetaSignupNotification, sendBetaConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, phone, shopName, challenge } = await req.json();

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Name, email and phone are required' }, { status: 400 });
  }

  const existing = await db.demoLead.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyRegistered: true });
  }

  await db.demoLead.create({
    data: { name, email, phone, shopName: shopName || '', approved: true, approvedAt: new Date() },
  });

  await Promise.allSettled([
    sendBetaSignupNotification({ name, email, phone, shopName: shopName || '', challenge: challenge || '' }),
    sendBetaConfirmationEmail({ name, email }),
  ]);

  return NextResponse.json({ ok: true });
}
