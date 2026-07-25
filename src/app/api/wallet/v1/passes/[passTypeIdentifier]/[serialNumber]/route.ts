import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateClientApplePass, generateOwnerApplePass } from '@/lib/wallet/passGenerator';
import { getQueueStatusForCustomer } from '@/lib/wallet/queueStatus';

function extractAuthToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^ApplePass (.+)$/);
  return match ? match[1] : null;
}

type Params = { passTypeIdentifier: string; serialNumber: string };

async function handleOwnerPass(serialNumber: string, token: string) {
  const barber = await db.barber.findUnique({
    where: { ownerPassSerialNumber: serialNumber },
    include: { shop: true },
  });
  if (!barber || barber.ownerPassAuthToken !== token || !barber.ownerPasscode) {
    return NextResponse.json({}, { status: 401 });
  }

  const { pkpassBuffer } = await generateOwnerApplePass({
    shopName: barber.shop.name,
    shopSlug: barber.shop.slug,
    accentColor: barber.shop.passAccentColor || '#111111',
    ownerName: barber.name,
    passcode: barber.ownerPasscode,
    role: barber.role === 'barber' ? 'barber' : 'owner',
    passAuthToken: barber.ownerPassAuthToken,
    logoUrl: barber.shop.logoUrl,
    stripUrl: barber.shop.passStripUrl,
  });

  return new NextResponse(new Uint8Array(pkpassBuffer), {
    status: 200,
    headers: { 'Content-Type': 'application/vnd.apple.pkpass' },
  });
}

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { serialNumber } = params;
  const token = extractAuthToken(req);
  if (!token) return NextResponse.json({}, { status: 401 });

  if (serialNumber.startsWith('yb-owner-')) {
    return handleOwnerPass(serialNumber, token);
  }

  const customer = await db.customer.findUnique({
    where: { applePassSerialNumber: serialNumber },
    include: { shop: true },
  });
  if (!customer || customer.passAuthToken !== token || !customer.accessCode) {
    return NextResponse.json({}, { status: 401 });
  }

  const ifModifiedSince = req.headers.get('if-modified-since');
  if (ifModifiedSince && customer.passUpdatedAt) {
    const since = new Date(ifModifiedSince);
    if (customer.passUpdatedAt <= since) {
      return new NextResponse(null, { status: 304 });
    }
  }

  const { shop } = customer;
  const queue = await getQueueStatusForCustomer(shop.id, customer.id);

  const { pkpassBuffer } = await generateClientApplePass({
    shopName: shop.name,
    shopSlug: shop.slug,
    accentColor: shop.passAccentColor || '#111111',
    customerName: customer.name || 'Valued Client',
    phone: customer.phone,
    accessCode: customer.accessCode,
    loyaltyStamps: customer.loyaltyStamps || 0,
    loyaltyTarget: shop.loyaltyTarget || 5,
    loyaltyReward: shop.loyaltyReward || '50% Off 5th Cut',
    promoMessage: customer.passMessage || shop.promoMessage,
    queuePosition: queue?.position ?? null,
    waitMinutes: queue?.waitMinutes ?? null,
    logoUrl: shop.logoUrl,
    stripUrl: shop.passStripUrl,
  });

  return new NextResponse(new Uint8Array(pkpassBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': (customer.passUpdatedAt ?? customer.createdAt).toUTCString(),
    },
  });
}
