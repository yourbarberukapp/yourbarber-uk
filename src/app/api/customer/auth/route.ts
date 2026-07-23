import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { signCustomerToken, customerCookieOptions } from '@/lib/customerAuth';

const schema = z.object({ code: z.string().length(5) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  // Access code — the same code on the customer's Wallet pass QR and printed card.
  const customer = await db.customer.findUnique({
    where: { accessCode: parsed.data.code.toUpperCase() },
    select: { id: true, name: true },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
  }

  const token = await signCustomerToken(customer.id);
  const response = NextResponse.json({ ok: true, name: customer.name });
  response.cookies.set(customerCookieOptions(token));
  return response;
}
