import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function extractAuthToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^ApplePass (.+)$/);
  return match ? match[1] : null;
}

type Params = { deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string };

async function verifyOwnerToken(serialNumber: string, token: string): Promise<boolean> {
  const barber = await db.barber.findUnique({
    where: { ownerPassSerialNumber: serialNumber },
    select: { ownerPassAuthToken: true },
  });
  return !!barber && barber.ownerPassAuthToken === token;
}

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = params;
  const token = extractAuthToken(req);
  if (!token) return NextResponse.json({}, { status: 401 });

  // Owner cards are static (no live queue/loyalty data to push) — accept the
  // registration without a WalletDevice row rather than force a nullable FK
  // onto a table that exists for customer push delivery.
  if (serialNumber.startsWith('yb-owner-')) {
    const ok = await verifyOwnerToken(serialNumber, token);
    return NextResponse.json({}, { status: ok ? 201 : 401 });
  }

  const customer = await db.customer.findUnique({
    where: { applePassSerialNumber: serialNumber },
    select: { id: true, passAuthToken: true },
  });
  if (!customer || customer.passAuthToken !== token) {
    return NextResponse.json({}, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const pushToken = body.pushToken;
  if (!pushToken) return NextResponse.json({}, { status: 400 });

  const existing = await db.walletDevice.findUnique({
    where: { deviceLibraryIdentifier_serialNumber: { deviceLibraryIdentifier, serialNumber } },
  });

  if (existing) {
    await db.walletDevice.update({ where: { id: existing.id }, data: { pushToken } });
    return NextResponse.json({}, { status: 200 });
  }

  await db.walletDevice.create({
    data: { deviceLibraryIdentifier, passTypeIdentifier, serialNumber, pushToken, customerId: customer.id },
  });
  return NextResponse.json({}, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { deviceLibraryIdentifier, serialNumber } = params;
  const token = extractAuthToken(req);
  if (!token) return NextResponse.json({}, { status: 401 });

  if (serialNumber.startsWith('yb-owner-')) {
    const ok = await verifyOwnerToken(serialNumber, token);
    return NextResponse.json({}, { status: ok ? 200 : 401 });
  }

  const customer = await db.customer.findUnique({
    where: { applePassSerialNumber: serialNumber },
    select: { passAuthToken: true },
  });
  if (!customer || customer.passAuthToken !== token) {
    return NextResponse.json({}, { status: 401 });
  }

  await db.walletDevice.deleteMany({ where: { deviceLibraryIdentifier, serialNumber } });
  return NextResponse.json({}, { status: 200 });
}
