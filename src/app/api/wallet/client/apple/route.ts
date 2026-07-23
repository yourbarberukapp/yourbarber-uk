import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateClientApplePass } from '@/lib/wallet/passGenerator';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopSlug = searchParams.get('shop');
  const phone = searchParams.get('phone');

  if (!shopSlug || !phone) {
    return NextResponse.json({ error: 'Missing shop or phone parameter' }, { status: 400 });
  }

  const shop = await db.shop.findUnique({ where: { slug: shopSlug } });
  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const customer = await db.customer.findUnique({
    where: { phone_shopId: { phone, shopId: shop.id } },
  });

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const accessCode = customer.accessCode || customer.id.slice(-6);

  const { pkpassBuffer, serialNumber } = await generateClientApplePass({
    shopName: shop.name,
    shopSlug: shop.slug,
    accentColor: shop.passAccentColor || '#111111',
    customerName: customer.name || 'Valued Client',
    phone: customer.phone,
    accessCode,
    loyaltyStamps: customer.loyaltyStamps || 0,
    loyaltyTarget: shop.loyaltyTarget || 5,
    loyaltyReward: shop.loyaltyReward || '50% Off 5th Cut',
    promoMessage: shop.promoMessage,
  });

  return new NextResponse(new Uint8Array(pkpassBuffer), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${shop.slug}-card.pkpass"`,
    },
  });
}
