import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateOwnerGooglePass } from '@/lib/wallet/passGenerator';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const barberId = (session.user as any).id as string;
  let barber = await db.barber.findUnique({
    where: { id: barberId },
    include: { shop: true },
  });
  if (!barber || !barber.ownerPasscode) {
    return NextResponse.json({ error: 'No owner passcode on this account' }, { status: 404 });
  }
  const passcode = barber.ownerPasscode;

  const serialNumber = `yb-owner-${passcode}`;
  if (!barber.ownerPassAuthToken || barber.ownerPassSerialNumber !== serialNumber) {
    barber = await db.barber.update({
      where: { id: barber.id },
      data: {
        ownerPassAuthToken: barber.ownerPassAuthToken ?? randomUUID(),
        ownerPassSerialNumber: serialNumber,
      },
      include: { shop: true },
    });
  }

  const { shop } = barber;

  const { saveUrl } = await generateOwnerGooglePass({
    shopName: shop.name,
    shopSlug: shop.slug,
    accentColor: shop.passAccentColor || '#111111',
    ownerName: barber.name,
    passcode,
    role: barber.role === 'barber' ? 'barber' : 'owner',
    logoUrl: shop.logoUrl,
    stripUrl: shop.passStripUrl,
  });

  return NextResponse.json({ saveUrl });
}
