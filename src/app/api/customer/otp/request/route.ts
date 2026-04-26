import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendSms } from '@/lib/vonage';

export async function POST(req: NextRequest) {
  try {
    const { phone, shopSlug } = await req.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Find the shop
    let shopId: string | undefined;
    if (shopSlug) {
      const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
      if (shop) shopId = shop.id;
    }

    if (!shopId) {
      // If no shop context, find the most recent shop the user interacted with, 
      // or just pick the first one for now (or error out)
      const defaultShop = await db.shop.findFirst({ orderBy: { createdAt: 'asc' } });
      if (defaultShop) shopId = defaultShop.id;
    }

    if (!shopId) {
      return NextResponse.json({ error: 'Shop context required' }, { status: 400 });
    }

    // Clean phone number (keep only digits)
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Generate 5-digit code
    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create customer
    let customer = await db.customer.findUnique({
      where: { phone_shopId: { phone: cleanPhone, shopId } }
    });

    if (!customer) {
      // Generate legacy 5-digit alphanumeric code for backward compatibility
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
      let legacyCode = '';
      for (let i = 0; i < 5; i++) legacyCode += chars.charAt(Math.floor(Math.random() * chars.length));

      customer = await db.customer.create({
        data: {
          phone: cleanPhone,
          shopId,
          otpCode,
          otpExpiry,
          accessCode: legacyCode,
          smsOptIn: 'yes',
        }
      });
    } else {
      await db.customer.update({
        where: { id: customer.id },
        data: { otpCode, otpExpiry }
      });
    }

    // Send SMS
    const message = `Your YourBarber verification code is: ${otpCode}. It expires in 10 minutes.`;
    await sendSms(cleanPhone, message);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('OTP Request Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
