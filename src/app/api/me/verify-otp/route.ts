import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizePhone } from '@/lib/customerHelpers';
import { signCustomerToken, CUSTOMER_COOKIE } from '@/lib/customerSession';

const schema = z.object({
  phone: z.string().min(7),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const phone = normalizePhone(parsed.data.phone);
  const { otp } = parsed.data;

  const customer = await db.customer.findFirst({
    where: {
      phone,
      otpCode: otp,
      otpExpiry: { gte: new Date() },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Incorrect or expired code.' }, { status: 401 });
  }

  await db.customer.updateMany({
    where: { phone },
    data: { otpCode: null, otpExpiry: null },
  });

  const token = signCustomerToken(phone);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  });
  return response;
}
