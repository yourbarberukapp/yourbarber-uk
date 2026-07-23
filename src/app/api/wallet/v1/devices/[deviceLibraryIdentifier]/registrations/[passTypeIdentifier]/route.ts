import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type Params = { deviceLibraryIdentifier: string; passTypeIdentifier: string };

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { deviceLibraryIdentifier, passTypeIdentifier } = params;
  const since = req.nextUrl.searchParams.get('passesUpdatedSince');

  const devices = await db.walletDevice.findMany({
    where: { deviceLibraryIdentifier, passTypeIdentifier },
    select: { serialNumber: true, customer: { select: { passUpdatedAt: true } } },
  });

  const sinceDate = since ? new Date(since) : null;
  const serialNumbers = devices
    .filter(d => !sinceDate || !d.customer.passUpdatedAt || d.customer.passUpdatedAt > sinceDate)
    .map(d => d.serialNumber);

  if (serialNumbers.length === 0) return NextResponse.json({}, { status: 204 });

  return NextResponse.json({
    serialNumbers,
    lastUpdated: new Date().toISOString(),
  });
}
