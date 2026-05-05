import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBetaSignupNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { name, email, phone, shopName, chairs, barberCount, employmentType, postcode, commsPreference, challenge } = await req.json();

  if (!name || !email || !phone) {
    return NextResponse.json({ error: 'Name, email and phone are required' }, { status: 400 });
  }

  const existing = await db.demoLead.findFirst({ where: { email } });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyRegistered: true });
  }

  await db.demoLead.create({
    data: {
      name,
      email,
      phone,
      shopName: shopName || '',
      chairs: chairs ? Number(chairs) : null,
      barberCount: barberCount ? Number(barberCount) : null,
      employmentType: employmentType || null,
      postcode: postcode || null,
      commsPreference: commsPreference || null,
      challenge: challenge || null,
      approved: false,
    },
  });

  // Notify Luke — no user confirmation email until approved
  await sendBetaSignupNotification({ name, email, phone, shopName: shopName || '', challenge: challenge || '' }).catch(() => null);

  return NextResponse.json({ ok: true });
}
