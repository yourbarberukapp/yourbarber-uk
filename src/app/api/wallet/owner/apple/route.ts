import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateOwnerApplePass } from '@/lib/wallet/passGenerator';

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

  const { pkpassBuffer } = await generateOwnerApplePass({
    shopName: shop.name,
    shopSlug: shop.slug,
    accentColor: shop.passAccentColor || '#111111',
    ownerName: barber.name,
    passcode,
    passAuthToken: barber.ownerPassAuthToken,
  });

  return new NextResponse(new Uint8Array(pkpassBuffer), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename="${shop.slug}-owner-card.pkpass"`,
      // TEMPORARY diagnostic — booleans/lengths only, never the secret values.
      // Remove once cert env vars are confirmed reaching the runtime correctly.
      'X-Debug-Cert-Set': String(!!process.env.APPLE_PASS_CERT_PEM),
      'X-Debug-Key-Set': String(!!process.env.APPLE_PASS_KEY_PEM),
      'X-Debug-Wwdr-Set': String(!!process.env.APPLE_WWDR_PEM),
      'X-Debug-Cert-Len': String(process.env.APPLE_PASS_CERT_PEM?.length ?? 0),
      'X-Debug-Key-Len': String(process.env.APPLE_PASS_KEY_PEM?.length ?? 0),
      'X-Debug-Wwdr-Len': String(process.env.APPLE_WWDR_PEM?.length ?? 0),
    },
  });
}
