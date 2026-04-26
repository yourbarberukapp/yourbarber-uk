import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { signCustomerToken, customerCookieOptions } from '@/lib/customerAuth';

const schema = z.object({ 
  code: z.string().length(5),
  phone: z.string().optional(),
  shopSlug: z.string().optional()
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { code, phone, shopSlug } = parsed.data;

  // Try finding by OTP first (new flow)
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Find the shop if provided
    let shopId: string | undefined;
    if (shopSlug) {
      const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
      if (shop) shopId = shop.id;
    }

    const customer = await db.customer.findFirst({
      where: {
        phone: cleanPhone,
        ...(shopId ? { shopId } : {}),
        otpCode: code,
        otpExpiry: { gte: new Date() }
      }
    });

    if (customer) {
      // Clear OTP after successful use
      await db.customer.update({
        where: { id: customer.id },
        data: { otpCode: null, otpExpiry: null }
      });

      const token = await signCustomerToken(customer.id);
      const response = NextResponse.json({ ok: true, name: customer.name, isNew: !customer.name });
      response.cookies.set(customerCookieOptions(token));
      return response;
    }
  }

  // Fallback to legacy accessCode (ABC12 style)
  const customer = await db.customer.findUnique({
    where: { accessCode: code.toUpperCase() },
    select: { id: true, name: true },
  });

  if (!customer) {
    return NextResponse.json({ error: 'Invalid code or expired' }, { status: 401 });
  }

  const token = await signCustomerToken(customer.id);
  const response = NextResponse.json({ ok: true, name: customer.name });
  response.cookies.set(customerCookieOptions(token));
  return response;
}
