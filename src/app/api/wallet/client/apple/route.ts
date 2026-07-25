import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { generateClientApplePass } from '@/lib/wallet/passGenerator';
import { getQueueStatusForCustomer } from '@/lib/wallet/queueStatus';

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let customer = await db.customer.findUnique({
    where: { id: session.customerId },
    include: { shop: true },
  });
  if (!customer || !customer.accessCode) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }
  const accessCode = customer.accessCode;

  const serialNumber = `yb-client-${accessCode}`;
  if (!customer.passAuthToken || customer.applePassSerialNumber !== serialNumber) {
    customer = await db.customer.update({
      where: { id: customer.id },
      data: {
        passAuthToken: customer.passAuthToken ?? randomUUID(),
        applePassSerialNumber: serialNumber,
      },
      include: { shop: true },
    });
  }

  const { shop } = customer;
  const queue = await getQueueStatusForCustomer(shop.id, customer.id);

  const { pkpassBuffer } = await generateClientApplePass({
    shopName: shop.name,
    shopSlug: shop.slug,
    accentColor: shop.passAccentColor || '#111111',
    customerName: customer.name || 'Valued Client',
    phone: customer.phone,
    accessCode,
    loyaltyStamps: customer.loyaltyStamps || 0,
    loyaltyTarget: shop.loyaltyTarget || 5,
    loyaltyReward: shop.loyaltyReward || '50% Off 5th Cut',
    promoMessage: customer.passMessage || shop.promoMessage,
    queuePosition: queue?.position ?? null,
    waitMinutes: queue?.waitMinutes ?? null,
    passAuthToken: customer.passAuthToken,
    logoUrl: shop.logoUrl,
    stripUrl: shop.passStripUrl,
  });

  return new NextResponse(new Uint8Array(pkpassBuffer), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${shop.slug}-card.pkpass"`,
    },
  });
}
