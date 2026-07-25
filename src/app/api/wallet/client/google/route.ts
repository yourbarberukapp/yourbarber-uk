import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCustomerSession } from '@/lib/customerAuth';
import { generateClientGooglePass } from '@/lib/wallet/passGenerator';
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

  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID || 'demo_issuer';
  const objectId = `${issuerId}.card_${accessCode}`;
  if (customer.googlePassId !== objectId) {
    customer = await db.customer.update({
      where: { id: customer.id },
      data: { googlePassId: objectId },
      include: { shop: true },
    });
  }

  const { shop } = customer;
  const queue = await getQueueStatusForCustomer(shop.id, customer.id);

  const { saveUrl } = await generateClientGooglePass({
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
    logoUrl: shop.logoUrl,
    stripUrl: shop.passStripUrl,
  });

  return NextResponse.json({ saveUrl });
}
