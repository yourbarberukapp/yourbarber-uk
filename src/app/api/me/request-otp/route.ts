import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';

const schema = z.object({ phone: z.string().min(7) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid phone' }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);

  const customers = await db.customer.findMany({ where: { phone } });
  if (customers.length === 0) {
    return NextResponse.json({ error: 'No account found for this number.' }, { status: 404 });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await db.customer.updateMany({
    where: { phone },
    data: { otpCode, otpExpiry },
  });

  // In production: send SMS via Twilio here.
  // For now, return the code so the demo works without SMS.
  return NextResponse.json({ ok: true, demo: true, otpCode });
}
