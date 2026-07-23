import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function extractAuthToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^ApplePass (.+)$/);
  return match ? match[1] : null;
}

type Params = { deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string };

export async function POST(req: NextRequest, { params }: { params: Params }) {
  const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = params;
  const token = extractAuthToken(req);
  if (!token) return NextResponse.json({}, { status: 401 });

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
